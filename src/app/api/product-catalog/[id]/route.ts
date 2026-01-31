import { db } from "@/lib/db";
import { productCatalog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";
import { successResponse, withErrorHandler } from "@/lib/api-utils";
import { z } from "zod";

export const GET = withErrorHandler(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> => {
    await requireAuth();
    const { id } = await params;

    const [item] = await db
      .select()
      .from(productCatalog)
      .where(eq(productCatalog.id, id))
      .limit(1);

    return successResponse({ item: item || null });
  }
);

const PatchSchema = z
  .object({
    hsn_code: z.string().min(1).optional(),
    asset_category: z.enum(["2W", "3W", "Inverter"]).optional(),
    asset_type: z.enum(["Charger", "Battery", "SOC", "Harness", "Inverter"]).optional(),
    model_type: z.string().min(1).optional(),
    is_serialized: z.boolean().optional(),
    warranty_months: z.coerce.number().int().min(0).optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, { message: "No fields to update" });

export const PATCH = withErrorHandler(
  async (req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> => {
    await requireAuth();
    const { id } = await params;

    const body = PatchSchema.parse(await req.json());

    const [updated] = await db
      .update(productCatalog)
      .set(body)
      .where(eq(productCatalog.id, id))
      .returning();

    return successResponse({ item: updated });
  }
);