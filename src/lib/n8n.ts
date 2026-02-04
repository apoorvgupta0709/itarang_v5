const N8N_BASE_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n.srv1128060.hstgr.cloud';

export type WebhookType =
    | 'product-catalog-created'
    | 'oem-onboarded'
    | 'provision-created'
    | 'procurement-request-to-oem'
    | 'pdi-needed'
    | 'pdi-completed'
    | 'order-created-request-pi'
    | 'pi-approval-workflow'
    | 'invoice-uploaded'
    | 'payment-made'
    | 'grn-created'
    | 'lead-assigned'
    | 'deal-approval-workflow'
    | 'deal-submitted'
    | 'invoice-issued'
    | 'order-disputed'
    | 'order-fulfilled'
    | 'sla-monitor'
    | 'sla-breach-notification'
    | 'sla-breach-detected'
    | 'system-critical-error'
    | 'daily-summary';

export type WebhookResponse<T = any> = {
    ok: boolean;
    status: number;
    body?: T;
    error?: string;
};

/**
 * Triggers an n8n webhook with a standardized payload and robust error handling.
 * This is the primary bridge between the CRM and automated workflows in n8n.
 */
export async function triggerN8nWebhook(webhook: WebhookType, data: any) {
    if (!N8N_BASE_URL) {
        console.warn('n8n: N8N_WEBHOOK_URL not configured, skipping trigger');
        return false;
    }

    try {
        const payload = {
            ...data,
            _metadata: {
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV,
                webhook_type: webhook,
            }
        };

        const response = await fetch(`${N8N_BASE_URL}/webhook/${webhook}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Source': 'itarang-crm-v4',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error(`n8n webhook failed (${webhook}): ${response.status} ${response.statusText}`);
            return false;
        }

        console.log(`n8n webhook triggered successfully: ${webhook}`);
        return true;
    } catch (error) {
        console.error(`Error triggering n8n webhook (${webhook}):`, error);
        return false;
    }
}

/**
 * Like triggerN8nWebhook, but returns HTTP status + best-effort parsed body.
 * Use this when the UI needs explicit confirmation from n8n.
 */
export async function triggerN8nWebhookWithResponse<T = any>(
    webhook: WebhookType,
    data: any
): Promise<WebhookResponse<T>> {
    if (!N8N_BASE_URL) {
        return { ok: false, status: 0, error: 'N8N_WEBHOOK_URL not configured' };
    }

    try {
        const payload = {
            ...data,
            _metadata: {
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV,
                webhook_type: webhook,
            }
        };

        const response = await fetch(`${N8N_BASE_URL}/webhook/${webhook}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Source': 'itarang-crm-v4',
            },
            body: JSON.stringify(payload),
        });

        const contentType = response.headers.get('content-type') || '';
        let body: any = undefined;

        if (contentType.includes('application/json')) {
            body = await response.json().catch(() => undefined);
        } else {
            body = await response.text().catch(() => undefined);
        }

        if (!response.ok) {
            const err = typeof body === 'string' ? body : JSON.stringify(body || {});
            return { ok: false, status: response.status, body, error: err };
        }

        return { ok: true, status: response.status, body };
    } catch (error: any) {
        return { ok: false, status: 0, error: error?.message || 'Connection error' };
    }
}