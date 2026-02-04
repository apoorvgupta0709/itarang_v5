import { z } from 'zod';
import { db } from '@/lib/db';
import { orders, auditLogs, slas, orderPayments, orderInvoiceVersions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireRole } from '@/lib/auth-utils';
import { successResponse, withErrorHandler, generateId } from '@/lib/api-utils';

const paymentSchema = z.object({
    amount: z.string().or(z.number()),
    mode: z.enum(['cash', 'bank_transfer', 'cheque', 'online']),
    utr: z.string().min(1),
    payment_date: z.string().transform(v => new Date(v)),
});

export const POST = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id: orderId } = await params;
    const user = await requireRole(['finance_controller', 'ceo']);
    const body = await req.json();
    const validated = paymentSchema.parse(body);

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) throw new Error('Order not found');

    // Guard: payment only after invoice approval (Phase-1 BRD)
    if (order.order_status !== 'invoice_approved' && order.order_status !== 'payment_pending' && order.order_status !== 'payment_made') {
        throw new Error('Payment can be recorded only after invoice is approved');
    }

    // Active invoice must exist and be approved
    const [activeInv] = await db.select()
        .from(orderInvoiceVersions)
        .where(and(eq(orderInvoiceVersions.order_id, orderId), eq(orderInvoiceVersions.is_active, true)));

    if (!activeInv || activeInv.status !== 'approved') {
        throw new Error('Approved invoice not found for this order');
    }

    const totalPaid = parseFloat(order.payment_amount) + parseFloat(validated.amount.toString());
    const totalOrder = parseFloat(order.total_amount);

    let paymentStatus: 'partial' | 'paid' = 'partial';
    if (totalPaid >= totalOrder) paymentStatus = 'paid';

    const [updatedOrder] = await db.transaction(async (tx) => {
        // 1) Insert payment transaction (supports multiple)
        await tx.insert(orderPayments).values({
            id: await generateId('PAY', orderPayments),
            order_id: orderId,
            invoice_version_id: activeInv.id,
            amount: validated.amount.toString(),
            mode: validated.mode,
            utr: validated.utr,
            paid_at: validated.payment_date,
            created_by: user.id,
        });

        // 2) Update aggregate on orders (backward compatible)
        const [orderUpdate] = await tx.update(orders)
            .set({
                payment_status: paymentStatus as any,
                payment_amount: totalPaid.toString(),
                payment_mode: validated.mode,
                transaction_id: validated.utr,
                payment_date: validated.payment_date,
                order_status: paymentStatus === 'paid' ? 'payment_made' : 'payment_pending',
                updated_at: new Date(),
            })
            .where(eq(orders.id, orderId))
            .returning();

        // 3) Complete Payment SLA
        await tx.update(slas)
            .set({ status: 'completed', completed_at: new Date() })
            .where(and(
                eq(slas.entity_id, orderId),
                eq(slas.workflow_step, 'procurement_payment'),
                eq(slas.status, 'active')
            ));

        // 4) If fully paid, start challan SLA (24h)
        if (paymentStatus === 'paid') {
            const deadline = new Date();
            deadline.setHours(deadline.getHours() + 24);

            await tx.insert(slas).values({
                id: await generateId('SLA', slas),
                entity_type: 'order',
                entity_id: orderId,
                workflow_step: 'challan_upload',
                status: 'active',
                sla_deadline: deadline,
                assigned_to: user.id,
            });
        }

        return [orderUpdate];
    });

    // Audit log
    await db.insert(auditLogs).values({
        id: await generateId('AUDIT', auditLogs),
        entity_type: 'order',
        entity_id: orderId,
        action: 'update',
        changes: { payment_status: paymentStatus, amount_paid: validated.amount, utr: validated.utr },
        performed_by: user.id,
    });

    return successResponse(updatedOrder);
});