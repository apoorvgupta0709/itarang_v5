/**
 * Very small shared-secret auth for inbound webhooks (e.g., n8n -> CRM).
 *
 * Configure:
 *   N8N_WEBHOOK_SECRET=some-long-random-string
 *
 * Send header:
 *   x-webhook-secret: <same secret>
 */
export function assertWebhookSecret(req: Request) {
    const expected = process.env.N8N_WEBHOOK_SECRET;
    if (!expected) {
        throw new Error('N8N_WEBHOOK_SECRET is not configured');
    }

    const received = req.headers.get('x-webhook-secret') || '';
    if (received !== expected) {
        throw new Error('Unauthorized webhook');
    }
}