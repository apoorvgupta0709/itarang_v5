import { withErrorHandler, successResponse } from "@/lib/api-utils";
import { runIntellicarSync } from "@/lib/intellicar-sync";

export const GET = withErrorHandler(async (req: Request) => {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === "production") {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const result = await runIntellicarSync({ trigger: "cron" });
  return successResponse(result);
});