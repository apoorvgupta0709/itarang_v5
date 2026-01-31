import { db } from "@/lib/db";
import { productCatalog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth-utils";
import { successResponse, withErrorHandler } from "@/lib/api-utils";

export const POST = withErrorHandler(async (_req: Request, ctx: any) => {
  const user = await requireRole(["business_head", "ceo"]);
  const id = ctx.params.id as string;

  const [row] = await db
    .update(productCatalog)
    .set({
      status: "active",
      disabled_at: null,
      disabled_by: null,
    })
    .where(eq(productCatalog.id, id))
    .returning();

  return successResponse({ item: row });
});