import { z } from 'zod';
import { db } from '@/lib/db';
import { orders, slas, documents, orderPiVersions } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireRole } from '@/lib/auth-utils';
import { successResponse, withErrorHandler, generateId } from '@/lib/api-utils';

const uploadPiSchema = z.object({
    pi_url: z.string().url(),
    pi_amount: z.string().or(z.number()),
    pi_number: z.string().optional(),
    pi_date: z.string().optional(), // ISO date
    source: z.enum(['oem_email', 'whatsapp', 'upload']).default('upload'),
});

export const POST = withErrorHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id: orderId } = await params;
    const user = await requireRole(['sales_order_manager', 'ceo', 'business_head', 'sales_head']);
    const body = await req.json();
    const validated = uploadPiSchema.parse(body);

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) throw new Error('Order not found');

    const piAmount = validated.pi_amount.toString();

    const [updatedOrder] = await db.transaction(async (tx) => {
        // 1) Find current active PI version (if any)
        const [activePi] = await tx.select()
            .from(orderPiVersions)
            .where(and(eq(orderPiVersions.order_id, orderId), eq(orderPiVersions.is_active, true)))
            .orderBy(desc(orderPiVersions.version))
            .limit(1);

        const nextVersion = (activePi?.version ?? 0) + 1;

        // 2) Deactivate current active PI (versioning)
        if (activePi) {
            await tx.update(orderPiVersions)
                .set({ is_active: false, status: 'superseded' })
                .where(eq(orderPiVersions.id, activePi.id));

            await tx.update(documents)
                .set({ is_active: false })
                .where(eq(documents.id, activePi.document_id));
        }

        // 3) Create document record
        const docId = await generateId('DOC', documents);
        await tx.insert(documents).values({
            id: docId,
            document_type: 'pi',
            source: validated.source,
            url: validated.pi_url,
            uploaded_by: user.id,
            version: nextVersion,
            entity_type: 'order',
            entity_id: orderId,
        });

        // 4) Create PI version record
        const piId = await generateId('PI', orderPiVersions);
        await tx.insert(orderPiVersions).values({
            id: piId,
            order_id: orderId,
            document_id: docId,
            pi_number: validated.pi_number,
            pi_date: validated.pi_date ? new Date(validated.pi_date) : null,
            amount: piAmount,
            version: nextVersion,
            is_active: true,
            status: 'uploaded',
            created_by: user.id,
        });

        // 5) Update order pointer fields (backward compatible)
        const [orderUpdate] = await tx.update(orders)
            .set({
                pi_url: validated.pi_url,
                pi_amount: piAmount,
                order_status: 'pi_approval_pending',
                updated_at: new Date(),
            })
            .where(eq(orders.id, orderId))
            .returning();

        // 6) Complete PI Upload SLA (if exists)
        await tx.update(slas)
            .set({ status: 'completed', completed_at: new Date() })
            .where(and(
                eq(slas.entity_id, orderId),
                eq(slas.workflow_step, 'pi_upload'),
                eq(slas.status, 'active')
            ));

        return [orderUpdate];
    });

    if (!updatedOrder) throw new Error('Order not found');
    return successResponse(updatedOrder);
});