import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import {
    intellicarGpsHistory,
    intellicarCanHistory,
    intellicarFuelHistory,
    intellicarDistanceWindows
} from "@/lib/db/schema";
import { and, eq, gte, lte, desc } from "drizzle-orm";

export const GET = async (req: NextRequest) => {
    try {
        await requireRole(["ceo"]);

        const { searchParams } = new URL(req.url);
        const vehicleno = searchParams.get("vehicleno");
        const dataset = searchParams.get("dataset");
        const startMs = Number(searchParams.get("startMs"));
        const endMs = Number(searchParams.get("endMs"));
        const format = searchParams.get("format") || "csv"; // csv or json

        if (!vehicleno || !dataset || isNaN(startMs) || isNaN(endMs)) {
            return NextResponse.json({ success: false, error: "Missing required parameters: vehicleno, dataset, startMs, endMs" }, { status: 400 });
        }

        let rows: any[] = [];

        if (dataset === "gps") {
            rows = await db.select().from(intellicarGpsHistory)
                .where(and(
                    eq(intellicarGpsHistory.vehicleno, vehicleno),
                    gte(intellicarGpsHistory.commtime_ms, startMs),
                    lte(intellicarGpsHistory.commtime_ms, endMs)
                ))
                .orderBy(desc(intellicarGpsHistory.commtime_ms))
                .limit(50000);
        } else if (dataset === "can") {
            rows = await db.select().from(intellicarCanHistory)
                .where(and(
                    eq(intellicarCanHistory.vehicleno, vehicleno),
                    gte(intellicarCanHistory.time_ms, startMs),
                    lte(intellicarCanHistory.time_ms, endMs)
                ))
                .orderBy(desc(intellicarCanHistory.time_ms))
                .limit(50000);
        } else if (dataset === "fuel_pct") {
            rows = await db.select().from(intellicarFuelHistory)
                .where(and(
                    eq(intellicarFuelHistory.vehicleno, vehicleno),
                    eq(intellicarFuelHistory.in_litres, false),
                    gte(intellicarFuelHistory.time_ms, startMs),
                    lte(intellicarFuelHistory.time_ms, endMs)
                ))
                .orderBy(desc(intellicarFuelHistory.time_ms))
                .limit(50000);
        } else if (dataset === "fuel_litres") {
            rows = await db.select().from(intellicarFuelHistory)
                .where(and(
                    eq(intellicarFuelHistory.vehicleno, vehicleno),
                    eq(intellicarFuelHistory.in_litres, true),
                    gte(intellicarFuelHistory.time_ms, startMs),
                    lte(intellicarFuelHistory.time_ms, endMs)
                ))
                .orderBy(desc(intellicarFuelHistory.time_ms))
                .limit(50000);
        } else if (dataset === "distance") {
            rows = await db.select().from(intellicarDistanceWindows)
                .where(and(
                    eq(intellicarDistanceWindows.vehicleno, vehicleno),
                    gte(intellicarDistanceWindows.start_ms, startMs),
                    lte(intellicarDistanceWindows.end_ms, endMs)
                ))
                .orderBy(desc(intellicarDistanceWindows.start_ms))
                .limit(50000);
        } else {
            return NextResponse.json({ success: false, error: "Invalid dataset" }, { status: 400 });
        }

        const filename = `intellicar_${dataset}_${vehicleno}_${startMs}_${endMs}`;

        if (format === "json") {
            return NextResponse.json(rows, {
                headers: {
                    "Content-Disposition": `attachment; filename="${filename}.json"`,
                    "Content-Type": "application/json"
                }
            });
        }

        // CSV mapping
        if (rows.length === 0) {
            return new NextResponse("No data found for the selected range.", {
                headers: {
                    "Content-Disposition": `attachment; filename="${filename}.csv"`,
                    "Content-Type": "text/csv"
                }
            });
        }

        const keys = Object.keys(rows[0]).filter(k => k !== 'raw'); // omit raw jsonb

        let csvString = keys.join(",") + "\n";

        for (const row of rows) {
            const line = keys.map(k => {
                let val = row[k];
                if (val === null || val === undefined) return "";
                if (val instanceof Date) return val.toISOString();
                // Escape quotes
                let str = String(val).replace(/"/g, '""');
                if (str.includes(",") || str.includes("\n") || str.includes("\"")) {
                    return `"${str}"`;
                }
                return str;
            }).join(",");
            csvString += line + "\n";
        }

        return new NextResponse(csvString, {
            headers: {
                "Content-Disposition": `attachment; filename="${filename}.csv"`,
                "Content-Type": "text/csv"
            }
        });

    } catch (e: any) {
        console.error("Export API Error:", e);
        return NextResponse.json({ success: false, error: e?.message || "Internal Error" }, { status: 500 });
    }
};
