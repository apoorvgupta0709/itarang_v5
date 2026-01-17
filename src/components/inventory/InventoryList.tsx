
'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

type InventoryItem = {
    id: string;
    serial_number: string | null;
    status: string;
    inventory_amount: number;
    gst_amount: number;
    final_amount: number;
    uploaded_at: string;
    product: {
        hsn_code: string;
        asset_category: string;
        asset_type: string;
        model_type: string;
    };
};

export default function InventoryList() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        asset_category: '',
        status: ''
    });

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.asset_category) params.append('asset_category', filters.asset_category);
            if (filters.status) params.append('status', filters.status);

            const res = await fetch(`/api/inventory?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                setItems(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, [filters]);

    const handleExport = () => {
        const exportData = items.map(item => ({
            'Serial Number': item.serial_number || 'N/A',
            'Category': item.product.asset_category,
            'Type': item.product.asset_type,
            'Model': item.product.model_type,
            'Status': item.status,
            'Amount': item.inventory_amount,
            'GST': item.gst_amount,
            'Total': item.final_amount,
            'Date': new Date(item.uploaded_at).toLocaleDateString()
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Inventory");
        XLSX.writeFile(wb, "Inventory_Report.xlsx");
    };

    return (
        <div className="card-parcel">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex gap-4">
                    <select
                        className="input-parcel w-auto min-w-[160px]"
                        value={filters.asset_category}
                        onChange={(e) => setFilters(prev => ({ ...prev, asset_category: e.target.value }))}
                    >
                        <option value="">All Categories</option>
                        <option value="3W">3W</option>
                        <option value="2W">2W</option>
                        <option value="Inverter">Inverter</option>
                    </select>

                    <select
                        className="input-parcel w-auto min-w-[160px]"
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                        <option value="">All Statuses</option>
                        <option value="available">Available</option>
                        <option value="sold">Sold</option>
                        <option value="defective">Defective</option>
                    </select>
                </div>

                <button
                    onClick={handleExport}
                    className="btn-primary"
                >
                    Processing... Export to Excel
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 font-medium tracking-wider">Serial No</th>
                            <th className="px-6 py-4 font-medium tracking-wider">Model</th>
                            <th className="px-6 py-4 font-medium tracking-wider">Type</th>
                            <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                            <th className="px-6 py-4 font-medium tracking-wider">Amount</th>
                            <th className="px-6 py-4 font-medium tracking-wider">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-400">No records found</td></tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.id} className="table-row-parcel group">
                                    <td className="px-6 py-4 font-medium text-gray-900">{item.serial_number || '-'}</td>
                                    <td className="px-6 py-4 text-gray-600">{item.product.model_type}</td>
                                    <td className="px-6 py-4 text-gray-500">{item.product.asset_category} - {item.product.asset_type}</td>
                                    <td className="px-6 py-4">
                                        <span className={`status-pill ${item.status === 'available' ? 'bg-surface-teal text-brand-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700 font-medium">₹{item.final_amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-gray-400">{new Date(item.uploaded_at).toLocaleDateString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
