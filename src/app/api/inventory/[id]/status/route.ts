import { db } from "@/lib/db";
import { inventory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";
import { successResponse, withErrorHandler, errorResponse } from "@/lib/api-utils";
import { z } from "zod";

// Accept either { status: "available" } OR { value: "available" }
const BodySchema = z
  .object({
    status: z.string().optional(),
    value: z.string().optional(),
  })
  .refine((v) => (v.status ?? v.value)?.length, {
    message: "Request body must include 'status' (or 'value')",
  });

const ALLOWED = new Set([
  "in_transit",
  "pdi_pending",
  "pdi_failed",
  "available",
  "reserved",
  "sold",
  "damaged",
  "returned",
]);

export const PATCH = withErrorHandler(async (req: Request, ctx: any) => {
  await requireAuth();

  // ✅ IMPORTANT: params may be Promise-like in some Next setups
  const params = await Promise.resolve(ctx?.params);
  const rawId = params?.id;

  const id = rawId ? decodeURIComponent(String(rawId)) : "";
  if (!id || id === "undefined" || id === "null") {
    return errorResponse("Missing inventory id in request URL.", 400);
  }

  // ✅ Robust JSON parsing
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return errorResponse("Invalid JSON body. Send application/json with { status: '...' }", 400);
  }

  const parsed = BodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues?.[0]?.message || "Invalid request body", 400);
  }

  const nextStatus = (parsed.data.status ?? parsed.data.value)!;

  if (!ALLOWED.has(nextStatus)) {
    return errorResponse(
      `Invalid status '${nextStatus}'. Allowed: ${Array.from(ALLOWED).join(", ")}`,
      400
    );
  }

  try {
    const [updated] = await db
      .update(inventory)
      .set({
        status: nextStatus,
        updated_at: new Date(),
      })
      .where(eq(inventory.id, id))
      .returning();

    if (!updated) {
      return errorResponse(`Inventory not found for id='${id}'.`, 404);
    }

    return successResponse({ item: updated }, 200);
  } catch (err: any) {
    const msg = String(err?.message || "Database error");
    const code = err?.code as string | undefined;

    // Common Postgres permission / RLS failures
    if (
      code === "42501" ||
      msg.toLowerCase().includes("permission denied") ||
      msg.toLowerCase().includes("row-level security") ||
      msg.toLowerCase().includes("violates row-level security")
    ) {
      return errorResponse(
        `Forbidden: database rejected the update (RLS/permissions). Details: ${msg}`,
        403
      );
    }

    return errorResponse(msg, 500);
  }
});