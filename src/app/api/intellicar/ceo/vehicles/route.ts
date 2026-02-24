import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-utils";
import { getIntellicarToken, listVehicleDeviceMapping } from "@/lib/intellicar";

export const GET = async (req: NextRequest) => {
    try {
        await requireRole(["ceo"]);

        const token = await getIntellicarToken();
        const vehicles = await listVehicleDeviceMapping(token);

        return NextResponse.json({
            success: true,
            vehicles,
            source: "intellicar"
        });
    } catch (e: any) {
        console.error("Vehicles API Error:", e);
        return NextResponse.json({ success: false, error: e?.message || "Internal Error" }, { status: 500 });
    }
};
