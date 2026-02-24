import { NextRequest } from "next/server";
import { withErrorHandler, successResponse } from "@/lib/api-utils";
import { requireRole } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import {
    intellicarGpsHistory,
    intellicarCanHistory,
    intellicarFuelHistory,
    intellicarDistanceWindows
} from "@/lib/db/schema";
import { and, eq, gte, lte, desc } from "drizzle-orm";

export const GET = withErrorHandler(async (req: NextRequest) => {
    // 1. Authorization checks: Ensure only users with the 'ceo' role can access this endpoint
    await requireRole(["ceo"]);

    // 2. Parameter Extraction: Parse the URL query parameters
    const { searchParams } = new URL(req.url);
    const vehicleno = searchParams.get("vehicleno");

    // Dataset determines which table to query (e.g. "gps", "can"). Default is "all" to fetch from all tables.
    const dataset = searchParams.get("dataset") || "all";

    // Time windows (start and end timestamps formatted as milliseconds since Unix epoch)
    const startMs = Number(searchParams.get("startMs"));
    const endMs = Number(searchParams.get("endMs"));

    // Pagination parameters (limits the number of rows returned, offsets handle pages)
    const limit = Number(searchParams.get("limit") || "100");
    const offset = Number(searchParams.get("offset") || "0");

    // 3. Validation: Abort if required properties are missing or timestamps are totally invalid
    if (!vehicleno || isNaN(startMs) || isNaN(endMs)) {
        throw new Error("Missing required parameters: vehicleno, startMs, endMs");
    }

    // Metadata object returned in the response payload for debugging, logging, and client-side context tracking
    const meta = { vehicleno, dataset, startMs, endMs, limit, offset, returned: 0 };

    // 4A. Specific Dataset Route: Check if the client wants only 1 specific dataset, returning immediately after finding it
    if (dataset !== "all") {
        let rows: any[] = [];

        if (dataset === "gps") {
            // Fetch GPS location history within the time window. Newest records first.
            rows = await db.select().from(intellicarGpsHistory)
                .where(and(
                    eq(intellicarGpsHistory.vehicleno, vehicleno),
                    gte(intellicarGpsHistory.commtime_ms, startMs),
                    lte(intellicarGpsHistory.commtime_ms, endMs)
                ))
                .orderBy(desc(intellicarGpsHistory.commtime_ms))
                .limit(limit).offset(offset);
        } else if (dataset === "can") {
            // Fetch CAN bus history (e.g. battery metrics, hardware health) within time window
            rows = await db.select().from(intellicarCanHistory)
                .where(and(
                    eq(intellicarCanHistory.vehicleno, vehicleno),
                    gte(intellicarCanHistory.time_ms, startMs),
                    lte(intellicarCanHistory.time_ms, endMs)
                ))
                .orderBy(desc(intellicarCanHistory.time_ms))
                .limit(limit).offset(offset);
        } else if (dataset === "fuel_pct") {
            // Fetch fuel history specifically formatted as a percentage (in_litres is false)
            rows = await db.select().from(intellicarFuelHistory)
                .where(and(
                    eq(intellicarFuelHistory.vehicleno, vehicleno),
                    eq(intellicarFuelHistory.in_litres, false),
                    gte(intellicarFuelHistory.time_ms, startMs),
                    lte(intellicarFuelHistory.time_ms, endMs)
                ))
                .orderBy(desc(intellicarFuelHistory.time_ms))
                .limit(limit).offset(offset);
        } else if (dataset === "fuel_litres") {
            // Fetch fuel history where readings are explicitly in standard litres (in_litres is true)
            rows = await db.select().from(intellicarFuelHistory)
                .where(and(
                    eq(intellicarFuelHistory.vehicleno, vehicleno),
                    eq(intellicarFuelHistory.in_litres, true),
                    gte(intellicarFuelHistory.time_ms, startMs),
                    lte(intellicarFuelHistory.time_ms, endMs)
                ))
                .orderBy(desc(intellicarFuelHistory.time_ms))
                .limit(limit).offset(offset);
        } else if (dataset === "distance") {
            // Fetch Distance Windows
            // Logic: Uses "overlapping range technique" instead of a strict bounds search.
            // Data matches if: 
            // - The logged distance interval started before or exactly when our search period ENDS
            // AND
            // - The logged distance interval ended after or exactly when our search period STARTS
            rows = await db.select().from(intellicarDistanceWindows)
                .where(and(
                    eq(intellicarDistanceWindows.vehicleno, vehicleno),
                    lte(intellicarDistanceWindows.start_ms, endMs),
                    gte(intellicarDistanceWindows.end_ms, startMs)
                ))
                .orderBy(desc(intellicarDistanceWindows.start_ms))
                .limit(limit).offset(offset);
        }

        // Return the specific dataset payload object
        meta.returned = rows.length;
        return successResponse({ rows, meta });
    }

    // 4B. Global Dataset Route: dataset === "all" was requested, so execute queries across all tables sequentially

    const gps = await db.select().from(intellicarGpsHistory)
        .where(and(eq(intellicarGpsHistory.vehicleno, vehicleno), gte(intellicarGpsHistory.commtime_ms, startMs), lte(intellicarGpsHistory.commtime_ms, endMs)))
        .orderBy(desc(intellicarGpsHistory.commtime_ms)).limit(limit).offset(offset);

    const can = await db.select().from(intellicarCanHistory)
        .where(and(eq(intellicarCanHistory.vehicleno, vehicleno), gte(intellicarCanHistory.time_ms, startMs), lte(intellicarCanHistory.time_ms, endMs)))
        .orderBy(desc(intellicarCanHistory.time_ms)).limit(limit).offset(offset);

    const fuel_pct = await db.select().from(intellicarFuelHistory)
        .where(and(eq(intellicarFuelHistory.vehicleno, vehicleno), eq(intellicarFuelHistory.in_litres, false), gte(intellicarFuelHistory.time_ms, startMs), lte(intellicarFuelHistory.time_ms, endMs)))
        .orderBy(desc(intellicarFuelHistory.time_ms)).limit(limit).offset(offset);

    const fuel_litres = await db.select().from(intellicarFuelHistory)
        .where(and(eq(intellicarFuelHistory.vehicleno, vehicleno), eq(intellicarFuelHistory.in_litres, true), gte(intellicarFuelHistory.time_ms, startMs), lte(intellicarFuelHistory.time_ms, endMs)))
        .orderBy(desc(intellicarFuelHistory.time_ms)).limit(limit).offset(offset);

    const distance = await db.select().from(intellicarDistanceWindows)
        .where(and(eq(intellicarDistanceWindows.vehicleno, vehicleno), lte(intellicarDistanceWindows.start_ms, endMs), gte(intellicarDistanceWindows.end_ms, startMs)))
        .orderBy(desc(intellicarDistanceWindows.start_ms)).limit(limit).offset(offset);

    // Build the final response grouping all tables inside a single large JSON response
    return successResponse({ gps, can, fuel_pct, fuel_litres, distance, meta });
});
