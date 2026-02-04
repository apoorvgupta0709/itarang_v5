import { z } from 'zod';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { provisions } from '@/lib/db/schema';
import { successResponse, withErrorHandler } from '@/lib/api-utils';
import { assertWebhookSecret } from '@/lib/webhook-auth';
import { triggerN8nWebhook } from '@/lib/n8n';

/**
 * n8n calls this endpoint after it:
 * 1) detects a reply email/WhatsApp referencing a Provision ID
 * 2) uses an AI agent to extract inventory availability and ETA
 */
const Schema = z.object({
    provision_id: z.string().min(1),
    outcome: z.enum(['ready_for_pdi', 'not_available', 'acknowledged']).default('acknowledged'),
    extracted: z.object({
        eta_text: z.string().optional(),
        items: z.array(z.object({
            product_id: z.string().min(1),
            quantity_available: z.coerce.number().int().min(0),
        })).default([]),
    }).optional(),
});

export const POST = withErrorHandler(async (req: Request) => {
    assertWebhookSecret(req);

    const payload = Schema.parse(await req.json());

    // Update status based on OEM reply analysis
    const nextStatus = payload.outcome === 'not_available'
        ? 'not_available'
        : payload.outcome === 'ready_for_pdi'
            ? 'ready_for_pdi'
            : 'acknowledged';

    await db.update(provisions)
        .set({ status: nextStatus, updated_at: new Date() })
        .where(eq(provisions.id, payload.provision_id));

    // If items are ready, trigger PDI request flow (n8n will email/whatsapp the service engineer)
    if (nextStatus === 'ready_for_pdi') {
        try {
            await triggerN8nWebhook('pdi-needed', {
                provision_id: payload.provision_id,
                extracted: payload.extracted || null,
            });
        } catch (e) {
            console.warn('[n8n] pdi-needed trigger failed:', e);
        }
    }

    return successResponse({ ok: true, provision_id: payload.provision_id, status: nextStatus });
});