import { NextResponse } from "next/server";
import { runIntellicarHistoricalRunOnce } from "@/lib/intellicar-sync";

export const GET = async () => {
    // Usually cron would have some secret header check, but following existing patterns
    try {
        const result = await runIntellicarHistoricalRunOnce();
        return NextResponse.json({ success: true, ...result });
    } catch (e: any) {
        console.error("Historical sync cron failed:", e);
        return NextResponse.json({ success: false, error: e?.message }, { status: 500 });
    }
};
