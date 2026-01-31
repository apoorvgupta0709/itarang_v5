"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, RefreshCw, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

type InventoryItem = {
  id: string;
  product_id: string;
  oem_id: string;

  oem_name: string;
  asset_category: string;
  asset_type: string;
  model_type: string;

  serial_number?: string | null;
  iot_imei_no?: string | null;

  warranty_months?: number | null;
  quantity?: number | null;

  challan_number?: string | null;
  oem_invoice_number?: string | null;

  status: string;

  uploaded_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const STATUS_OPTIONS = [
  "in_transit",
  "pdi_pending",
  "pdi_failed",
  "available",
  "reserved",
  "sold",
  "damaged",
  "returned",
] as const;

type StatusFilter = (typeof STATUS_OPTIONS)[number] | "all";

async function fetchInventory(status: StatusFilter, q: string) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (q) params.set("q", q);

  const res = await fetch(`/api/inventory?${params.toString()}`, {
    cache: "no-store",
  });

  const json = await res.json().catch(() => ({}));

  // support your successResponse shape: { success, data: { items } }
  if (!res.ok || !json?.success) {
    throw new Error(json?.error?.message || json?.error || "Failed to fetch inventory");
  }

  // ✅ Normalize id safely so row always has r.id
  const items = (json.data?.items ?? []) as any[];
  return items.map((it) => {
    const normalizedId =
      it.id ??
      it.inventory_id ??
      it.inventoryId ??
      it.inventoryID ??
      it.inventoryid ??
      it.ID;

    return {
      ...it,
      id: normalizedId ? String(normalizedId) : "",
    };
  }) as InventoryItem[];
}

export default function InventoryTable() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<StatusFilter>("all");
  const [q, setQ] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);

  const queryKey = useMemo(() => ["inventory", status, q], [status, q]);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () => fetchInventory(status, q),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (args: { id: string; status: string }) => {
      const res = await fetch(`/api/inventory/${encodeURIComponent(args.id)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: args.status }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || json?.success === false) {
        const msg =
          json?.error?.message || json?.error || json?.message || "Failed to update status";
        throw new Error(msg);
      }

      const updated = json?.data?.item;
      if (!updated?.id) {
        throw new Error("Status update failed: server did not return updated item.");
      }

      return updated as InventoryItem;
    },

    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey });

      const prev = queryClient.getQueryData<InventoryItem[]>(queryKey);

      queryClient.setQueryData<InventoryItem[]>(queryKey, (old) => {
        if (!old) return old;
        return old.map((it) => (it.id === vars.id ? { ...it, status: vars.status } : it));
      });

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
    },

    onSuccess: (updated) => {
      queryClient.setQueryData<InventoryItem[]>(queryKey, (old) => {
        if (!old) return old;

        if (status !== "all" && updated.status !== status) {
          return old.filter((it) => it.id !== updated.id);
        }

        return old.map((it) => (it.id === updated.id ? { ...it, ...updated } : it));
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      {/* TOP BAR */}
      <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        {/* LEFT: Search + Status Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by ID / OEM / Model / Serial / IMEI…"
              className="pl-9 pr-3 py-2 rounded-xl bg-gray-50 border border-gray-100 outline-none text-sm w-[320px] max-w-full"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="py-2 px-3 rounded-xl bg-gray-50 border border-gray-100 text-sm outline-none"
          >
            <option value="all">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Bulk upload button (same row, outside search input) */}
          <button
            type="button"
            onClick={() => router.push("/inventory/bulk-upload")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Upload className="w-4 h-4" />
            Bulk Upload
          </button>
        </div>

        {/* RIGHT: Refresh */}
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* BODY */}
      <div className="p-5">
        {isLoading ? (
          <div className="py-10 text-center text-sm text-gray-500">Loading inventory…</div>
        ) : error ? (
          <div className="py-10 text-center text-sm text-rose-600">
            {(error as any)?.message || "Failed to load"}
          </div>
        ) : !data?.length ? (
          <div className="py-10 text-center text-sm text-gray-500">No inventory found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-3 pr-3">ID</th>
                  <th className="py-3 pr-3">OEM</th>
                  <th className="py-3 pr-3">Category</th>
                  <th className="py-3 pr-3">Type</th>
                  <th className="py-3 pr-3">Model</th>
                  <th className="py-3 pr-3">Serial</th>
                  <th className="py-3 pr-3">IMEI</th>
                  <th className="py-3 pr-3">Warranty</th>
                  <th className="py-3 pr-3">Status</th>
                  <th className="py-3 pr-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {data.map((r) => (
                  <tr key={r.id || `${r.oem_id}-${r.product_id}-${r.serial_number ?? ""}`} className="border-b border-gray-50">
                    <td className="py-3 pr-3 font-medium text-gray-800">{r.id || "-"}</td>
                    <td className="py-3 pr-3">{r.oem_name}</td>
                    <td className="py-3 pr-3">{r.asset_category}</td>
                    <td className="py-3 pr-3">{r.asset_type}</td>
                    <td className="py-3 pr-3">{r.model_type}</td>
                    <td className="py-3 pr-3">{r.serial_number ?? "-"}</td>
                    <td className="py-3 pr-3">{r.iot_imei_no ?? "-"}</td>
                    <td className="py-3 pr-3">
                      {typeof r.warranty_months === "number" ? `${r.warranty_months}m` : "-"}
                    </td>

                    <td className="py-3 pr-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          r.status === "available"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>

                    <td className="py-3 pr-3 text-right">
                      <select
                        value={r.status}
                        onChange={(e) => {
                          // ✅ Use robust fallback id lookup
                          const rowId =
                            (r as any).id ??
                            (r as any).inventory_id ??
                            (r as any).inventoryId ??
                            (r as any).inventoryID ??
                            (r as any).inventoryid ??
                            (r as any).ID;

                          if (!rowId) {
                            setClientError(
                              "Cannot update status: this row has no id. Check /api/inventory response keys."
                            );
                            return;
                          }

                          updateStatusMutation.mutate({
                            id: String(rowId),
                            status: e.target.value,
                          });
                        }}
                        className="py-2 px-3 rounded-xl bg-gray-50 border border-gray-100 text-sm outline-none"
                        disabled={updateStatusMutation.isPending}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(clientError || updateStatusMutation.isError) && (
              <div className="mt-3 text-xs text-rose-600">
                {clientError ||
                  (updateStatusMutation.error as any)?.message ||
                  "Failed to update status"}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}