import { z } from 'zod';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { provisions } from '@/lib/db/schema';
import { successResponse, withErrorHandler } from '@/lib/api-utils';
import { assertWebhookSecret } from '@/lib/webhook-auth';

const Schema = z.object({
    provision_id: z.string().min(1),
    reason: z.string().optional(),
});

/**
 * Called by n8n after a human-approved cancellation is completed.
 */
export const POST = withErrorHandler(async (req: Request) => {
    assertWebhookSecret(req);
    const payload = Schema.parse(await req.json());

    await db.update(provisions)
        .set({ status: 'cancelled', remarks: payload.reason ?? undefined, updated_at: new Date() })
        .where(eq(provisions.id, payload.provision_id));

    return successResponse({ ok: true, provision_id: payload.provision_id, status: 'cancelled' });
});