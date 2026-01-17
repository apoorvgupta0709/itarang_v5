const N8N_BASE_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n.srv1128060.hstgr.cloud';

export async function triggerN8nWebhook(webhook: string, data: any) {
    try {
        const response = await fetch(`${N8N_BASE_URL}/webhook/${webhook}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            console.error(`n8n webhook failed (${webhook}):`, response.statusText);
        }

        return response.ok;
    } catch (error) {
        console.error(`n8n webhook error (${webhook}):`, error);
        return false;
    }
}
