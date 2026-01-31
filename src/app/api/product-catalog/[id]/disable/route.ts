import { db } from "@/lib/db";
import { productCatalog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";
import { successResponse, withErrorHandler } from "@/lib/api-utils";
import { z } from "zod";

const BodySchema = z.object({
    action: z.enum(["disable", "enable"]).default("disable"),
});

export const POST = withErrorHandler(
    async (req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> => {
        const user = await requireAuth();
        const { id } = await params;

        const body = BodySchema.parse(await req.json());
        const now = new Date();

        const updates =
            body.action === "disable"
                ? {
                    status: "disabled",
                    disabled_at: now,
                    disabled_by: user.id,
                }
                : {
                    status: "active",
                    disabled_at: null,
                    disabled_by: null,
                };

        const [updated] = await db
            .update(productCatalog)
            .set(updates)
            .where(eq(productCatalog.id, id))
            .returning();

        return successResponse({ item: updated });
    }
);