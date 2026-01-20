'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { KPICard } from '@/components/dashboard/KPICard';
import { MetricsChart } from '@/components/dashboard/MetricsChart';
import {
    FileText,
    CreditCard,
    AlertTriangle,
    CheckCircle2,
    DollarSign,
    Wallet,
    Clock,
    ArrowRight
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function FinanceControllerDashboard() {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMetrics() {
            try {
                const res = await fetch('/api/dashboard/finance_controller');
                const result = await res.json();
                if (result.success) {
                    setMetrics(result.data);
                }
            } catch (err) {
                console.error('Failed to fetch finance metrics:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchMetrics();
    }, []);

    if (loading) return <div className="p-8">Loading Financial Data...</div>;

    const kpis = [
        {
            title: 'Pending L3 Approvals',
            value: '8',
            trend: 0,
            icon: FileText,
            suffix: 'Requires Invoice Issue'
        },
        {
            title: 'Receivables Total',
            value: '₹84.2 Lakh',
            trend: -4.2,
            icon: Wallet,
            trendPositive: true,
            suffix: 'vs last month'
        },
        {
            title: 'Overdue Payments',
            value: '₹12.5 Lakh',
            trend: 8.1,
            icon: AlertTriangle,
            trendPositive: false,
            suffix: 'Critical Attention'
        },
        {
            title: 'Invoices Issued (MTD)',
            value: '42',
            icon: CheckCircle2,
            trend: 14,
            suffix: '+5 since yesterday'
        }
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Finance Controller Dashboard</h1>
                    <p className="text-slate-500">Invoice management and payment tracking</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                        <DollarSign className="w-4 h-4" />
                        Record Payment
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, i) => (
                    <KPICard key={i} {...kpi} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Aging of Receivables */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-emerald-600" />
                        Aging of Receivables (Summary)
                    </h3>
                    <div className="h-[300px]">
                        <MetricsChart
                            type="bar"
                            data={metrics?.agingData || [
                                { name: '0-30 Days', Amount: 42.5 },
                                { name: '31-60 Days', Amount: 24.2 },
                                { name: '61-90 Days', Amount: 12.8 },
                                { name: '90+ Days', Amount: 4.7 },
                            ]}
                            dataKeys={['Amount']}
                            categoryKey="name"
                            colors={['#10b981']}
                            title="Aging of Receivables (Summary)"
                        />
                    </div>
                </div>

                {/* Credit Limit Alerts */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-rose-600">
                        <AlertTriangle className="w-5 h-5" />
                        Credit Limit Warnings
                    </h3>
                    <div className="space-y-4">
                        {[
                            { name: 'Kisan EV Hub', used: 92, limit: '₹15L' },
                            { name: 'Metro E-Auto', used: 88, limit: '₹10L' },
                            { name: 'Urban Green', used: 85, limit: '₹12L' },
                        ].map((dealer) => (
                            <div key={dealer.name} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-slate-700">{dealer.name}</span>
                                    <span className="text-slate-500">{dealer.used}% of {dealer.limit}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${dealer.used > 90 ? 'bg-rose-500' : 'bg-amber-500'}`}
                                        style={{ width: `${dealer.used}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-6 py-2 text-sm text-slate-600 font-medium hover:text-emerald-600 transition-colors">
                        View All Dealer Credits →
                    </button>
                </div>
            </div>

            {/* Invoicing Queue Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-semibold">Ready for Individual Invoicing (Approved Deals)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Deal ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Customer / OEM</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Approval Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {[
                                { id: 'DEAL-2026-042', name: 'Bharat EV Corp', amount: '₹6,40,000', date: '20 Jan 2026' },
                                { id: 'DEAL-2026-045', name: 'Apex Logistics', amount: '₹12,80,000', date: '19 Jan 2026' },
                                { id: 'DEAL-2026-048', name: 'City Fleet Services', amount: '₹4,20,000', date: '19 Jan 2026' },
                            ].map((row) => (
                                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">{row.id}</td>
                                    <td className="px-6 py-4 text-slate-600">{row.name}</td>
                                    <td className="px-6 py-4 font-bold text-slate-900">{row.amount}</td>
                                    <td className="px-6 py-4 text-slate-500">{row.date}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-md text-xs font-bold hover:bg-emerald-100 transition-colors inline-flex items-center gap-1">
                                            Generate Invoice <ArrowRight className="w-3 h-3" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
