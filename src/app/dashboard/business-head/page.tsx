'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { KPICard } from '@/components/dashboard/KPICard';
import { MetricsChart } from '@/components/dashboard/MetricsChart';
import {
    Users,
    TrendingUp,
    Clock,
    CheckCircle,
    UserCheck,
    AlertCircle,
    Battery,
    Briefcase
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function BusinessHeadDashboard() {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMetrics() {
            try {
                const res = await fetch('/api/dashboard/business_head');
                const result = await res.json();
                if (result.success) {
                    setMetrics(result.data);
                }
            } catch (err) {
                console.error('Failed to fetch business head metrics:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchMetrics();
    }, []);

    if (loading) return <div className="p-8">Loading Dashboard...</div>;

    const kpis = [
        {
            title: 'Lead Conversion (MTD)',
            value: metrics?.conversionRate ? `${metrics.conversionRate}%` : '18.5%',
            trend: 2.1,
            icon: TrendingUp,
            suffix: 'vs last month'
        },
        {
            title: 'Active Leads',
            value: metrics?.activeLeads || '412',
            trend: 5.4,
            icon: Users,
            suffix: 'new this week'
        },
        {
            title: 'Avg. Qualification Time',
            value: metrics?.avgQualificationTime || '1.8 Days',
            trend: -12,
            icon: Clock,
            trendPositive: true,
            suffix: 'faster than avg'
        },
        {
            title: 'Level 2 Approvals Pending',
            value: metrics?.pendingApprovals || '14',
            icon: UserCheck,
            trend: 0,
            suffix: 'Requires Action'
        }
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
            <header>
                <h1 className="text-2xl font-bold text-slate-900">Business Head Dashboard</h1>
                <p className="text-slate-500">Sales performance and operational oversight</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, i) => (
                    <KPICard key={i} {...kpi} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lead Performance Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        Lead Progress (Weekly)
                    </h3>
                    <div className="h-[300px]">
                        <MetricsChart
                            type="area"
                            data={metrics?.leadTrend || [
                                { name: 'Week 1', total: 45, qualified: 28 },
                                { name: 'Week 2', total: 52, qualified: 32 },
                                { name: 'Week 3', total: 48, qualified: 30 },
                                { name: 'Week 4', total: 61, qualified: 42 },
                            ]}
                            dataKeys={['total', 'qualified']}
                            categoryKey="name"
                            colors={['#10b981', '#3b82f6']}
                            title="Lead Progress (Weekly)"
                        />
                    </div>
                </div>

                {/* Battery Category Performance */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Battery className="w-5 h-5 text-emerald-600" />
                        Category Distribution
                    </h3>
                    <div className="h-[300px]">
                        <MetricsChart
                            type="bar"
                            data={metrics?.categoryStats || [
                                { name: '3W Li-ion', count: 145 },
                                { name: '2W Li-ion', count: 88 },
                                { name: 'L5 High Speed', count: 56 },
                                { name: 'E-Rickshaw Standard', count: 123 },
                            ]}
                            dataKeys={['count']}
                            categoryKey="name"
                            colors={['#10b981']}
                            title="Category Distribution"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Approval Queue */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-emerald-600" />
                            Level 2 Approval Queue
                        </h3>
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            Action Required
                        </span>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {[
                            { id: 'DEAL-001', oem: 'Shakti Motors', value: '₹12,45,000', item: 'Battery 51.2V 100Ah', status: 'Pending BH' },
                            { id: 'DEAL-002', oem: 'GreenFleet EV', value: '₹8,20,000', item: 'Battery 48V 80Ah', status: 'Pending BH' },
                            { id: 'DEAL-003', oem: 'Vayu Dynamics', value: '₹15,00,000', item: 'Battery 60V 120Ah', status: 'Pending BH' },
                        ].map((item) => (
                            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="space-y-1">
                                    <div className="font-medium text-slate-900">{item.oem}</div>
                                    <div className="text-sm text-slate-500">{item.id} • {item.item}</div>
                                </div>
                                <div className="text-right space-y-1">
                                    <div className="font-bold text-emerald-600">{item.value}</div>
                                    <button className="text-xs text-blue-600 hover:underline font-medium">Review Deal →</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Team Performance */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Top Lead Actors</h3>
                    <div className="space-y-4">
                        {[
                            { name: 'Rahul Sharma', conversions: 42, score: 94 },
                            { name: 'Priya Verma', conversions: 38, score: 88 },
                            { name: 'Amit Singh', conversions: 35, score: 85 },
                            { name: 'Neha Gupta', conversions: 31, score: 82 },
                        ].map((actor) => (
                            <div key={actor.name} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-slate-700">{actor.name}</span>
                                    <span className="text-slate-500">{actor.conversions} leads</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5">
                                    <div
                                        className="bg-emerald-500 h-1.5 rounded-full"
                                        style={{ width: `${actor.score}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
