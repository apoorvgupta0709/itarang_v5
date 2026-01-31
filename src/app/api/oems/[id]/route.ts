import { db } from "@/lib/db";
import { oems } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth-utils";
import { successResponse, withErrorHandler } from "@/lib/api-utils";
import { eq } from "drizzle-orm";
import { z } from "zod";

const UpdateOEMSchema = z.object({
    business_entity_name: z.string().min(2).optional(),
    gstin: z.string().min(10).optional(),
    pan: z.string().min(5).optional().nullable(),

    address_line1: z.string().optional().nullable(),
    address_line2: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    pincode: z.string().optional().nullable(),

    bank_name: z.string().optional().nullable(),
    bank_account_number: z.string().min(6).optional(),
    ifsc_code: z.string().min(5).optional(),
    bank_proof_url: z.string().url().optional().nullable(),

    status: z.enum(["active", "inactive"]).optional(),
});

export const GET = withErrorHandler(async (_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> => {
    await requireRole(["ceo", "sales_order_manager"]);
    const { id } = await ctx.params;

    const [row] = await db.select().from(oems).where(eq(oems.id, id)).limit(1);
    return successResponse(row ?? null);
});

export const PATCH = withErrorHandler(async (req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> => {
    await requireRole(["ceo", "sales_order_manager"]);
    const { id } = await ctx.params;

    const patch = UpdateOEMSchema.parse(await req.json());

    const [updated] = await db
        .update(oems)
        .set({ ...patch, updated_at: new Date() })
        .where(eq(oems.id, id))
        .returning();

    return successResponse(updated ?? null);
});