import { withErrorHandler, successResponse } from "@/lib/api-utils";
import { requireRole } from "@/lib/auth-utils";
import { runIntellicarSync } from "@/lib/intellicar-sync";

export const POST = withErrorHandler(async () => {
  await requireRole(["ceo"]);
  const result = await runIntellicarSync({ trigger: "manual" });
  return successResponse(result);
});