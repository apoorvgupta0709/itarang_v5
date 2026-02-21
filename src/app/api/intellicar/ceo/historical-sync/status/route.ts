import { withErrorHandler, successResponse } from "@/lib/api-utils";
import { requireRole } from "@/lib/auth-utils";
import { getHistoryStatusSummary } from "@/lib/intellicar-sync";

export const GET = withErrorHandler(async () => {
    await requireRole(["ceo"]);
    const summary = await getHistoryStatusSummary();
    return successResponse(summary);
});
