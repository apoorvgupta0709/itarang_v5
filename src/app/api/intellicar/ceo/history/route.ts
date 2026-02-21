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
    await requireRole(["ceo"]);

    const { searchParams } = new URL(req.url);
    const vehicleno = searchParams.get("vehicleno");
    const dataset = searchParams.get("dataset") || "all";
    const startMs = Number(searchParams.get("startMs"));
    const endMs = Number(searchParams.get("endMs"));
    const limit = Number(searchParams.get("limit") || "100");
    const offset = Number(searchParams.get("offset") || "0");

    if (!vehicleno || isNaN(startMs) || isNaN(endMs)) {
        throw new Error("Missing required parameters: vehicleno, startMs, endMs");
    }

    const payload: any = {};

    if (dataset === "all" || dataset === "gps") {
        payload.gpsHistory = await db.select().from(intellicarGpsHistory)
            .where(and(
                eq(intellicarGpsHistory.vehicleno, vehicleno),
                gte(intellicarGpsHistory.commtime_ms, startMs),
                lte(intellicarGpsHistory.commtime_ms, endMs)
            ))
            .orderBy(desc(intellicarGpsHistory.commtime_ms))
            .limit(limit)
            .offset(offset);
    }

    if (dataset === "all" || dataset === "can") {
        payload.canHistory = await db.select().from(intellicarCanHistory)
            .where(and(
                eq(intellicarCanHistory.vehicleno, vehicleno),
                gte(intellicarCanHistory.time_ms, startMs),
                lte(intellicarCanHistory.time_ms, endMs)
            ))
            .orderBy(desc(intellicarCanHistory.time_ms))
            .limit(limit)
            .offset(offset);
    }

    if (dataset === "all" || dataset === "fuelPct") {
        payload.fuelPct = await db.select().from(intellicarFuelHistory)
            .where(and(
                eq(intellicarFuelHistory.vehicleno, vehicleno),
                eq(intellicarFuelHistory.in_litres, false),
                gte(intellicarFuelHistory.time_ms, startMs),
                lte(intellicarFuelHistory.time_ms, endMs)
            ))
            .orderBy(desc(intellicarFuelHistory.time_ms))
            .limit(limit)
            .offset(offset);
    }

    if (dataset === "all" || dataset === "fuelLitres") {
        payload.fuelLitres = await db.select().from(intellicarFuelHistory)
            .where(and(
                eq(intellicarFuelHistory.vehicleno, vehicleno),
                eq(intellicarFuelHistory.in_litres, true),
                gte(intellicarFuelHistory.time_ms, startMs),
                lte(intellicarFuelHistory.time_ms, endMs)
            ))
            .orderBy(desc(intellicarFuelHistory.time_ms))
            .limit(limit)
            .offset(offset);
    }

    if (dataset === "all" || dataset === "distance") {
        payload.distance = await db.select().from(intellicarDistanceWindows)
            .where(and(
                eq(intellicarDistanceWindows.vehicleno, vehicleno),
                gte(intellicarDistanceWindows.start_ms, startMs),
                lte(intellicarDistanceWindows.end_ms, endMs)
            ))
            .orderBy(desc(intellicarDistanceWindows.start_ms))
            .limit(limit)
            .offset(offset);
    }

    return successResponse(payload);
});
