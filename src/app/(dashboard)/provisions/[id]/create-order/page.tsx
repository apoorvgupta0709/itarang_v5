import Link from 'next/link';
import { eq } from 'drizzle-orm';

import { Button } from '@/components/ui/button';
import { requireAuth } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { oems, provisions } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
    pending: 'Pending',
    req_sent: 'Procurement request sent to OEM',
    acknowledged: 'Acknowledged by OEM',
    in_production: 'In production',
    ready_for_pdi: 'Ready for PDI',
    pdi_req_sent: 'PDI request sent',
    completed: 'Completed',
    not_available: 'Products not available',
    cancelled: 'Cancelled',
};

function formatDateTime(d: Date | string) {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default async function ProvisionDetailsPage({ params }: { params: { id: string } }) {
    await requireAuth();

    const provisionId = params.id;

    const [prov] = await db
        .select()
        .from(provisions)
        .where(eq(provisions.id, provisionId))
        .limit(1);

    if (!prov) {
        return (
            <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <h1 className="text-xl font-bold text-gray-900">Provision not found</h1>
                <p className="text-sm text-gray-500 mt-2">ID: {provisionId}</p>
                <div className="mt-6">
                    <Link href="/provisions">
                        <Button variant="outline">Back to Procurement Orders</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const [oem] = await db
        .select()
        .from(oems)
        .where(eq(oems.id, prov.oem_id))
        .limit(1);

    const products: Array<{ product_id: string; model_type?: string; quantity: number }> =
        (prov.products as any) || [];

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Procurement Order</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        <span className="font-mono">{prov.id}</span> • Created {formatDateTime(prov.created_at)}
                    </p>
                </div>
                <Link href="/provisions">
                    <Button variant="outline">Back</Button>
                </Link>
            </div>

            <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-xs text-gray-500">OEM</p>
                        <p className="text-sm font-semibold text-gray-900">{oem?.business_entity_name || prov.oem_name}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <p className="text-sm font-semibold text-gray-900">{STATUS_LABEL[prov.status] || prov.status}</p>
                    </div>
                    <div className="md:col-span-2">
                        <p className="text-xs text-gray-500">Description</p>
                        <p className="text-sm text-gray-900">{prov.remarks || '—'}</p>
                    </div>
                </div>
            </div>

            <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-base font-bold text-gray-900">Line items</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left font-semibold text-gray-700 px-6 py-3">Product</th>
                                <th className="text-left font-semibold text-gray-700 px-6 py-3">Product ID</th>
                                <th className="text-right font-semibold text-gray-700 px-6 py-3">Qty</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {products.map((p, idx) => (
                                <tr key={`${p.product_id}-${idx}`} className="hover:bg-gray-50/60">
                                    <td className="px-6 py-4 text-gray-900 font-semibold">{p.model_type || p.product_id}</td>
                                    <td className="px-6 py-4 text-gray-700 font-mono">{p.product_id}</td>
                                    <td className="px-6 py-4 text-right text-gray-900 font-bold">{p.quantity}</td>
                                </tr>
                            ))}
                            {products.length === 0 && (
                                <tr>
                                    <td className="px-6 py-10 text-center text-gray-500" colSpan={3}>
                                        No line items found.
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