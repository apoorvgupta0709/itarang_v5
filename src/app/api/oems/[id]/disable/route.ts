import { db } from "@/lib/db";
import { oems } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth-utils";
import { successResponse, withErrorHandler } from "@/lib/api-utils";
import { eq } from "drizzle-orm";

export const PATCH = withErrorHandler(async (_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> => {
    await requireRole(["ceo", "sales_order_manager"]);
    const { id } = await ctx.params;

    const [row] = await db.select({ status: oems.status }).from(oems).where(eq(oems.id, id)).limit(1);
    const nextStatus = row?.status === "active" ? "inactive" : "active";

    const [updated] = await db
        .update(oems)
        .set({ status: nextStatus, updated_at: new Date() })
        .where(eq(oems.id, id))
        .returning();

    return successResponse(updated ?? null);
});