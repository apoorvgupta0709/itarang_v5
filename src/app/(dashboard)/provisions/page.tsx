import Link from 'next/link';
import { desc } from 'drizzle-orm';

import { Button } from '@/components/ui/button';
import { requireAuth } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { provisions } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    req_sent: { label: 'Request Sent', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    acknowledged: { label: 'Acknowledged', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    in_production: { label: 'In Production', className: 'bg-purple-50 text-purple-700 border-purple-200' },
    ready_for_pdi: { label: 'Ready for PDI', className: 'bg-green-50 text-green-700 border-green-200' },
    pdi_req_sent: { label: 'PDI Requested', className: 'bg-teal-50 text-teal-700 border-teal-200' },
    completed: { label: 'Completed', className: 'bg-gray-50 text-gray-700 border-gray-200' },
    not_available: { label: 'Products Not Available', className: 'bg-red-50 text-red-700 border-red-200' },
    cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700 border-red-200' },
};

function formatDate(d: Date | string) {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export default async function ProcurementOrdersPage() {
    await requireAuth();

    const rows = await db
        .select()
        .from(provisions)
        .orderBy(desc(provisions.created_at));

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Procurement Orders</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Create provisions, send procurement requests to OEMs, and track replies + PDI status.
                    </p>
                </div>
                <Link href="/provisions/new">
                    <Button variant="primary">Create Provision</Button>
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left font-semibold text-gray-700 px-6 py-3">Order ID</th>
                                <th className="text-left font-semibold text-gray-700 px-6 py-3">Date</th>
                                <th className="text-left font-semibold text-gray-700 px-6 py-3">Description</th>
                                <th className="text-left font-semibold text-gray-700 px-6 py-3">Status</th>
                                <th className="text-right font-semibold text-gray-700 px-6 py-3">View Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {rows.map((r) => {
                                const statusCfg = STATUS_CONFIG[r.status] || {
                                    label: r.status || 'Unknown',
                                    className: 'bg-gray-50 text-gray-700 border-gray-200',
                                };

                                return (
                                    <tr key={r.id} className="hover:bg-gray-50/60">
                                        <td className="px-6 py-4 font-mono text-gray-900">{r.id}</td>
                                        <td className="px-6 py-4 text-gray-700">{formatDate(r.created_at)}</td>
                                        <td className="px-6 py-4 text-gray-700">{r.remarks || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${statusCfg.className}`}>
                                                {statusCfg.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/provisions/${r.id}`}
                                                className="text-brand-700 hover:text-brand-800 font-semibold"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}

                            {rows.length === 0 && (
                                <tr>
                                    <td className="px-6 py-10 text-center text-gray-500" colSpan={5}>
                                        No procurement orders yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}