import { z } from 'zod';
import { db } from '@/lib/db';
import { orders, inventory, auditLogs, slas } from '@/lib/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { requireRole } from '@/lib/auth-utils';
import { successResponse, withErrorHandler, generateId } from '@/lib/api-utils';

const uploadChallanSchema = z.object({
    challan_url: z.string().url(),
    challan_number: z.string().optional(),
    challan_date: z.string().optional(),
    ewaybill_number: z.string().optional(),
    ewaybill_date: z.string().optional(),
});

export const POST = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id: orderId } = await params;

    // BRD: Inventory Manager uploads delivery / e-challan
    const user = await requireRole(['inventory_manager', 'ceo', 'business_head']);

    const body = await req.json();
    const validated = uploadChallanSchema.parse(body);

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) throw new Error('Order not found');

    const itemIds = (order.order_items as any[]).map((i) => i.inventory_id);

    const result = await db.transaction(async (tx) => {
        // 1) Update order status to "asset_dispatched" (BRD step 8)
        const [updatedOrder] = await tx
            .update(orders)
            .set({
                order_status: 'asset_dispatched' as any,
                delivery_status: 'in_transit' as any,
                updated_at: new Date(),
            })
            .where(eq(orders.id, orderId))
            .returning();

        // 2) Update inventory with challan details + set status to in_transit
        // NOTE: inventory schema has challan_number + challan_date; challan_url/e-way are captured via audit log until you add columns/table.
        if (itemIds.length > 0) {
            await tx
                .update(inventory)
                .set({
                    status: 'in_transit' as any,
                    challan_number: validated.challan_number,
                    challan_date: validated.challan_date ? new Date(validated.challan_date) : undefined,
                    updated_at: new Date(),
                })
                .where(inArray(inventory.id, itemIds));
        }

        // 3) SLA (optional): complete "payment_pending" if present, create GRN SLA (24h)
        await tx
            .update(slas)
            .set({ status: 'completed', completed_at: new Date() })
            .where(and(eq(slas.entity_id, orderId), eq(slas.workflow_step, 'payment_pending'), eq(slas.status, 'active')));

        const deadline = new Date();
        deadline.setHours(deadline.getHours() + 24);

        await tx.insert(slas).values({
            id: await generateId('SLA', slas),
            entity_type: 'order',
            entity_id: orderId,
            workflow_step: 'grn_creation',
            status: 'active',
            sla_deadline: deadline,
            assigned_to: user.id,
        });

        // 4) Audit log (stores challan_url + e-way details until you add columns/table)
        await tx.insert(auditLogs).values({
            id: await generateId('AUDIT', auditLogs),
            entity_type: 'order',
            entity_id: orderId,
            action: 'update',
            changes: {
                challan_url: validated.challan_url,
                challan_number: validated.challan_number,
                challan_date: validated.challan_date,
                ewaybill_number: validated.ewaybill_number,
                ewaybill_date: validated.ewaybill_date,
                order_status: 'asset_dispatched',
                delivery_status: 'in_transit',
            },
            performed_by: user.id,
        });

        return updatedOrder;
    });

    return successResponse(result);
});