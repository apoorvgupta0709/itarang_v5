import { withErrorHandler, successResponse } from "@/lib/api-utils";
import { requireRole } from "@/lib/auth-utils";
import { runIntellicarHistoricalRunOnce } from "@/lib/intellicar-sync";

export const POST = withErrorHandler(async () => {
    await requireRole(["ceo"]);
    const result = await runIntellicarHistoricalRunOnce();
    return successResponse(result);
});
