"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Loader2, RefreshCcw, Satellite } from "lucide-react";
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
            Sync status + DB previews. Cron runs every 5 minutes.
          </p>
        </div>

        <button
          onClick={runSyncNow}
          disabled={running}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold shadow-sm hover:bg-brand-700 disabled:opacity-60"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
          Run Sync Now
        </button>
      </div>

      {/* Sync status */}
      <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <BadgeIcon className="w-4 h-4" />
              Last Sync Run: {runBadge.text}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Started: {fmt(lastRun?.started_at)} • Finished: {fmt(lastRun?.finished_at)}
            </p>
          </div>

          <div className="flex gap-3">
            <div className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-[10px] text-gray-500 font-semibold">Vehicles</p>
              <p className="text-sm font-bold text-gray-900">{lastRun?.vehicles_updated ?? 0}/{lastRun?.vehicles_discovered ?? 0}</p>
            </div>
            <div className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-[10px] text-gray-500 font-semibold">Endpoints</p>
              <p className="text-sm font-bold text-gray-900">{lastRun?.endpoints_called ?? 0}</p>
            </div>
            <div className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-[10px] text-gray-500 font-semibold">Errors</p>
              <p className="text-sm font-bold text-gray-900">{lastRun?.errors_count ?? 0}</p>
            </div>
          </div>
        </div>

        {!!lastRun?.errors_count && Array.isArray(lastRun?.errors) && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100">
            <p className="text-xs font-semibold text-red-900 mb-2">Latest Errors (top 5)</p>
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

      {/* Table health */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { key: "mapping", title: "Mapping", s: stats.mapping },
          { key: "gpsLatest", title: "GPS Latest", s: stats.gpsLatest },
          { key: "canLatest", title: "CAN Latest", s: stats.canLatest },
          { key: "fuelLatest", title: "Fuel Latest", s: stats.fuelLatest },
        ].map((t) => (
          <div key={t.key} className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">{t.title}</p>
            <p className="mt-2 text-sm font-bold text-gray-900">{t.s?.rowCount ?? 0} rows</p>
            <p className="mt-1 text-xs text-gray-500">Latest: {minutesAgo(t.s?.latestAt)}</p>
          </div>
        ))}
      </div>

      {/* Previews */}
      <div className="space-y-6">
        <PreviewTable title="intellicar_vehicle_device_map" rows={previews.mapping || []} />
        <PreviewTable title="intellicar_gps_latest" rows={previews.gpsLatest || []} />
        <PreviewTable title="intellicar_can_latest" rows={previews.canLatest || []} />
        <PreviewTable title="intellicar_fuel_latest" rows={previews.fuelLatest || []} />
      </div>
    </div>
  );
}

function PreviewTable({ title, rows }: { title: string; rows: any[] }) {
  const cols = useMemo(() => {
    const r0 = rows?.[0];
    if (!r0) return [];
    // Show only a compact set of columns by default (hide huge raw JSON unless expanded)
    const preferred = ["vehicleno", "deviceno", "commtime_epoch", "lat", "lng", "speed", "soc_value", "battery_voltage_value", "current_value", "fueltime_epoch", "fuellevel_pct", "updated_at", "last_seen_at"];
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
      </div>

      {rows.length === 0 ? (
        <div className="py-6 text-center text-sm text-gray-500">No rows yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b">
                {cols.map((c) => (
                  <th key={c} className="py-2 pr-4 whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 10).map((r, idx) => (
                <tr key={idx} className="border-b last:border-b-0">
                  {cols.map((c) => (
                    <td key={c} className="py-3 pr-4 text-xs text-gray-700 whitespace-nowrap">
                      {String(r?.[c] ?? "—")}
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