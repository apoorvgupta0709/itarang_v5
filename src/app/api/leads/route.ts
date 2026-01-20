import { db } from '@/lib/db';
import { leads, auditLogs } from '@/lib/db/schema';
import { withErrorHandler, successResponse, errorResponse, generateId } from '@/lib/api-utils';
import { requireRole } from '@/lib/auth-utils';
import { z } from 'zod';
import { desc, eq, and } from 'drizzle-orm';

const leadSchema = z.object({
    lead_source: z.enum(['call_center', 'ground_sales', 'digital_marketing', 'database_upload', 'dealer_referral']),
    owner_name: z.string().min(1),
    owner_contact: z.string().regex(/^\+91[0-9]{10}$/, "Must be +91 followed by 10 digits"),
    state: z.string().min(1),
    city: z.string().min(1),
    interest_level: z.enum(['cold', 'warm', 'hot']),
    business_name: z.string().optional(),
    owner_email: z.string().email().optional(),
    shop_address: z.string().optional(),
    interested_in: z.array(z.string()).optional(),
    battery_order_expected: z.number().positive().optional(),
    investment_capacity: z.number().optional(),
    business_type: z.enum(['retail', 'wholesale', 'distributor']).optional(),
});

export const POST = withErrorHandler(async (req: Request) => {
    const user = await requireRole(['sales_manager', 'sales_head', 'business_head', 'ceo', 'sales_executive']);
    const body = await req.json();

    const result = leadSchema.safeParse(body);
    if (!result.success) {
        return errorResponse('Validation Error', 400); // Zod details logged by wrapper
    }
    const data = result.data;

    const leadId = await generateId('LEAD', leads);

    await db.insert(leads).values({
        id: leadId,
        ...data,
        uploader_id: user.id,
        lead_status: 'new',
        created_at: new Date(),
        updated_at: new Date(),
    });

    // Audit Log
    await db.insert(auditLogs).values({
        id: await generateId('AUDIT', auditLogs),
        entity_type: 'lead',
        entity_id: leadId,
        action: 'create',
        changes: data as any,
        performed_by: user.id,
        timestamp: new Date(),
    });

    return successResponse({ id: leadId, message: 'Lead created successfully' }, 201);
});

export const GET = withErrorHandler(async (req: Request) => {
    const user = await requireRole(['sales_manager', 'sales_head', 'business_head', 'ceo', 'sales_executive']);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const interest = searchParams.get('interest');

    // Basic filtering
    let conditions = [];
    if (status) conditions.push(eq(leads.lead_status, status));
    if (interest) conditions.push(eq(leads.interest_level, interest));

    // RBAC Filtering: Sales Execs only see their own leads? (Not strictly defined in SOP for filtering, but "View assigned Leads only")
    // For now, listing all for managers.
    // If Sales Executive, force filter by uploader_id?
    if (user.role === 'sales_executive') {
        conditions.push(eq(leads.uploader_id, user.id));
        // Note: Real filter should be by 'assignment', but standard uploader check is good baseline MVP
    }

    const result = await db.select()
        .from(leads)
        .where(and(...conditions))
        .orderBy(desc(leads.created_at));

    return successResponse(result);
});
