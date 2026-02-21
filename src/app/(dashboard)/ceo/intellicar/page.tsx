"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Loader2, RefreshCcw, Satellite, History, Clock, Settings2, Activity, ChevronRight, Play, Pause } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

function fmt(d?: any) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString();
}

function minutesAgo(d?: any) {
  if (!d) return "—";
  const dt = new Date(d);
  const diffMs = Date.now() - dt.getTime();
  if (!Number.isFinite(diffMs)) return "—";
  const mins = Math.max(0, Math.round(diffMs / 60000));
  return `${mins} min ago`;
}

export default function CEOIntellicarPage() {
  const { user, loading } = useAuth();
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "sync">("overview");

  const isCEO = (user?.role || "").toLowerCase() === "ceo";

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["ceo-intellicar-overview"],
    queryFn: async () => {
      const res = await fetch("/api/intellicar/ceo/overview");
      if (!res.ok) throw new Error("Failed to load intellicar overview");
      const j = await res.json();
      return j.data;
    },
    refetchInterval: 60_000,
  });

  const lastRun = data?.lastRun || null;
  const stats = data?.tableStats || {};
  const previews = data?.previews || {};

  const runSyncNow = async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/intellicar/ceo/trigger-sync", { method: "POST" });
      if (!res.ok) throw new Error(await res.text().catch(() => "Sync failed"));
      await refetch();
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading…</p>
      </div>
    );
  }

  if (!isCEO) {
    return (
      <div className="p-8 rounded-2xl bg-red-50 border border-red-100 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-red-900">Access restricted</h2>
        <p className="text-sm text-red-700 mt-2">This panel is only available for CEO login.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading Intellicar dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-2xl bg-red-50 border border-red-100 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-red-900">Intellicar dashboard error</h2>
        <p className="text-sm text-red-700 mt-2">Check DB migrations + Intellicar credentials.</p>
      </div>
    );
  }

  const runBadge =
    lastRun?.status === "success" ? { icon: CheckCircle2, text: "Success" } :
      lastRun?.status === "partial" ? { icon: AlertCircle, text: "Partial" } :
        lastRun?.status === "failed" ? { icon: AlertCircle, text: "Failed" } :
          { icon: AlertCircle, text: "Unknown" };

  const BadgeIcon = runBadge.icon;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Satellite className="w-6 h-6 text-brand-600" /> Intellicar (CEO)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time tracking, historical logs, and automated backfills.
          </p>
        </div>

        {activeTab === "overview" && (
          <button
            onClick={runSyncNow}
            disabled={running}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold shadow-sm hover:bg-brand-700 disabled:opacity-60 transition-all active:scale-95"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
            Run Sync Now
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-100/50 backdrop-blur-sm rounded-2xl w-fit border border-gray-200/50 shadow-sm">
        {(["overview", "history", "sync"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === tab
              ? "bg-white text-brand-600 shadow-sm ring-1 ring-black/5"
              : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
              }`}
          >
            {tab === "overview" && <Activity className="w-4 h-4" />}
            {tab === "history" && <History className="w-4 h-4" />}
            {tab === "sync" && <Settings2 className="w-4 h-4" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <BadgeIcon className="w-4 h-4" />
                  Last Sync Run: {runBadge.text}
                </h3>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-medium">
                  Started: {fmt(lastRun?.started_at)} • Finished: {fmt(lastRun?.finished_at)}
                </p>
              </div>

              <div className="flex gap-2">
                {[
                  { label: "Vehicles", val: `${lastRun?.vehicles_updated ?? 0}/${lastRun?.vehicles_discovered ?? 0}` },
                  { label: "Endpoints", val: lastRun?.endpoints_called ?? 0 },
                  { label: "Errors", val: lastRun?.errors_count ?? 0, error: !!lastRun?.errors_count },
                ].map((s) => (
                  <div key={s.label} className={`px-4 py-2 rounded-xl border ${s.error ? "bg-red-50/50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{s.label}</p>
                    <p className={`text-sm font-black ${s.error ? "text-red-900" : "text-gray-900"}`}>{s.val}</p>
                  </div>
                ))}
              </div>
            </div>

            {!!lastRun?.errors_count && Array.isArray(lastRun?.errors) && (
              <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100">
                <p className="text-xs font-semibold text-red-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5" /> Recent Errors (top 5)
                </p>
                <ul className="space-y-1 text-xs text-red-800">
                  {lastRun.errors.slice(0, 5).map((e: any, idx: number) => (
                    <li key={idx}>
                      <span className="font-semibold">{e.endpoint}</span>
                      {e.vehicleno ? ` (${e.vehicleno})` : ""}: {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { key: "mapping", title: "Mapping", s: stats.mapping },
              { key: "gpsLatest", title: "GPS Latest", s: stats.gpsLatest },
              { key: "canLatest", title: "CAN Latest", s: stats.canLatest },
              { key: "fuelLatest", title: "Fuel Latest", s: stats.fuelLatest },
            ].map((t) => (
              <div key={t.key} className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-brand-100 transition-colors group">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-brand-500">{t.title}</p>
                <p className="mt-2 text-xl font-black text-gray-900 tracking-tight">{t.s?.rowCount ?? 0} <span className="text-[10px] text-gray-400 font-medium">ROWS</span></p>
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Latest</span>
                  <span className="text-[10px] font-black text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{minutesAgo(t.s?.latestAt)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <PreviewTable title="intellicar_vehicle_device_map" rows={previews.mapping || []} />
            <PreviewTable title="intellicar_gps_latest" rows={previews.gpsLatest || []} />
            <PreviewTable title="intellicar_can_latest" rows={previews.canLatest || []} />
            <PreviewTable title="intellicar_fuel_latest" rows={previews.fuelLatest || []} />
          </div>
        </div>
      )}

      {activeTab === "history" && <HistoryTab />}
      {activeTab === "sync" && <HistoricalSyncTab />}
    </div>
  );
}

function HistoryTab() {
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [range, setRange] = useState<"today" | "yesterday" | "7d" | "custom">("today");
  const [dataset, setDataset] = useState<string>("all");

  const { data: vehicles } = useQuery({
    queryKey: ["ceo-intellicar-vehicles"],
    queryFn: async () => {
      const res = await fetch("/api/intellicar/ceo/vehicles");
      const j = await res.json();
      return j.data;
    }
  });

  const timeRange = useMemo(() => {
    const now = new Date();
    const endMs = now.getTime();
    let startMs = endMs;

    if (range === "today") {
      startMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    } else if (range === "yesterday") {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      d.setDate(d.getDate() - 1);
      startMs = d.getTime();
    } else if (range === "7d") {
      startMs = endMs - (7 * 24 * 60 * 60 * 1000);
    }
    return { startMs, endMs };
  }, [range]);

  const { data: history, isFetching } = useQuery({
    queryKey: ["ceo-intellicar-history", selectedVehicle, timeRange.startMs, timeRange.endMs, dataset],
    queryFn: async () => {
      if (!selectedVehicle) return null;
      const res = await fetch(`/api/intellicar/ceo/history?vehicleno=${selectedVehicle}&startMs=${timeRange.startMs}&endMs=${timeRange.endMs}&dataset=${dataset}&limit=1000`);
      const j = await res.json();
      return j.data;
    },
    enabled: !!selectedVehicle
  });

  const handleExport = (format: "csv" | "json") => {
    if (!selectedVehicle) return;
    const url = `/api/intellicar/ceo/export?vehicleno=${selectedVehicle}&startMs=${timeRange.startMs}&endMs=${timeRange.endMs}&dataset=${dataset}&format=${format}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row gap-4 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
        <div className="flex-1 space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Select Vehicle</label>
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-gray-100 bg-gray-50 text-sm font-semibold focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
          >
            <option value="">Choose a vehicle...</option>
            {vehicles?.map((v: any) => (
              <option key={v.vehicleno} value={v.vehicleno}>{v.vehicleno}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Dataset</label>
          <select
            value={dataset}
            onChange={(e) => setDataset(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-gray-100 bg-gray-50 text-sm font-semibold focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
          >
            <option value="all">All (Preview only)</option>
            <option value="gps">GPS History</option>
            <option value="can">CAN Metrics</option>
            <option value="fuelPct">Fuel (Percentage)</option>
            <option value="fuelLitres">Fuel (Litres)</option>
            <option value="distance">Distance Windows</option>
          </select>
        </div>

        <div className="flex-1 space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Time Range</label>
          <div className="flex p-1 bg-gray-50 rounded-xl border border-gray-100">
            {(["today", "yesterday", "7d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${range === r ? "bg-white text-brand-600 shadow-sm border border-gray-100" : "text-gray-400 hover:text-gray-600"
                  }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!selectedVehicle ? (
        <div className="h-[40vh] flex flex-col items-center justify-center gap-3 grayscale opacity-40">
          <Satellite className="w-12 h-12 text-gray-300" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Select a vehicle to view history</p>
        </div>
      ) : isFetching ? (
        <div className="h-[40vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Fetching historical data…</p>
        </div>
      ) : (
        <div className="space-y-6">
          {dataset !== "all" && (
            <div className="flex justify-end gap-3 mb-2">
              <button onClick={() => handleExport("csv")} className="px-3 py-1.5 text-xs font-bold bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Export CSV
              </button>
              <button onClick={() => handleExport("json")} className="px-3 py-1.5 text-xs font-bold bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Export JSON
              </button>
            </div>
          )}

          {(dataset === "all" || dataset === "gps") && <PreviewTable title="GPS History" rows={history?.gpsHistory || []} />}
          {(dataset === "all" || dataset === "can") && <PreviewTable title="CAN Metrics History" rows={history?.canHistory || []} />}
          {(dataset === "all" || dataset === "fuelPct") && <PreviewTable title="Fuel History (Pct)" rows={history?.fuelPct || []} />}
          {(dataset === "all" || dataset === "fuelLitres") && <PreviewTable title="Fuel History (Litres)" rows={history?.fuelLitres || []} />}
          {(dataset === "all" || dataset === "distance") && <PreviewTable title="Distance Windows (5m)" rows={history?.distance || []} />}
        </div>
      )}
    </div>
  );
}

function HistoricalSyncTab() {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const { data: status, refetch } = useQuery({
    queryKey: ["ceo-historical-sync-status"],
    queryFn: async () => {
      const res = await fetch("/api/intellicar/ceo/historical-sync/status");
      const j = await res.json();
      return j.data;
    },
    refetchInterval: 10_000
  });

  const runAction = async (endpoint: string) => {
    setLoadingAction(endpoint);
    try {
      await fetch(`/api/intellicar/ceo/historical-sync/${endpoint}`, { method: "POST" });
      await refetch();
    } finally {
      setLoadingAction(null);
    }
  };

  const job = status?.job;
  const isRunning = job?.status === "running";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Card */}
        <div className="p-8 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-3 h-3 rounded-full animate-pulse ${isRunning ? "bg-green-500" : "bg-gray-400"}`} />
              <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase">Backfill Status: {job?.status}</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Backfill Start</span>
                <span className="font-black text-gray-900">{fmt(job?.historical_start_ms)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Windows Per Run</span>
                <span className="font-black text-gray-900">{job?.max_windows_per_run} (approx {job?.max_windows_per_run * 5} mins)</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Last Heartbeat</span>
                <span className="font-black text-gray-900">{minutesAgo(job?.updated_at)}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            {isRunning ? (
              <button
                onClick={() => runAction("pause")}
                disabled={!!loadingAction}
                className="flex-1 h-12 rounded-xl bg-orange-500 text-white font-bold text-sm shadow-sm hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
              >
                {loadingAction === "pause" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
                Pause Job
              </button>
            ) : (
              <button
                onClick={() => runAction(job?.status === "paused" ? "resume" : "start")}
                disabled={!!loadingAction}
                className="flex-1 h-12 rounded-xl bg-green-600 text-white font-bold text-sm shadow-sm hover:bg-green-700 transition-all flex items-center justify-center gap-2"
              >
                {loadingAction === "start" || loadingAction === "resume" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {job?.status === "paused" ? "Resume Job" : "Start Job"}
              </button>
            )}

            <button
              onClick={() => runAction("run-once")}
              disabled={!!loadingAction}
              className="flex-1 h-12 rounded-xl bg-brand-600 text-white font-bold text-sm shadow-sm hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
            >
              {loadingAction === "run-once" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
              Run One Batch
            </button>
          </div>
        </div>

        {/* Stats Column */}
        <div className="space-y-4">
          {status?.stats?.map((s: any) => (
            <div key={s.dataset} className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-brand-500">{s.dataset} progress</h4>
                <p className="text-[10px] font-black text-gray-500">{s.vehicle_count} vehicles</p>
              </div>
              <div className="flex items-end justify-between gap-4">
                <p className="text-xs font-bold text-gray-900">
                  Synced up to: <span className="text-brand-600">{fmt(s.max_end_ms)}</span>
                </p>
                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                  <Clock className="w-3 h-3" />
                  {minutesAgo(s.max_end_ms)}
                </div>
              </div>
              <div className="absolute bottom-0 left-0 h-1 bg-brand-500/10 w-full">
                <div className="h-full bg-brand-500" style={{ width: '45%' }} /> {/* Placeholder for actual progress % if we knew the total goal */}
              </div>
            </div>
          ))}
        </div>
      </div>

      <PreviewTable title="Recent Checkpoints" rows={status?.checkpoints || []} />
    </div>
  );
}

function PreviewTable({ title, rows }: { title: string; rows: any[] }) {
  const cols = useMemo(() => {
    const r0 = rows?.[0];
    if (!r0) return [];
    // Show only a compact set of columns by default (hide huge raw JSON unless expanded)
    const preferred = ["vehicleno", "deviceno", "commtime_epoch", "commtime_ms", "time_ms", "start_ms", "end_ms", "lat", "lng", "speed", "soc", "soc_value", "battery_voltage", "current", "fuellevel_pct", "value", "distance", "updated_at", "last_seen_at"];
    const keys = Object.keys(r0);
    const list = preferred.filter((k) => keys.includes(k));
    // also include id if present
    if (keys.includes("id") && !list.includes("id")) list.unshift("id");
    return list.length ? list : keys.slice(0, 8);
  }, [rows]);

  return (
    <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{rows.length} rows</span>
      </div>

      {rows.length === 0 ? (
        <div className="py-6 text-center text-sm text-gray-500 border-2 border-dashed border-gray-50 rounded-xl">No rows yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-50">
                {cols.map((c) => (
                  <th key={c} className="py-3 pr-4 font-black uppercase tracking-widest text-[10px] whitespace-nowrap">{c.replace(/_/g, " ")}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 10).map((r, idx) => (
                <tr key={idx} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                  {cols.map((c) => (
                    <td key={c} className="py-3 pr-4 text-[11px] font-medium text-gray-700 whitespace-nowrap">
                      {c.includes("_ms") || c.includes("_epoch") || c.toLowerCase().includes("at")
                        ? fmt(r?.[c])
                        : String(r?.[c] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}