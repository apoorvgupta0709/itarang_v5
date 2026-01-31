import { db } from "@/lib/db";
import { oems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";
import { successResponse, withErrorHandler } from "@/lib/api-utils";
import { z } from "zod";

const BodySchema = z.object({
  action: z.enum(["disable", "enable"]),
});

export const POST = withErrorHandler(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    await requireAuth();
    const { id } = await params;

    const body = BodySchema.parse(await req.json());
    const nextStatus = body.action === "disable" ? "inactive" : "active";

    const [updated] = await db
      .update(oems)
      .set({ status: nextStatus, updated_at: new Date() })
      .where(eq(oems.id, id))
      .returning();

    return successResponse({ item: updated });
  }
);