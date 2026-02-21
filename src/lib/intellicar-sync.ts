import { db } from "@/lib/db";
import {
  intellicarPulls,
  intellicarSyncRuns,
  intellicarSyncRunItems,
  intellicarVehicleDeviceMap,
  intellicarGpsLatest,
  intellicarCanLatest,
  intellicarFuelLatest,
  intellicarGpsHistory,
  intellicarCanHistory,
  intellicarFuelHistory,
  intellicarDistanceWindows,
  intellicarHistoryCheckpoints,
  intellicarHistoryJobControl,
} from "@/lib/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { generateId } from "@/lib/api-utils";
import {
  intellicarPost, toNum, toDecStr,
  getgpshistory, getbatterymetricshistory, getfuelhistory, getdistancetravelled
} from "@/lib/intellicar";

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

/**
 * Floors a timestamp to the nearest 5-minute interval (in ms).
 */
export function computeWindowMs(nowMs: number) {
  const FIVE_MINS = 5 * 60 * 1000;
  const endMs = Math.floor(nowMs / FIVE_MINS) * FIVE_MINS;
  const startMs = endMs - FIVE_MINS;
  return { startMs, endMs };
}

async function logPull(endpoint: string, status: "success" | "failed", payload?: any, error?: any) {
  // Use UUID to avoid collisions
  const id = `INTC-${crypto.randomUUID()}`;

  try {
    await db.insert(intellicarPulls).values({
      id,
      endpoint,
      status,
      payload: payload ?? null,
      error: error ? (error?.message || String(error)) : null,
    });
  } catch (e) {
    // IMPORTANT: never let logging failure crash the sync
    console.error("intellicar_pulls logging failed:", e);
  }
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
  const { startMs: windowStartMs, endMs: windowEndMs } = computeWindowMs(startedAt.getTime());

  // 1) Create sync run
  const [run] = await db
    .insert(intellicarSyncRuns)
    .values({
      trigger: opts.trigger,
      status: "running",
      started_at: startedAt,
      window_start_ms: windowStartMs,
      window_end_ms: windowEndMs,
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

export async function ensureHistoryJobRow() {
  let [job] = await db.select().from(intellicarHistoryJobControl).where(eq(intellicarHistoryJobControl.id, 1));
  if (!job) {
    [job] = await db.insert(intellicarHistoryJobControl).values({ id: 1 }).returning();
  }
  return job;
}

export async function setHistoryJobStatus(status: 'running' | 'paused' | 'idle') {
  await ensureHistoryJobRow();
  await db.update(intellicarHistoryJobControl).set({ status, updated_at: new Date() }).where(eq(intellicarHistoryJobControl.id, 1));
  return { status };
}

export async function getHistoryStatusSummary() {
  const job = await ensureHistoryJobRow();
  const rawCheckpoints = await db.select().from(intellicarHistoryCheckpoints);

  const { endMs: globalEndMs } = computeWindowMs(Date.now());
  const progress: any = { globalEndMs };

  const datasets = ['gps', 'can', 'fuel_pct', 'fuel_litres', 'distance'];
  datasets.forEach(ds => progress[ds] = { min: null, max: null, lagMs: null, completeVehicles: 0, totalVehicles: 0 });

  rawCheckpoints.forEach(cp => {
    const ds = progress[cp.dataset];
    if (ds) {
      ds.totalVehicles++;
      const endMs = Number(cp.last_synced_end_ms);
      if (ds.min === null || endMs < ds.min) ds.min = endMs;
      if (ds.max === null || endMs > ds.max) ds.max = endMs;
      if (endMs >= globalEndMs) ds.completeVehicles++;
    }
  });

  datasets.forEach(ds => {
    const d = progress[ds];
    if (d.min !== null) {
      d.lagMs = globalEndMs - d.min;
    } else {
      d.lagMs = globalEndMs - Number(job.historical_start_ms);
    }
  });

  return { job_control: job, progress };
}

export async function runIntellicarHistoricalRunOnce(opts: { maxWindowsPerRun?: number; vehicleno?: string } = {}) {
  const startedAt = new Date();

  // 1) Check job control
  const job = await ensureHistoryJobRow();

  if (job.status !== "running") {
    return { status: "skipped", reason: `Job is ${job.status}`, serverTime: nowIso() };
  }

  const maxWindows = opts.maxWindowsPerRun ?? job.max_windows_per_run;
  const LOCKED_HISTORICAL_START_MS = Date.parse("2025-09-01T00:00:00.000Z");
  const { endMs: globalEndMs } = computeWindowMs(startedAt.getTime());

  // 2) Get mapping
  const mappings = await db.select().from(intellicarVehicleDeviceMap).where(opts.vehicleno ? eq(intellicarVehicleDeviceMap.vehicleno, opts.vehicleno) : eq(intellicarVehicleDeviceMap.active, true));

  const datasets = ['gps', 'can', 'fuel_pct', 'fuel_litres', 'distance'] as const;
  let totalWindowsProcessed = 0;
  const summary: any[] = [];

  // Loop vehicles and datasets until we hit maxWindows
  outer: for (const m of mappings) {
    for (const dataset of datasets) {
      if (totalWindowsProcessed >= maxWindows) break outer;

      const [checkpoint] = await db.select().from(intellicarHistoryCheckpoints).where(and(eq(intellicarHistoryCheckpoints.vehicleno, m.vehicleno), eq(intellicarHistoryCheckpoints.dataset, dataset)));

      let currentStartMs = Math.max(checkpoint ? Number(checkpoint.last_synced_end_ms) : LOCKED_HISTORICAL_START_MS, LOCKED_HISTORICAL_START_MS);

      while (currentStartMs < globalEndMs && totalWindowsProcessed < maxWindows) {
        const currentJob = await ensureHistoryJobRow();
        if (currentJob.status !== "running") break outer; // Pause/Stop mid-run

        const currentEndMs = currentStartMs + (5 * 60 * 1000);
        if (currentEndMs > globalEndMs) break;

        try {
          await syncDatasetWindow(m.vehicleno, dataset, currentStartMs, currentEndMs);

          // Update checkpoint
          await db.insert(intellicarHistoryCheckpoints).values({
            vehicleno: m.vehicleno,
            dataset,
            last_synced_end_ms: currentEndMs,
            updated_at: new Date(),
          }).onConflictDoUpdate({
            target: [intellicarHistoryCheckpoints.vehicleno, intellicarHistoryCheckpoints.dataset],
            set: { last_synced_end_ms: currentEndMs, updated_at: new Date() }
          });

          totalWindowsProcessed++;
          currentStartMs = currentEndMs;
        } catch (e: any) {
          console.error(`Historical sync failed for ${m.vehicleno} ${dataset} [${currentStartMs}-${currentEndMs}]:`, e);
          // If a window fails, we might want to retry it next time or skip. For now, we stop for this vehicle/dataset.
          break;
        }
      }
    }
  }

  return {
    status: "success",
    windowsProcessed: totalWindowsProcessed,
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    serverTime: nowIso(),
  };
}

async function syncDatasetWindow(vehicleno: string, dataset: string, startMs: number, endMs: number) {
  const FIVE_MINS = 5 * 60 * 1000;

  if (dataset === 'gps') {
    const payload = await getgpshistory("", vehicleno, startMs, endMs);
    if (!okStatus(payload?.status)) throw new Error(payload?.msg || "GPS history failed");
    const rows = Array.isArray(payload?.data) ? payload.data : [];
    for (const d of rows) {
      let commtime_ms = Number(d.commtime);
      if (commtime_ms < 1e12) commtime_ms *= 1000;

      const latNum = Number(d.lat);
      const lngNum = Number(d.lng);
      if (isNaN(latNum) || isNaN(lngNum) || !d.lat || !d.lng) continue;

      await db.insert(intellicarGpsHistory).values({
        vehicleno,
        commtime_ms,
        lat: String(latNum),
        lng: String(lngNum),
        alti: toDecStr(d.alti),
        speed: toDecStr(d.speed),
        heading: toDecStr(d.heading),
        ignstatus: toNum(d.ignstatus),
        mobili: toNum(d.mobili),
        devbattery: toDecStr(d.devbattery),
        vehbattery: toDecStr(d.vehbattery),
        raw: d,
      }).onConflictDoNothing();
    }
  }
  else if (dataset === 'can') {
    const payload = await getbatterymetricshistory("", vehicleno, startMs, endMs);
    if (!okStatus(payload?.status)) throw new Error(payload?.msg || "CAN history failed");
    const rows = Array.isArray(payload?.data) ? payload.data : [];
    for (const d of rows) {
      let time_ms = Number(d.time);
      if (time_ms < 1e12) time_ms *= 1000;

      await db.insert(intellicarCanHistory).values({
        vehicleno,
        time_ms,
        soc: toDecStr(d.soc),
        soh: toDecStr(d.soh),
        battery_temp: toDecStr(d.battery_temp),
        battery_voltage: toDecStr(d.battery_voltage),
        current: toDecStr(d.current),
        charge_cycle: toNum(d.charge_cycle),
        raw: d,
      }).onConflictDoNothing();
    }
  }
  else if (dataset === 'fuel_pct' || dataset === 'fuel_litres') {
    const inlitres = dataset === 'fuel_litres';
    const payload = await getfuelhistory("", vehicleno, inlitres, startMs, endMs);
    if (!okStatus(payload?.status)) throw new Error(payload?.msg || "Fuel history failed");
    const rows = Array.isArray(payload?.data) ? payload.data : [];
    for (const d of rows) {
      let time_ms = Number(d.time);
      if (time_ms < 1e12) time_ms *= 1000;

      await db.insert(intellicarFuelHistory).values({
        vehicleno,
        time_ms,
        in_litres: inlitres,
        value: toDecStr(d.value),
        raw: d,
      }).onConflictDoNothing();
    }
  }
  else if (dataset === 'distance') {
    const payload = await getdistancetravelled("", vehicleno, startMs, endMs);
    if (!okStatus(payload?.status)) throw new Error(payload?.msg || "Distance failed");
    let distanceVal = payload?.data?.distance;
    if (distanceVal === undefined) {
      if (Array.isArray(payload?.data)) {
        if (payload.data.length > 0) {
          distanceVal = payload.data[0].distance ?? payload.data[0].value;
        } else {
          distanceVal = 0; // Empty payload means 0 distance
        }
      } else {
        distanceVal = payload?.data;
      }
    }

    if (distanceVal !== undefined && distanceVal !== null && String(distanceVal).trim() !== "") {
      const dNum = Number(distanceVal);
      if (!isNaN(dNum)) {
        await db.insert(intellicarDistanceWindows).values({
          vehicleno,
          start_ms: startMs,
          end_ms: endMs,
          distance: String(dNum),
          raw: payload.data || null,
        }).onConflictDoNothing();
      }
    }
  }
}