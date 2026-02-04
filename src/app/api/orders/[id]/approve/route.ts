import { z } from 'zod';
import { db } from '@/lib/db';
import { orders, approvals, auditLogs, slas } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireRole } from '@/lib/auth-utils';
import { successResponse, withErrorHandler, generateId } from '@/lib/api-utils';
import { triggerN8nWebhook } from '@/lib/n8n';

const approvalSchema = z.object({
    decision: z.enum(['approved', 'rejected']),
    rejection_reason: z.string().optional(),
    comments: z.string().optional(),
});

type ApprovalStage = 'pi' | 'invoice';

function getStage(orderStatus: string): { stage: ApprovalStage; level: number } {
    // PI approvals (3 levels)
    if (orderStatus === 'pi_approval_pending') return { stage: 'pi', level: 1 };
    if (orderStatus === 'pi_approval_l2_pending') return { stage: 'pi', level: 2 };
    if (orderStatus === 'pi_approval_l3_pending') return { stage: 'pi', level: 3 };

    // Invoice approval (1 level)
    if (orderStatus === 'invoice_approval_pending') return { stage: 'invoice', level: 1 };

    throw new Error('Order is not in an approval state');
}

export const POST = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id: orderId } = await params;
    const body = await req.json();
    const { decision, rejection_reason, comments } = approvalSchema.parse(body);

    if (decision === 'rejected' && !rejection_reason) {
        throw new Error('Rejection reason is required');
    }

    // 1) Get Order
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) throw new Error('Order not found');

    const { stage, level } = getStage(order.order_status);

    // 2) Determine required role
    const roleMap: Record<ApprovalStage, Record<number, string[]>> = {
        pi: {
            1: ['sales_head', 'ceo', 'business_head'],
            2: ['business_head', 'ceo'],
            3: ['finance_controller', 'ceo'],
        },
        invoice: {
            1: ['sales_head', 'ceo', 'business_head'],
        },
    };

    const user = await requireRole(roleMap[stage][level]);

    // 3) Process Decision
    const result = await db.transaction(async (tx) => {
        const approvalId = await generateId('APP', approvals);

        // Insert approval record
        await tx.insert(approvals).values({
            id: approvalId,
            entity_type: 'order',
            entity_id: orderId,
            level,
            approver_role: user.role,
            status: decision,
            approver_id: user.id,
            decision_at: new Date(),
            rejection_reason,
            comments,
        });

        // Compute next status
        let nextStatus = order.order_status;

        if (stage === 'pi') {
            if (decision === 'rejected') {
                nextStatus = 'pi_rejected';
            } else {
                if (level === 1) nextStatus = 'pi_approval_l2_pending';
                else if (level === 2) nextStatus = 'pi_approval_l3_pending';
                else if (level === 3) nextStatus = 'pi_approved';
            }

            // SLA: when PI is approved (final level), start "pending_for_invoice"
            // (Your upload-invoice route completes this step)
            if (nextStatus === 'pi_approved') {
                const deadline = new Date();
                deadline.setHours(deadline.getHours() + 24); // 24h to upload invoice

                await tx.insert(slas).values({
                    id: await generateId('SLA', slas),
                    entity_type: 'order',
                    entity_id: orderId,
                    workflow_step: 'pending_for_invoice',
                    status: 'active',
                    sla_deadline: deadline,
                    assigned_to: user.id, // Proxy (can map to actual owner later)
                });
            }
        }

        if (stage === 'invoice') {
            nextStatus = decision === 'rejected' ? 'invoice_rejected' : 'invoice_approved';

            // Complete invoice approval SLA (created on invoice upload)
            await tx.update(slas)
                .set({ status: 'completed', completed_at: new Date() })
                .where(and(
                    eq(slas.entity_id, orderId),
                    eq(slas.workflow_step, 'invoice_approval'),
                    eq(slas.status, 'active')
                ));

            // SLA: when invoice approved, start payment SLA (existing workflow step name)
            if (nextStatus === 'invoice_approved') {
                const deadline = new Date();
                deadline.setHours(deadline.getHours() + 48); // 48h for payment

                await tx.insert(slas).values({
                    id: await generateId('SLA', slas),
                    entity_type: 'order',
                    entity_id: orderId,
                    workflow_step: 'procurement_payment',
                    status: 'active',
                    sla_deadline: deadline,
                    assigned_to: user.id, // Proxy for finance
                });
            }
        }

        const [updatedOrder] = await tx.update(orders)
            .set({ order_status: nextStatus as any, updated_at: new Date() })
            .where(eq(orders.id, orderId))
            .returning();

        // Audit Log
        await tx.insert(auditLogs).values({
            id: await generateId('AUDIT', auditLogs),
            entity_type: 'order',
            entity_id: orderId,
            action: decision === 'approved' ? 'approve' : 'reject',
            changes: { stage, level, status: nextStatus },
            performed_by: user.id,
        });

        return updatedOrder;
    });

    // 4) Trigger n8n
    try {
        await triggerN8nWebhook(stage === 'pi' ? 'pi-approval-workflow' : 'invoice-approval-workflow', {
            order_id: orderId,
            stage,
            decision,
            next_status: result.order_status,
            approver_name: user.name,
        });
    } catch (err) {
        console.error('Webhook failed:', err);
    }

    return successResponse(result);
});