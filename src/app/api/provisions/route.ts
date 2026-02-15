import { z } from 'zod';
import { db } from '@/lib/db';
import { provisions, oems } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireRole } from '@/lib/auth-utils';
import { successResponse, withErrorHandler, generateId } from '@/lib/api-utils';
import { triggerN8nWebhook, triggerN8nWebhookWithResponse } from '@/lib/n8n';

const provisionSchema = z.object({
  oem_id: z.string().min(1),
  expected_delivery_date: z.string().transform(v => new Date(v)),
  products: z.array(z.object({
    product_id: z.string().min(1),
    model_type: z.string(),
    quantity: z.number().positive(),
  })).min(1),
  remarks: z.string().optional(),

  // ✅ NEW (optional): if frontend sends email/whatsapp preview objects, we send to n8n now
  send_to_oem: z.boolean().optional(),
  email: z.object({
    to: z.array(z.string().email()).min(1),
    cc: z.array(z.string().email()).optional().default([]),
    subject: z.string().min(1),
    body: z.string().min(1),
  }).optional(),
  whatsapp: z.object({
    to_phone: z.string().min(1),
    message: z.string().min(1),
  }).optional(),
});

export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireRole(['inventory_manager', 'ceo', 'business_head']);
  const body = await req.json();
  const validated = provisionSchema.parse(body);

  // Get OEM name
  const [oem] = await db.select().from(oems).where(eq(oems.id, validated.oem_id)).limit(1);
  if (!oem) throw new Error('OEM not found');

  const provisionId = await generateId('PROV', provisions);

  const [newProvision] = await db.insert(provisions).values({
    id: provisionId,
    oem_id: validated.oem_id,
    oem_name: oem.business_entity_name,
    products: validated.products as any,
    expected_delivery_date: validated.expected_delivery_date,
    remarks: validated.remarks,
    status: 'pending',
    created_by: user.id,
  }).returning();

  // Always fire the basic webhook (optional / existing)
  try {
    await triggerN8nWebhook('provision-created', {
      provision_id: provisionId,
      oem_name: oem.business_entity_name,
      products: validated.products,
      created_by_name: user.name,
    });
  } catch (err) {
    console.error('Webhook failed:', err);
  }

  // ✅ If email preview is provided + send_to_oem = true, send to your n8n workflow now
  if (validated.send_to_oem && validated.email) {
    const n8nResp = await triggerN8nWebhookWithResponse('procurement-request-to-oem', {
      provision_id: provisionId,
      oem_id: validated.oem_id,
      oem_name: oem.business_entity_name,
      email: validated.email,
      whatsapp: validated.whatsapp, // optional
      products: validated.products,
      requested_by: {
        id: user.id,
        name: user.name,
        email: (user as any).email,
      },
    });

    const mailSent = !!(n8nResp.body as any)?.mail_sent;
    // WhatsApp optional => ignore whatsapp_sent for status

    if (n8nResp.ok && mailSent) {
      const [updated] = await db.update(provisions)
        .set({ status: 'email_sent', updated_at: new Date() })
        .where(eq(provisions.id, provisionId))
        .returning();

      return successResponse({ ...updated, n8n: n8nResp.body }, 201);
    }

    // If mail not sent, keep pending but return n8n response for debugging
    return successResponse({ ...newProvision, status: 'pending', n8n: n8nResp.body }, 201);
  }

  return successResponse(newProvision, 201);
});

export const GET = withErrorHandler(async () => {
  await requireRole(['inventory_manager', 'ceo', 'business_head', 'finance_controller', 'sales_head']);

  const results = await db.select()
    .from(provisions)
    .orderBy(desc(provisions.created_at));

  return successResponse(results);
});