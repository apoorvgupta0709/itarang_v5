import { db } from "@/lib/db";
import {
  intellicarPulls,
  intellicarSyncRuns,
  intellicarSyncRunItems,
  intellicarVehicleDeviceMap,
  intellicarGpsLatest,
  intellicarCanLatest,
  intellicarFuelLatest,
} from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { generateId } from "@/lib/api-utils";
import { intellicarPost, toNum, toDecStr } from "@/lib/intellicar";

type RunOpts = {
  trigger: "cron" | "manual" | "backfill";
};

type MappingRow = { deviceno: string; vehicleno: string };

function okStatus(s: any) {
  return String(s || "").toUpperCase() === "SUCCESS";
}

function nowIso() {
  return new Date().toISOString();
}

async function logPull(endpoint: string, status: "success" | "failed", payload?: any, error?: any) {
  await db.insert(intellicarPulls).values({
    id: await generateId("INTC", intellicarPulls),
    endpoint,
    status,
    payload: payload ?? null,
    error: error ? (error?.message || String(error)) : null,
  });
}

async function logRunItem(params: {
  sync_run_id: string;
  endpoint: string;
  vehicleno?: string | null;
  status: "success" | "failed";
  payload?: any;
  error?: any;
}) {
  await db.insert(intellicarSyncRunItems).values({
    sync_run_id: params.sync_run_id,
    endpoint: params.endpoint,
    vehicleno: params.vehicleno ?? null,
    status: params.status,
    payload: params.payload ?? null,
    error: params.error ? (params.error?.message || String(params.error)) : null,
  });
}

export async function runIntellicarSync(opts: RunOpts) {
  const startedAt = new Date();

  // 1) Create sync run
  const [run] = await db
    .insert(intellicarSyncRuns)
    .values({
      trigger: opts.trigger,
      status: "running",
      started_at: startedAt,
      app_version: process.env.NEXT_PUBLIC_APP_VERSION || null,
    })
    .returning();

  const runId = run.id;

  const errors: Array<{ endpoint: string; vehicleno?: string; message: string }> = [];
  let vehiclesDiscovered = 0;
  let vehiclesUpdated = 0;
  let endpointsCalled = 0;
  let recordsWritten = 0;

  // ---- A) Mapping ----
  const mappingEndpoint = "/api/standard/listvehicledevicemapping";
  let mapping: MappingRow[] = [];

  try {
    endpointsCalled += 1;
    const payload = await intellicarPost(mappingEndpoint, {});
    await logPull(mappingEndpoint, "success", payload);
    await logRunItem({ sync_run_id: runId, endpoint: mappingEndpoint, status: "success", payload });

    if (!okStatus(payload?.status)) {
      throw new Error(payload?.msg || payload?.err || "Mapping call returned FAILURE");
    }

    mapping = Array.isArray(payload?.data) ? payload.data : [];
    vehiclesDiscovered = mapping.length;

    // Upsert mapping rows
    for (const row of mapping) {
      if (!row?.vehicleno || !row?.deviceno) continue;

      await db
        .insert(intellicarVehicleDeviceMap)
        .values({
          vehicleno: String(row.vehicleno),
          deviceno: String(row.deviceno),
          last_seen_at: new Date(),
          last_sync_run_id: runId,
          raw: row,
        })
        .onConflictDoUpdate({
          target: intellicarVehicleDeviceMap.vehicleno,
          set: {
            deviceno: String(row.deviceno),
            last_seen_at: new Date(),
            last_sync_run_id: runId,
            raw: row,
          },
        });

      recordsWritten += 1;
    }
  } catch (e: any) {
    await logPull(mappingEndpoint, "failed", null, e);
    await logRunItem({ sync_run_id: runId, endpoint: mappingEndpoint, status: "failed", error: e });
    errors.push({ endpoint: mappingEndpoint, message: e?.message || "Unknown error" });
  }

  // ---- B) Per-vehicle latest calls ----
  const vehicles = mapping.map((m) => String(m.vehicleno)).filter(Boolean);

  for (const vehicleno of vehicles) {
    // 1) GPS latest
    const gpsEndpoint = "/api/standard/getlastgpsstatus";
    try {
      endpointsCalled += 1;
      const payload = await intellicarPost(gpsEndpoint, { vehicleno });
      await logPull(`${gpsEndpoint}?vehicleno=${vehicleno}`, "success", payload);
      await logRunItem({ sync_run_id: runId, endpoint: gpsEndpoint, vehicleno, status: "success", payload });

      if (okStatus(payload?.status) && payload?.data) {
        const d = payload.data;

        await db
          .insert(intellicarGpsLatest)
          .values({
            vehicleno,
            commtime_epoch: Number(d.commtime),
            lat: toDecStr(d.lat)!,
            lng: toDecStr(d.lng)!,
            alti: toDecStr(d.alti),
            devbattery: toDecStr(d.devbattery),
            vehbattery: toDecStr(d.vehbattery),
            speed: toDecStr(d.speed),
            heading: toDecStr(d.heading),
            ignstatus: toNum(d.ignstatus),
            mobili: toNum(d.mobili),
            dout_1: toNum(d.dout_1),
            dout_2: toNum(d.dout_2),
            updated_at: new Date(),
            last_sync_run_id: runId,
            raw: d,
          })
          .onConflictDoUpdate({
            target: intellicarGpsLatest.vehicleno,
            set: {
              commtime_epoch: Number(d.commtime),
              lat: toDecStr(d.lat)!,
              lng: toDecStr(d.lng)!,
              alti: toDecStr(d.alti),
              devbattery: toDecStr(d.devbattery),
              vehbattery: toDecStr(d.vehbattery),
              speed: toDecStr(d.speed),
              heading: toDecStr(d.heading),
              ignstatus: toNum(d.ignstatus),
              mobili: toNum(d.mobili),
              dout_1: toNum(d.dout_1),
              dout_2: toNum(d.dout_2),
              updated_at: new Date(),
              last_sync_run_id: runId,
              raw: d,
            },
          });

        recordsWritten += 1;
      } else {
        throw new Error(payload?.msg || payload?.err || "GPS call returned FAILURE");
      }
    } catch (e: any) {
      await logPull(`${gpsEndpoint}?vehicleno=${vehicleno}`, "failed", null, e);
      await logRunItem({ sync_run_id: runId, endpoint: gpsEndpoint, vehicleno, status: "failed", error: e });
      errors.push({ endpoint: gpsEndpoint, vehicleno, message: e?.message || "Unknown error" });
    }

    // 2) CAN latest
    const canEndpoint = "/api/standard/getlatestcan";
    try {
      endpointsCalled += 1;
      const payload = await intellicarPost(canEndpoint, { vehicleno });
      await logPull(`${canEndpoint}?vehicleno=${vehicleno}`, "success", payload);
      await logRunItem({ sync_run_id: runId, endpoint: canEndpoint, vehicleno, status: "success", payload });

      if (okStatus(payload?.status) && payload?.data) {
        const d = payload.data;

        await db
          .insert(intellicarCanLatest)
          .values({
            vehicleno,
            soc_value: toDecStr(d?.soc?.value),
            soc_ts_epoch: toNum(d?.soc?.timestamp),
            battery_temp_value: toDecStr(d?.battery_temp?.value),
            battery_temp_ts_epoch: toNum(d?.battery_temp?.timestamp),
            battery_voltage_value: toDecStr(d?.battery_voltage?.value),
            battery_voltage_ts_epoch: toNum(d?.battery_voltage?.timestamp),
            current_value: toDecStr(d?.current?.value),
            current_ts_epoch: toNum(d?.current?.timestamp),
            updated_at: new Date(),
            last_sync_run_id: runId,
            raw: d,
          })
          .onConflictDoUpdate({
            target: intellicarCanLatest.vehicleno,
            set: {
              soc_value: toDecStr(d?.soc?.value),
              soc_ts_epoch: toNum(d?.soc?.timestamp),
              battery_temp_value: toDecStr(d?.battery_temp?.value),
              battery_temp_ts_epoch: toNum(d?.battery_temp?.timestamp),
              battery_voltage_value: toDecStr(d?.battery_voltage?.value),
              battery_voltage_ts_epoch: toNum(d?.battery_voltage?.timestamp),
              current_value: toDecStr(d?.current?.value),
              current_ts_epoch: toNum(d?.current?.timestamp),
              updated_at: new Date(),
              last_sync_run_id: runId,
              raw: d,
            },
          });

        recordsWritten += 1;
      } else {
        throw new Error(payload?.msg || payload?.err || "CAN call returned FAILURE");
      }
    } catch (e: any) {
      await logPull(`${canEndpoint}?vehicleno=${vehicleno}`, "failed", null, e);
      await logRunItem({ sync_run_id: runId, endpoint: canEndpoint, vehicleno, status: "failed", error: e });
      errors.push({ endpoint: canEndpoint, vehicleno, message: e?.message || "Unknown error" });
    }

    // 3) Fuel latest
    const fuelEndpoint = "/api/standard/getlastfuelstatus";
    try {
      endpointsCalled += 1;
      const payload = await intellicarPost(fuelEndpoint, { vehicleno });
      await logPull(`${fuelEndpoint}?vehicleno=${vehicleno}`, "success", payload);
      await logRunItem({ sync_run_id: runId, endpoint: fuelEndpoint, vehicleno, status: "success", payload });

      if (okStatus(payload?.status) && payload?.data) {
        const d = payload.data;

        await db
          .insert(intellicarFuelLatest)
          .values({
            vehicleno,
            fueltime_epoch: Number(d.fueltime),
            fuellevel_pct: toDecStr(d.fuellevel),
            fuellevel_litres: toDecStr(d.fuellevellitres),
            updated_at: new Date(),
            last_sync_run_id: runId,
            raw: d,
          })
          .onConflictDoUpdate({
            target: intellicarFuelLatest.vehicleno,
            set: {
              fueltime_epoch: Number(d.fueltime),
              fuellevel_pct: toDecStr(d.fuellevel),
              fuellevel_litres: toDecStr(d.fuellevellitres),
              updated_at: new Date(),
              last_sync_run_id: runId,
              raw: d,
            },
          });

        recordsWritten += 1;
      } else {
        throw new Error(payload?.msg || payload?.err || "Fuel call returned FAILURE");
      }
    } catch (e: any) {
      await logPull(`${fuelEndpoint}?vehicleno=${vehicleno}`, "failed", null, e);
      await logRunItem({ sync_run_id: runId, endpoint: fuelEndpoint, vehicleno, status: "failed", error: e });
      errors.push({ endpoint: fuelEndpoint, vehicleno, message: e?.message || "Unknown error" });
    }

    vehiclesUpdated += 1;
  }

  // 2) Finish run
  const finishedAt = new Date();
  const hasErrors = errors.length > 0;
  const status =
    !vehiclesDiscovered ? (hasErrors ? "failed" : "failed")
    : hasErrors ? "partial"
    : "success";

  await db
    .update(intellicarSyncRuns)
    .set({
      status,
      finished_at: finishedAt,
      vehicles_discovered: vehiclesDiscovered,
      vehicles_updated: vehiclesUpdated,
      endpoints_called: endpointsCalled,
      records_written: recordsWritten,
      errors_count: errors.length,
      errors,
    })
    .where(eq(intellicarSyncRuns.id, runId));

  return {
    runId,
    status,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    vehiclesDiscovered,
    vehiclesUpdated,
    endpointsCalled,
    recordsWritten,
    errors,
    serverTime: nowIso(),
  };
}