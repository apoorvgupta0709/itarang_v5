import { z } from 'zod';
import { db } from '@/lib/db';
import { orders, auditLogs, slas } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireRole } from '@/lib/auth-utils';
import { successResponse, withErrorHandler, generateId } from '@/lib/api-utils';
import { triggerN8nWebhook } from '@/lib/n8n';

const uploadInvoiceSchema = z.object({
    invoice_url: z.string().url(),
    amount: z.string().or(z.number()).optional(),
    invoice_number: z.string().optional(),
    invoice_date: z.string().optional(),
});

export const POST = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id: orderId } = await params;

    // BRD: Sales Order Manager uploads invoice (admin override allowed)
    const user = await requireRole(['sales_order_manager', 'ceo', 'business_head', 'sales_head']);

    const body = await req.json();
    const validated = uploadInvoiceSchema.parse(body);

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) throw new Error('Order not found');

    const [updatedOrder] = await db.transaction(async (tx) => {
        const [orderUpdate] = await tx
            .update(orders)
            .set({
                invoice_url: validated.invoice_url,
                // Move into invoice approval stage (BRD step 7)
                order_status: 'invoice_approval_pending' as any,
                updated_at: new Date(),
            })
            .where(eq(orders.id, orderId))
            .returning();

        if (orderUpdate) {
            // Close any active SLA that indicates "pending for invoice" (if you add it later)
            await tx
                .update(slas)
                .set({ status: 'completed', completed_at: new Date() })
                .where(
                    and(
                        eq(slas.entity_id, orderId),
                        eq(slas.workflow_step, 'pending_for_invoice'),
                        eq(slas.status, 'active')
                    )
                );

            // Create SLA for invoice approval (24h)
            const deadline = new Date();
            deadline.setHours(deadline.getHours() + 24);

            await tx.insert(slas).values({
                id: await generateId('SLA', slas),
                entity_type: 'order',
                entity_id: orderId,
                workflow_step: 'invoice_approval',
                status: 'active',
                sla_deadline: deadline,
                assigned_to: user.id, // proxy (can be mapped to actual Sales Head later)
            });

            // Audit log (invoice metadata stored here until you add invoice fields/table)
            await tx.insert(auditLogs).values({
                id: await generateId('AUDIT', auditLogs),
                entity_type: 'order',
                entity_id: orderId,
                action: 'update',
                changes: {
                    invoice_url: validated.invoice_url,
                    invoice_number: validated.invoice_number,
                    invoice_date: validated.invoice_date,
                    invoice_amount: validated.amount?.toString(),
                    order_status: 'invoice_approval_pending',
                },
                performed_by: user.id,
            });
        }

        return [orderUpdate];
    });

    if (!updatedOrder) throw new Error('Order not found');

    // Trigger n8n webhook (optional)
    try {
        await triggerN8nWebhook('invoice-uploaded', {
            order_id: orderId,
            invoice_url: validated.invoice_url,
            invoice_number: validated.invoice_number,
            invoice_date: validated.invoice_date,
            invoice_amount: validated.amount?.toString(),
            uploaded_by: user.name,
        });
    } catch (err) {
        console.error('Webhook failed:', err);
    }

    return successResponse(updatedOrder);
});