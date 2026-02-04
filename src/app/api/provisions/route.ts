import { z } from 'zod';
import { db } from '@/lib/db';
import { provisions, oems } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireRole } from '@/lib/auth-utils';
import { successResponse, withErrorHandler, generateId } from '@/lib/api-utils';
import { triggerN8nWebhook, triggerN8nWebhookWithResponse } from '@/lib/n8n';

const provisionSchema = z.object({
  id: z.string().optional(),
  oem_id: z.string().min(1),
  expected_delivery_date: z.string().optional(),
  products: z.array(
    z.object({
      product_id: z.string().min(1),
      model_type: z.string().optional().default(''),
      quantity: z.coerce.number().int().positive(),
    })
  ).min(1),
  remarks: z.string().optional(),

  // new routing fields
  send_to_oem: z.boolean().optional().default(false),
  email_to: z.array(z.string().email()).optional(),
  email_cc: z.array(z.string().email()).optional(),
  whatsapp_to_phone: z.string().optional(),

  // legacy (optional)
  oem_email: z.string().email().optional(),
  oem_phone: z.string().optional(),

  email_subject: z.string().optional(),
  email_body: z.string().optional(),
  whatsapp_message: z.string().optional(),
});

function uniq(list: string[]) {
  return Array.from(new Set(list.map((x) => (x || '').trim().toLowerCase()).filter(Boolean)));
}

export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireRole(['inventory_manager', 'ceo', 'business_head', 'sales_order_manager', 'sales_head']);
  const validated = provisionSchema.parse(await req.json());

  const [oem] = await db.select().from(oems).where(eq(oems.id, validated.oem_id)).limit(1);
  if (!oem) throw new Error('OEM not found');

  const provisionId = validated.id || (await generateId('PROV', provisions));

  const expectedDelivery = validated.expected_delivery_date
    ? new Date(validated.expected_delivery_date)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // normalize routing fields
  const emailTo = uniq([
    ...(validated.email_to || []),
    ...(validated.oem_email ? [validated.oem_email] : []),
  ]);

  const emailCc = uniq(validated.email_cc || []).filter((e) => !emailTo.includes(e));

  const whatsappToPhone = (validated.whatsapp_to_phone || validated.oem_phone || '').trim();

  const [newProvision] = await db
    .insert(provisions)
    .values({
      id: provisionId,
      oem_id: validated.oem_id,
      oem_name: oem.business_entity_name,
      products: validated.products as any,
      expected_delivery_date: expectedDelivery,
      remarks: validated.remarks,
      status: validated.send_to_oem ? 'req_sent' : 'pending',
      created_by: user.id,
    })
    .returning();

  // existing event (non-blocking)
  try {
    await triggerN8nWebhook('provision-created', {
      provision_id: provisionId,
      oem_name: oem.business_entity_name,
      products: validated.products,
      created_by_name: user.name,
    });
  } catch (err) {
    console.error('Webhook failed (provision-created):', err);
  }

  // send request (mail+whatsapp) via n8n with explicit confirmation
  if (validated.send_to_oem) {
    const resp = await triggerN8nWebhookWithResponse('procurement-request-to-oem', {
      provision_id: provisionId,
      oem_id: oem.id,
      oem_name: oem.business_entity_name,

      email: {
        to: emailTo,
        cc: emailCc,
        subject: validated.email_subject,
        body: validated.email_body,
      },
      whatsapp: {
        to_phone: whatsappToPhone,
        message: validated.whatsapp_message,
      },

      products: validated.products,
      requested_by: { id: user.id, name: user.name, email: user.email },
    });

    const mailSent = !!(resp.body as any)?.mail_sent;
    const whatsappSent = !!(resp.body as any)?.whatsapp_sent;

    if (!resp.ok || !mailSent || !whatsappSent) {
      await db
        .update(provisions)
        .set({ status: 'pending', updated_at: new Date() })
        .where(eq(provisions.id, provisionId));

      return successResponse(
        {
          ...newProvision,
          status: 'pending',
          n8n: resp,
        },
        201
      );
    }
  }

  return successResponse(newProvision, 201);
});

export const GET = withErrorHandler(async () => {
  await requireRole([
    'inventory_manager',
    'ceo',
    'business_head',
    'finance_controller',
    'sales_head',
    'sales_order_manager',
  ]);

  const results = await db.select().from(provisions).orderBy(desc(provisions.created_at));
  return successResponse(results);
});