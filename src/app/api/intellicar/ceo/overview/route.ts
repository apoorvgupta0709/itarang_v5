import { withErrorHandler, successResponse } from "@/lib/api-utils";
import { requireRole } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import {
  intellicarSyncRuns,
  intellicarVehicleDeviceMap,
  intellicarGpsLatest,
  intellicarCanLatest,
  intellicarFuelLatest,
} from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";

export const GET = withErrorHandler(async () => {
  await requireRole(["ceo"]);

  const [lastRun] = await db
    .select()
    .from(intellicarSyncRuns)
    .orderBy(desc(intellicarSyncRuns.started_at))
    .limit(1);

  const rows = (res: any) => (Array.isArray(res) ? res : (res?.rows ?? []));

  const statsRaw = await db.execute(sql`
    SELECT
      (SELECT COUNT(*)::int FROM intellicar_vehicle_device_map) AS map_count,
      (SELECT MAX(last_seen_at) FROM intellicar_vehicle_device_map) AS map_latest,

      (SELECT COUNT(*)::int FROM intellicar_gps_latest) AS gps_count,
      (SELECT MAX(updated_at) FROM intellicar_gps_latest) AS gps_latest,

      (SELECT COUNT(*)::int FROM intellicar_can_latest) AS can_count,
      (SELECT MAX(updated_at) FROM intellicar_can_latest) AS can_latest,

      (SELECT COUNT(*)::int FROM intellicar_fuel_latest) AS fuel_count,
      (SELECT MAX(updated_at) FROM intellicar_fuel_latest) AS fuel_latest
  `);

  const stats = rows(statsRaw)?.[0] || {};

  const mapPreview = await db
    .select()
    .from(intellicarVehicleDeviceMap)
    .orderBy(desc(intellicarVehicleDeviceMap.last_seen_at))
    .limit(10);

  const gpsPreview = await db
    .select()
    .from(intellicarGpsLatest)
    .orderBy(desc(intellicarGpsLatest.updated_at))
    .limit(10);

  const canPreview = await db
    .select()
    .from(intellicarCanLatest)
    .orderBy(desc(intellicarCanLatest.updated_at))
    .limit(10);

  const fuelPreview = await db
    .select()
    .from(intellicarFuelLatest)
    .orderBy(desc(intellicarFuelLatest.updated_at))
    .limit(10);

  return successResponse({
    lastRun: lastRun || null,
    tableStats: {
      mapping: { rowCount: stats.map_count ?? 0, latestAt: stats.map_latest ?? null },
      gpsLatest: { rowCount: stats.gps_count ?? 0, latestAt: stats.gps_latest ?? null },
      canLatest: { rowCount: stats.can_count ?? 0, latestAt: stats.can_latest ?? null },
      fuelLatest: { rowCount: stats.fuel_count ?? 0, latestAt: stats.fuel_latest ?? null },
    },
    previews: {
      mapping: mapPreview,
      gpsLatest: gpsPreview,
      canLatest: canPreview,
      fuelLatest: fuelPreview,
    },
  });
});