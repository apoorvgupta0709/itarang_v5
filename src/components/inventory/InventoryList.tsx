"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

type InventoryRow = any;

async function fetchInventory(filters: Record<string, string>) {
    const qs = new URLSearchParams(filters);
    const res = await fetch(`/api/inventory?${qs.toString()}`);
    const json = await res.json();
    if (!res.ok || !json?.success) throw new Error(json?.error?.message || "Failed to load inventory");
    return json.data as InventoryRow[];
}

export default function InventoryList() {
    const [q, setQ] = useState("");
    const [status, setStatus] = useState("");
    const [assetCategory, setAssetCategory] = useState("");

    const filters = useMemo(() => {
        return {
            q: q.trim(),
            status,
            asset_category: assetCategory,
            limit: "50",
            offset: "0",
        };
    }, [q, status, assetCategory]);

    const { data, isLoading, error } = useQuery({
        queryKey: ["inventory", filters],
        queryFn: () => fetchInventory(filters),
    });

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                <div className="flex flex-col md:flex-row gap-3 md:items-center w-full">
                    <input
                        className="input-parcel md:w-80"
                        placeholder="Search serial / batch / OEM / model…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />

                    <select className="input-parcel md:w-56" value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="">All Status</option>
                        <option value="in_transit">In Transit</option>
                        <option value="pdi_pending">PDI Pending</option>
                        <option value="pdi_failed">PDI Failed</option>
                        <option value="available">Available</option>
                        <option value="reserved">Reserved</option>
                        <option value="sold">Sold</option>
                        <option value="damaged">Damaged</option>
                        <option value="returned">Returned</option>
                    </select>

                    <select
                        className="input-parcel md:w-40"
                        value={assetCategory}
                        onChange={(e) => setAssetCategory(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        <option value="2W">2W</option>
                        <option value="3W">3W</option>
                        <option value="Inverter">Inverter</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Inventory Report</h2>
                    <p className="text-sm text-gray-500">Includes challan, upload and IMEI fields (Phase-A).</p>
                </div>

                {isLoading ? (
                    <div className="p-6 text-sm text-gray-500">Loading…</div>
                ) : error ? (
                    <div className="p-6 text-sm text-rose-600">{(error as any).message}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="text-left px-6 py-3">OEM</th>
                                    <th className="text-left px-6 py-3">Model</th>
                                    <th className="text-left px-6 py-3">Serial / Batch</th>
                                    <th className="text-left px-6 py-3">IMEI</th>
                                    <th className="text-left px-6 py-3">Challan</th>
                                    <th className="text-left px-6 py-3">Uploaded</th>
                                    <th className="text-left px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data || []).map((row) => (
                                    <tr key={row.id} className="border-t border-gray-100">
                                        <td className="px-6 py-3">
                                            <div className="font-semibold text-gray-900">{row.oem_name}</div>
                                            <div className="text-xs text-gray-500">{row.oem_id}</div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="font-semibold text-gray-900">{row.model_type}</div>
                                            <div className="text-xs text-gray-500">{row.asset_category} • {row.asset_type}</div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="font-mono text-xs text-gray-800">{row.serial_number || "-"}</div>
                                            <div className="font-mono text-xs text-gray-500">{row.batch_number || (row.quantity ? `QTY: ${row.quantity}` : "")}</div>
                                        </td>
                                        <td className="px-6 py-3 font-mono text-xs">{row.iot_imei_no || "-"}</td>
                                        <td className="px-6 py-3">
                                            <div className="text-xs">{row.challan_number || "-"}</div>
                                            <div className="text-[11px] text-gray-500">
                                                {row.challan_date ? new Date(row.challan_date).toLocaleDateString() : ""}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-xs text-gray-600">
                                            {row.uploaded_at ? new Date(row.uploaded_at).toLocaleString() : "-"}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {(data || []).length === 0 && (
                            <div className="p-6 text-sm text-gray-500">No rows found.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}