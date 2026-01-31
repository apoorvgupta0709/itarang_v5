"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, RefreshCw } from "lucide-react";

type ProductCatalogItem = {
  id: string;
  hsn_code: string;
  asset_category: string;
  asset_type: string;
  model_type: string;
  is_serialized: boolean;
  warranty_months: number;
  status: string;
  created_at?: string;
  disabled_at?: string | null;
};

async function fetchCatalog(status: string, q: string) {
  const params = new URLSearchParams();
  params.set("status", status);
  if (q) params.set("q", q);

  const res = await fetch(`/api/product-catalog?${params.toString()}`);
  const json = await res.json();
  if (!res.ok || !json?.success) throw new Error(json?.error?.message || "Failed to fetch catalog");
  return json.data.items as ProductCatalogItem[];
}

export default function ProductCatalogTable() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"active" | "disabled" | "all">("active");
  const [q, setQ] = useState("");

  const queryKey = useMemo(() => ["product-catalog", status, q], [status, q]);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () => fetchCatalog(status, q),
  });

  const toggleMutation = useMutation({
    mutationFn: async (args: { id: string; action: "disable" | "enable" }) => {
      const res = await fetch(`/api/product-catalog/${args.id}/disable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: args.action }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error?.message || "Failed to update status");
      return json.data.item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-catalog"] });
    },
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by ID / HSN / category / type / model…"
              className="pl-9 pr-3 py-2 rounded-xl bg-gray-50 border border-gray-100 outline-none text-sm w-[320px] max-w-full"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="py-2 px-3 rounded-xl bg-gray-50 border border-gray-100 text-sm outline-none"
          >
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
            <option value="all">All</option>
          </select>
        </div>

        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="py-10 text-center text-sm text-gray-500">Loading catalog…</div>
        ) : error ? (
          <div className="py-10 text-center text-sm text-rose-600">
            {(error as any)?.message || "Failed to load"}
          </div>
        ) : !data?.length ? (
          <div className="py-10 text-center text-sm text-gray-500">No products found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-3 pr-3">ID</th>
                  <th className="py-3 pr-3">HSN</th>
                  <th className="py-3 pr-3">Category</th>
                  <th className="py-3 pr-3">Type</th>
                  <th className="py-3 pr-3">Model</th>
                  <th className="py-3 pr-3">Warranty</th>
                  <th className="py-3 pr-3">Serialized</th>
                  <th className="py-3 pr-3">Status</th>
                  <th className="py-3 pr-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50">
                    <td className="py-3 pr-3 font-medium text-gray-800">{p.id}</td>
                    <td className="py-3 pr-3">{p.hsn_code}</td>
                    <td className="py-3 pr-3">{p.asset_category}</td>
                    <td className="py-3 pr-3">{p.asset_type}</td>
                    <td className="py-3 pr-3">{p.model_type}</td>
                    <td className="py-3 pr-3">{p.warranty_months}m</td>
                    <td className="py-3 pr-3">{p.is_serialized ? "Yes" : "No"}</td>
                    <td className="py-3 pr-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          p.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-right">
                      {p.status === "active" ? (
                        <button
                          onClick={() => toggleMutation.mutate({ id: p.id, action: "disable" })}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100"
                          disabled={toggleMutation.isPending}
                        >
                          Disable
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleMutation.mutate({ id: p.id, action: "enable" })}
                          className="px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 text-xs font-bold hover:bg-brand-100"
                          disabled={toggleMutation.isPending}
                        >
                          Enable
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {toggleMutation.isError && (
              <div className="mt-3 text-xs text-rose-600">
                {(toggleMutation.error as any)?.message || "Failed to update item"}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}