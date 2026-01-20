import { db } from '@/lib/db';
import { leads, auditLogs, users } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { withErrorHandler, successResponse, errorResponse, generateId } from '@/lib/api-utils';

/**
 * Bolna.ai Webhook Handler
 * Receives call outcomes and updates lead status/interest.
 */
export const POST = withErrorHandler(async (req: Request) => {
    const body = await req.json();

    // Bolna payload structure (approximate based on standard patterns)
    const {
        metadata,
        call_status,
        detected_interest,
        call_summary,
        sentiment
    } = body;

    const leadId = metadata?.lead_id;

    if (!leadId) {
        console.warn('[Bolna Webhook] Missing lead_id in metadata', body);
        return errorResponse('Missing lead_id in metadata', 400);
    }

    // 1. Map Bolna interest/sentiment to System interest_level
    // Business Rule: interest_level must be 'cold', 'warm', or 'hot'
    let interestLevel: 'cold' | 'warm' | 'hot' = 'warm'; // Default to warm for any successful AI call

    if (detected_interest?.toLowerCase() === 'high' || sentiment?.toLowerCase() === 'positive') {
        interestLevel = 'hot';
    } else if (detected_interest?.toLowerCase() === 'low' || sentiment?.toLowerCase() === 'negative') {
        interestLevel = 'cold';
    }

    // 2. Fetch Lead
    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    if (!lead) {
        return errorResponse('Lead not found', 404);
    }

    // 3. Prepare Updates
    const updates: any = {
        interest_level: interestLevel,
        updated_at: new Date(),
    };

    // 4. Handle Qualification Business Rules
    // Business Rule: Cannot qualify if interest_level = 'cold'
    const canQualify = interestLevel !== 'cold';

    // Auto-qualify if criteria met (e.g., call completed successfully and user interested)
    if (canQualify && (interestLevel === 'hot' || interestLevel === 'warm') && lead.lead_status !== 'qualified') {
        updates.lead_status = 'qualified';
        updates.qualified_at = new Date();
        updates.qualification_notes = `AI-Qualified via Bolna.ai call. Summary: ${call_summary || 'No summary provided'}`;

        // Use a system admin user for qualified_by if possible
        const [admin] = await db.select().from(users).limit(1);
        if (admin) {
            updates.qualified_by = admin.id;
        }
    }

    // 5. Update Lead
    await db.update(leads).set(updates).where(eq(leads.id, leadId));

    // 6. Create Audit Log
    try {
        const [admin] = await db.select().from(users).limit(1);
        if (admin) {
            await db.insert(auditLogs).values({
                id: await generateId('AUDIT', auditLogs),
                entity_type: 'lead',
                entity_id: leadId,
                action: 'update',
                changes: {
                    interest_level: interestLevel,
                    lead_status: updates.lead_status,
                    bolna_call_id: body.call_id
                },
                performed_by: admin.id,
                timestamp: new Date(),
            });
        }
    } catch (auditError) {
        console.error('[Bolna Webhook] Audit logging failed:', auditError);
        // Don't fail the whole request if audit logging fails
    }

    return successResponse({
        lead_id: leadId,
        interest_level: interestLevel,
        qualified: updates.lead_status === 'qualified'
    });
});
