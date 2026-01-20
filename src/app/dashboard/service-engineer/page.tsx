'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { KPICard } from '@/components/dashboard/KPICard';
import { MetricsChart } from '@/components/dashboard/MetricsChart';
import {
    ClipboardCheck,
    AlertCircle,
    CheckCircle2,
    Zap,
    Battery,
    MapPin,
    History,
    FileSearch,
    Plus,
    Search
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ServiceEngineerDashboard() {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMetrics() {
            try {
                const res = await fetch('/api/dashboard/service_engineer');
                const result = await res.json();
                if (result.success) {
                    setMetrics(result.data);
                }
            } catch (err) {
                console.error('Failed to fetch service engineer metrics:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchMetrics();
    }, []);

    if (loading) return <div className="p-8">Loading PDI Tasks...</div>;

    const kpis = [
        {
            title: 'PDI Pending (My Assigned)',
            value: '6',
            icon: ClipboardCheck,
            trend: 0,
            suffix: 'Immediate Tasks'
        },
        {
            title: 'Inspections Today',
            value: '4/8',
            trend: 50,
            icon: CheckCircle2,
            suffix: '50% of Day Target'
        },
        {
            title: 'Failure Rate (MTD)',
            value: '5.2%',
            trend: -1.8,
            icon: AlertCircle,
            trendPositive: true,
            suffix: 'lower than average'
        },
        {
            title: 'Avg. PDI Time',
            value: '18 min',
            icon: Zap,
            trend: -2,
            trendPositive: true,
            suffix: 'per battery'
        }
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex justify-between items-center bg-emerald-900 -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8 p-6 mb-8 lg:rounded-b-3xl text-white shadow-lg">
                <div>
                    <h1 className="text-2xl font-bold">Service Engineer Dashboard</h1>
                    <p className="text-emerald-200">Field Inspections (PDI) Management</p>
                </div>
                <button className="bg-white text-emerald-900 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-50 transition-colors">
                    <Plus className="w-5 h-5" />
                    New Inspection
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, i) => (
                    <KPICard key={i} {...kpi} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* PDI Progress Queue */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900">
                            <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                            Active PDI Queue (Priority)
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {[
                            { id: 'PDI-QUE-102', serial: 'BAT-2024-X91', type: 'Li-ion 51.2V', location: 'Warehouse A-4', status: 'Priority' },
                            { id: 'PDI-QUE-105', serial: 'BAT-2024-X94', type: 'Li-ion 48.0V', location: 'Warehouse B-1', status: 'Scheduled' },
                            { id: 'PDI-QUE-108', serial: 'BAT-2024-X99', type: 'Li-ion 51.2V', location: 'Warehouse A-2', status: 'Scheduled' },
                        ].map((item) => (
                            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-10 rounded-full ${item.status === 'Priority' ? 'bg-rose-500' : 'bg-slate-300'}`}></div>
                                    <div className="space-y-1">
                                        <div className="font-medium text-slate-900">{item.serial}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-2">
                                            <Battery className="w-3 h-3" /> {item.type} •
                                            <MapPin className="w-3 h-3" /> {item.location}
                                        </div>
                                    </div>
                                </div>
                                <button className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800">
                                    Start PDI
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Daily Pass/Fail Trend */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <History className="w-5 h-5 text-emerald-600" />
                        PDI Outcomes (7 Days)
                    </h3>
                    <div className="h-[300px]">
                        <MetricsChart
                            type="area"
                            data={metrics?.pdiTrend || [
                                { name: 'Mon', Pass: 12, Fail: 1 },
                                { name: 'Tue', Pass: 15, Fail: 2 },
                                { name: 'Wed', Pass: 10, Fail: 0 },
                                { name: 'Thu', Pass: 18, Fail: 3 },
                                { name: 'Fri', Pass: 14, Fail: 1 },
                            ]}
                            dataKeys={['Pass', 'Fail']}
                            categoryKey="name"
                            colors={['#10b981', '#ef4444']}
                            title="PDI Outcomes (7 Days)"
                        />
                    </div>
                </div>
            </div>

            {/* Serial Search Utility */}
            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="p-3 bg-white rounded-xl">
                        <FileSearch className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h4 className="font-bold text-emerald-900">Serial Search & Verification</h4>
                        <p className="text-emerald-700 text-sm">Quickly search for any battery serial number to check its PDI and Warranty status.</p>
                    </div>
                    <div className="w-full md:w-auto relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Scan or type serial..."
                            className="w-full md:w-72 pl-10 pr-4 py-2 rounded-xl bg-white border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
