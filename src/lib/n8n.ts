const N8N_BASE_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n.srv1128060.hstgr.cloud';

export type WebhookType =
  | 'product-catalog-created'
  | 'oem-onboarded'
  | 'provision-created'
  | 'procurement-request-to-oem' // ✅ NEW
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

function buildPayload(webhook: WebhookType, data: any) {
  return {
    ...data,
    _metadata: {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      webhook_type: webhook,
    },
  };
}

/** Fire-and-forget */
export async function triggerN8nWebhook(webhook: WebhookType, data: any) {
  if (!N8N_BASE_URL) {
    console.warn('n8n: N8N_WEBHOOK_URL not configured, skipping trigger');
    return false;
  }

  try {
    const response = await fetch(`${N8N_BASE_URL}/webhook/${webhook}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Source': 'itarang-crm-v4',
      },
      body: JSON.stringify(buildPayload(webhook, data)),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error body');
      console.error(`n8n: Webhook [${webhook}] failed with status ${response.status}: ${errorText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`n8n: Connection error triggering [${webhook}]:`, error);
    return false;
  }
}

/** ✅ Trigger and read response body (needed for mail_sent/whatsapp_sent flags) */
export async function triggerN8nWebhookWithResponse(webhook: WebhookType, data: any) {
  if (!N8N_BASE_URL) {
    console.warn('n8n: N8N_WEBHOOK_URL not configured, skipping trigger');
    return { ok: false, status: 0, body: null as any };
  }

  const response = await fetch(`${N8N_BASE_URL}/webhook/${webhook}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Source': 'itarang-crm-v4',
    },
    body: JSON.stringify(buildPayload(webhook, data)),
  });

  let body: any = null;
  try {
    body = await response.json();
  } catch {
    body = await response.text().catch(() => null);
  }

  return { ok: response.ok, status: response.status, body };
}