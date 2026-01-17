import { z } from 'zod';
import { db } from '@/lib/db';
import { oems, oemContacts } from '@/lib/db/schema';
import { requireRole } from '@/lib/auth-utils';
import { successResponse, withErrorHandler, generateId } from '@/lib/api-utils';
import { triggerN8nWebhook } from '@/lib/n8n';

const oemSchema = z.object({
    business_entity_name: z.string().min(1),
    gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/),
    cin: z.string().min(1),
    bank_account_number: z.string().min(1),
    ifsc_code: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/),
    bank_proof_url: z.string().url(),
    contacts: z.array(z.object({
        contact_role: z.enum(['sales_head', 'sales_manager', 'finance_manager']),
        contact_name: z.string().min(1),
        contact_phone: z.string().regex(/^\+91-[0-9]{10}$/),
        contact_email: z.string().email(),
    })).length(3, 'Exactly 3 contacts required'),
});

export const POST = withErrorHandler(async (req: Request) => {
    const user = await requireRole(['sales_order_manager', 'ceo']);
    const body = await req.json();
    const validated = oemSchema.parse(body);

    // Validate unique contact roles
    const roles = validated.contacts.map(c => c.contact_role);
    if (new Set(roles).size !== 3) {
        throw new Error('Must have one contact for each role: sales_head, sales_manager, finance_manager');
    }

    const oemId = await generateId('OEM', oems);

    const result = await db.transaction(async (tx) => {
        const { contacts: contactData, ...oemInfo } = validated;

        const [oem] = await tx.insert(oems).values({
            id: oemId,
            ...oemInfo,
            status: 'active',
            created_by: user.id,
        }).returning();

        const contacts = await tx.insert(oemContacts).values(
            contactData.map((c, i) => ({
                id: `${oemId}-${i + 1}`,
                oem_id: oemId,
                ...c,
            }))
        ).returning();

        return { oem, contacts };
    });

    await triggerN8nWebhook('oem-onboarded', {
        oem_id: result.oem.id,
        contacts: result.contacts,
    });

    return successResponse(result, 201);
});
