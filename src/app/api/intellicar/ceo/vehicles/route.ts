import { withErrorHandler, successResponse } from "@/lib/api-utils";
import { requireRole } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { intellicarVehicleDeviceMap } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const GET = withErrorHandler(async () => {
    await requireRole(["ceo"]);
    const vehicles = await db.select().from(intellicarVehicleDeviceMap).where(eq(intellicarVehicleDeviceMap.active, true));
    return successResponse(vehicles);
});
