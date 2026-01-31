import { db } from "@/lib/db";
import { oems, oemContacts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";
import { generateId, successResponse, withErrorHandler } from "@/lib/api-utils";
import { z } from "zod";

const ContactSchema = z.object({
    name: z.string().min(1),
    phone: z.string().min(8),
    email: z.string().email(),
});

const CreateOemSchema = z.object({
    business_entity_name: z.string().min(2),
    gstin: z.string().min(10),
    pan: z.string().optional().nullable(),
    cin: z.string().optional().nullable(),

    address_line1: z.string().optional().nullable(),
    address_line2: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    pincode: z.string().optional().nullable(),

    bank_name: z.string().optional().nullable(),
    bank_account_number: z.string().min(5),
    ifsc_code: z.string().min(5),
    bank_proof_url: z.string().optional().nullable(),

    contacts: z.object({
        sales_head: ContactSchema,
        sales_manager: ContactSchema,
        finance_manager: ContactSchema,
    }),
});

export const GET = withErrorHandler(async () => {
    const rows = await db
        .select()
        .from(oems)
        .orderBy(desc(oems.created_at));

    const contacts = await db.select().from(oemContacts);

    const contactsByOem: Record<string, any[]> = {};
    for (const c of contacts) {
        contactsByOem[c.oem_id] = contactsByOem[c.oem_id] || [];
        contactsByOem[c.oem_id].push(c);
    }

    const items = rows.map((o) => ({
        ...o,
        contacts: contactsByOem[o.id] || [],
    }));

    return successResponse({ items });
});

export const POST = withErrorHandler(async (req: Request) => {
    const user = await requireAuth();
    const body = CreateOemSchema.parse(await req.json());

    const oemId = await generateId("OEM", oems);

    const [created] = await db
        .insert(oems)
        .values({
            id: oemId,
            business_entity_name: body.business_entity_name,
            gstin: body.gstin,
            pan: body.pan ?? null,
            cin: body.cin ?? null,
            address_line1: body.address_line1 ?? null,
            address_line2: body.address_line2 ?? null,
            city: body.city ?? null,
            state: body.state ?? null,
            pincode: body.pincode ?? null,
            bank_name: body.bank_name ?? null,
            bank_account_number: body.bank_account_number,
            ifsc_code: body.ifsc_code,
            bank_proof_url: body.bank_proof_url ?? null,
            status: "active",
            created_by: user.id,
            updated_at: new Date(),
        })
        .returning();

    const contactRows = [
        {
            id: `${oemId}-sales_head-001`,
            oem_id: oemId,
            contact_role: "sales_head",
            contact_name: body.contacts.sales_head.name,
            contact_phone: body.contacts.sales_head.phone,
            contact_email: body.contacts.sales_head.email,
        },
        {
            id: `${oemId}-sales_manager-001`,
            oem_id: oemId,
            contact_role: "sales_manager",
            contact_name: body.contacts.sales_manager.name,
            contact_phone: body.contacts.sales_manager.phone,
            contact_email: body.contacts.sales_manager.email,
        },
        {
            id: `${oemId}-finance_manager-001`,
            oem_id: oemId,
            contact_role: "finance_manager",
            contact_name: body.contacts.finance_manager.name,
            contact_phone: body.contacts.finance_manager.phone,
            contact_email: body.contacts.finance_manager.email,
        },
    ];

    await db.insert(oemContacts).values(contactRows);

    return successResponse({ item: created });
});