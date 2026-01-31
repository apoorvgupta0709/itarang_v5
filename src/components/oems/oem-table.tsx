"use client";

import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type Oem = any;

async function fetchOems(): Promise<Oem[]> {
  const res = await fetch("/api/oems");
  const json = await res.json();
  if (!res.ok || !json?.success) {
    throw new Error(json?.error?.message || "Failed to load OEMs");
  }
  return json.data.items;
}

export function OemTable() {
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["oems"],
    queryFn: fetchOems,
  });

  const toggle = async (id: string, action: "disable" | "enable") => {
    // optimistic
    qc.setQueryData<Oem[]>(["oems"], (prev) =>
      (prev || []).map((o) =>
        o.id === id
          ? { ...o, status: action === "disable" ? "inactive" : "active" }
          : o
      )
    );

    const res = await fetch(`/api/oems/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    // always reconcile
    await qc.invalidateQueries({ queryKey: ["oems"] });

    if (!res.ok) {
      // optional: toast later
    }
  };

  if (isLoading) return <div className="p-6 text-sm text-gray-500">Loading OEMs…</div>;
  if (error) return <div className="p-6 text-sm text-rose-600">{(error as any).message}</div>;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">OEMs</h2>
        <p className="text-sm text-gray-500">Enable/Disable updates immediately.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-6 py-3">OEM</th>
              <th className="text-left px-6 py-3">GSTIN</th>
              <th className="text-left px-6 py-3">CIN</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="text-right px-6 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((o) => (
              <tr key={o.id} className="border-t border-gray-100">
                <td className="px-6 py-3">
                  <div className="font-semibold text-gray-900">{o.business_entity_name}</div>
                  <div className="text-xs text-gray-500">{o.id}</div>
                </td>
                <td className="px-6 py-3">{o.gstin}</td>
                <td className="px-6 py-3">{o.cin || "-"}</td>
                <td className="px-6 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      o.status === "active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {o.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  {o.status === "active" ? (
                    <button
                      onClick={() => toggle(o.id, "disable")}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200"
                    >
                      Disable
                    </button>
                  ) : (
                    <button
                      onClick={() => toggle(o.id, "enable")}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 text-white hover:opacity-90"
                    >
                      Enable
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(data || []).length === 0 && (
          <div className="p-6 text-sm text-gray-500">No OEMs found.</div>
        )}
      </div>
    </div>
  );
}