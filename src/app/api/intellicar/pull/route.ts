import { withErrorHandler, successResponse, errorResponse, generateId } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { intellicarFetch } from "@/lib/intellicar";
import { intellicarPulls } from "@/lib/db/schema";

export const POST = withErrorHandler(async (req: Request) => {
  // Optional: protect endpoint so random people can’t trigger pulls
  const secret = process.env.INTELLICAR_PULL_SECRET;
  if (secret) {
    const provided = req.headers.get("x-pull-secret");
    if (provided !== secret) return errorResponse("Unauthorized", 401);
  }

  const { endpoint, body } = await req.json().catch(() => ({ endpoint: "", body: undefined }));
  if (!endpoint || typeof endpoint !== "string") {
    return errorResponse("Missing 'endpoint' in body", 400);
  }

  const pullId = await generateId("INTC", intellicarPulls);

  try {
    const payload = await intellicarFetch(endpoint, body);

    await db.insert(intellicarPulls).values({
      id: pullId,
      endpoint,
      status: "success",
      payload,
    });

    return successResponse({ pullId, endpoint });
  } catch (e: any) {
    await db.insert(intellicarPulls).values({
      id: pullId,
      endpoint,
      status: "failed",
      error: e?.message || "Unknown error",
    });

    return errorResponse(e?.message || "Intellicar pull failed", 500);
  }
});