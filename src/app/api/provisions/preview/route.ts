import { z } from 'zod';
import { eq, and, inArray } from 'drizzle-orm';

import { db } from '@/lib/db';
import { oemContacts, oems, provisions, users } from '@/lib/db/schema';
import { generateId, successResponse, withErrorHandler } from '@/lib/api-utils';
import { requireRole } from '@/lib/auth-utils';

const PreviewSchema = z.object({
  oem_id: z.string().min(1),
  items: z.array(
    z.object({
      product_id: z.string().min(1),
      model_type: z.string().optional(),
      quantity: z.coerce.number().int().positive(),
    })
  ).min(1),
});

type RecipientDetail = {
  name: string;
  email: string;
  role: string;
  source: 'oem' | 'itarang';
};

function normEmail(x: string) {
  return (x || '').trim().toLowerCase();
}

function uniqEmails(list: string[]) {
  return Array.from(new Set(list.map(normEmail).filter(Boolean)));
}

function uniqDetails(list: RecipientDetail[]) {
  const seen = new Set<string>();
  const out: RecipientDetail[] = [];
  for (const r of list) {
    const key = `${normEmail(r.email)}|${r.role}|${r.source}`;
    if (!r.email) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

export const POST = withErrorHandler(async (req: Request) => {
  // allow the same roles who can create provision
  const me = await requireRole(['inventory_manager', 'ceo', 'business_head', 'sales_order_manager', 'sales_head']);
  const body = PreviewSchema.parse(await req.json());

  const [oem] = await db.select().from(oems).where(eq(oems.id, body.oem_id)).limit(1);
  if (!oem) throw new Error('OEM not found');

  const contacts = await db.select().from(oemContacts).where(eq(oemContacts.oem_id, body.oem_id));

  // OEM: Sales Manager is TO (+ WhatsApp)
  const oemSalesManager =
    contacts.find((c) => c.contact_role === 'sales_manager') ||
    contacts.find((c) => c.contact_role === 'sales_head') ||
    contacts[0];

  // OEM: Sales Head is CC
  const oemSalesHead = contacts.find((c) => c.contact_role === 'sales_head');

  // iTarang: Sales Order Manager + Sales Head in CC
  const internal = await db
    .select({ email: users.email, name: users.name, role: users.role })
    .from(users)
    .where(and(eq(users.is_active, true), inArray(users.role, ['sales_order_manager', 'sales_head'])));

  const internalSOM = internal.filter((u) => u.role === 'sales_order_manager');
  const internalSalesHead = internal.filter((u) => u.role === 'sales_head');

  // details for UI
  const toDetails: RecipientDetail[] = oemSalesManager?.contact_email
    ? [{
        name: oemSalesManager.contact_name || 'Sales Manager',
        email: oemSalesManager.contact_email,
        role: 'sales_manager',
        source: 'oem',
      }]
    : [];

  const ccDetails: RecipientDetail[] = [
    ...(oemSalesHead?.contact_email
      ? [{
          name: oemSalesHead.contact_name || 'Sales Head',
          email: oemSalesHead.contact_email,
          role: 'sales_head',
          source: 'oem',
        }]
      : []),
    ...internalSOM.map((u) => ({
      name: u.name,
      email: u.email,
      role: 'sales_order_manager',
      source: 'itarang' as const,
    })),
    ...internalSalesHead.map((u) => ({
      name: u.name,
      email: u.email,
      role: 'sales_head',
      source: 'itarang' as const,
    })),
  ];

  const finalToEmails = uniqEmails(toDetails.map((r) => r.email));
  const finalCcEmails = uniqEmails(ccDetails.map((r) => r.email)).filter((e) => !finalToEmails.includes(e));

  const finalToDetails = uniqDetails(toDetails);
  const finalCcDetails = uniqDetails(ccDetails).filter((r) => !finalToEmails.includes(normEmail(r.email)));

  const whatsappToPhone = (oemSalesManager?.contact_phone || '').trim();

  const provisionId = await generateId('PROV', provisions);

  const lines = body.items
    .map((i, idx) => `${idx + 1}. ${i.model_type || i.product_id} — Qty: ${i.quantity}`)
    .join('\n');

  const emailSubject = `Procurement Request | ${provisionId} | ${oem.business_entity_name}`;
  const emailBody =
    `Hi ${oemSalesManager?.contact_name || 'Team'},\n\n` +
    `Please find our procurement request below.\n\n` +
    `Provision ID: ${provisionId}\n` +
    `OEM: ${oem.business_entity_name}\n\n` +
    `Items:\n${lines}\n\n` +
    `Please confirm inventory availability and ETA against the same Provision ID.\n\n` +
    `Regards,\n${me.name}`;

  const whatsappMessage =
    `Hi ${oemSalesManager?.contact_name || 'Team'}!\n` +
    `Procurement request: *${provisionId}*\n\n` +
    `Items:\n${lines}\n\n` +
    `Please reply with availability/ETA using the same Provision ID.\n` +
    `— ${me.name}`;

  return successResponse({
    provision_id: provisionId,
    oem: { id: oem.id, name: oem.business_entity_name },

    // for sending
    routing: {
      email_to: finalToEmails,
      email_cc: finalCcEmails,
      whatsapp_to_phone: whatsappToPhone,
    },

    // for UI display
    routing_details: {
      email_to: finalToDetails,
      email_cc: finalCcDetails,
      whatsapp: oemSalesManager
        ? {
            name: oemSalesManager.contact_name || 'Sales Manager',
            phone: whatsappToPhone,
            role: 'sales_manager',
            source: 'oem' as const,
          }
        : null,
    },

    templates: {
      email_subject: emailSubject,
      email_body: emailBody,
      whatsapp_message: whatsappMessage,
    },
  });
});