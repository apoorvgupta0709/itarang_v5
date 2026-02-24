import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-utils";
import {
    getIntellicarToken,
    getGpsHistory,
    getBatteryMetricsHistory,
    getDistanceTravelled
} from "@/lib/intellicar";

export const GET = async (req: NextRequest) => {
    try {
        await requireRole(["ceo"]);

        const { searchParams } = new URL(req.url);
        const vehicleno = searchParams.get("vehicleno");
        const dataset = searchParams.get("dataset");
        const startMs = Number(searchParams.get("startMs"));
        const endMs = Number(searchParams.get("endMs"));
        const format = searchParams.get("format") || "csv"; // csv or json

        if (!vehicleno || !dataset || isNaN(startMs) || isNaN(endMs) || startMs >= endMs) {
            return NextResponse.json({ success: false, error: "Missing or invalid parameters: vehicleno, dataset, startMs, endMs" }, { status: 400 });
        }

        const allowedDatasets = ["gps", "can", "distance"];
        if (!allowedDatasets.includes(dataset)) {
            return NextResponse.json({ success: false, error: "Invalid dataset mode for direct export" }, { status: 400 });
        }

        const token = await getIntellicarToken();
        let payload: any;

        if (dataset === "gps") {
            payload = await getGpsHistory(token, vehicleno, startMs, endMs);
        } else if (dataset === "can") {
            payload = await getBatteryMetricsHistory(token, vehicleno, startMs, endMs);
        } else if (dataset === "distance") {
            payload = await getDistanceTravelled(token, vehicleno, startMs, endMs);
        }

        if (payload?.status !== "SUCCESS") {
            return NextResponse.json({
                success: false,
                msg: payload?.msg,
                err: payload?.err || payload?.error
            }, { status: 400 });
        }

        const filename = `intellicar_${vehicleno}_${dataset}_${startMs}_${endMs}`;
        let rows = payload?.data;

        // Ensure arrays out of standard nested objects
        if (dataset === "distance") {
            // Flatten nested startLoc/endLoc if needed across distance payload
            if (!Array.isArray(rows)) {
                // Return as an array of 1 object
                const singleObj = typeof rows === "object" && rows !== null ? rows : typeof payload?.distance !== "undefined" ? { distance: payload.distance } : {};

                // Flatten typical distance object map
                const flattened: any = { ...singleObj };
                if (singleObj.startLoc) {
                    flattened.start_lat = singleObj.startLoc.lat;
                    flattened.start_lng = singleObj.startLoc.lng;
                    delete flattened.startLoc;
                }
                if (singleObj.endLoc) {
                    flattened.end_lat = singleObj.endLoc.lat;
                    flattened.end_lng = singleObj.endLoc.lng;
                    delete flattened.endLoc;
                }
                rows = [flattened];
            } else if (rows.length > 0 && typeof rows[0] === 'object') {
                rows = rows.map((r: any) => {
                    const flat = { ...r };
                    if (r.startLoc) {
                        flat.start_lat = r.startLoc.lat;
                        flat.start_lng = r.startLoc.lng;
                        delete flat.startLoc;
                    }
                    if (r.endLoc) {
                        flat.end_lat = r.endLoc.lat;
                        flat.end_lng = r.endLoc.lng;
                        delete flat.endLoc;
                    }
                    return flat;
                });
            }
        }

        if (!Array.isArray(rows)) rows = [];

        if (format === "json") {
            return NextResponse.json(rows, {
                headers: {
                    "Content-Disposition": `attachment; filename="${filename}.json"`,
                    "Content-Type": "application/json; charset=utf-8"
                }
            });
        }

        // CSV mapping
        if (rows.length === 0) {
            return new NextResponse("No data found for the selected range.", {
                headers: {
                    "Content-Disposition": `attachment; filename="${filename}.csv"`,
                    "Content-Type": "text/csv; charset=utf-8"
                }
            });
        }

        // Aggregate unique keys
        const keysSet = new Set<string>();
        rows.forEach((r: any) => {
            if (typeof r === 'object' && r !== null) {
                Object.keys(r).forEach(k => keysSet.add(k));
            }
        });
        const keys = Array.from(keysSet);

        let csvString = keys.join(",") + "\n";

        for (const row of rows) {
            const line = keys.map(k => {
                let val = (row as any)[k];
                // handle nested primitive objects gently if distance flattening missed it
                if (typeof val === 'object' && val !== null) {
                    val = JSON.stringify(val);
                }
                if (val === null || val === undefined) return "";
                if (val instanceof Date) return val.toISOString();

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
                "Content-Type": "text/csv; charset=utf-8"
            }
        });

    } catch (e: any) {
        console.error("Export From Intellicar API Error:", e);
        return NextResponse.json({ success: false, error: e?.message || "Internal Error" }, { status: 500 });
    }
};
