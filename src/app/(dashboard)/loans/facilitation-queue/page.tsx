'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search, CheckCircle2, AlertCircle, IndianRupee } from 'lucide-react';

interface QueueItem {
    id: string;
    documents_uploaded: boolean;
    company_validation_status: string;
    facilitation_fee_status: string;
    fee_amount: number;
    created_at: string;
    lead: {
        id: string;
        reference_id: string;
        owner_name: string;
        owner_contact: string;
    };
}

export default function FacilitationQueuePage() {
    const [items, setItems] = useState<QueueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchQueue = async () => {
            try {
                const res = await fetch('/api/loans/facilitation-queue');
                const data = await res.json();
                if (data.success) {
                    setItems(data.files || []);
                }
            } catch (error) {
                console.error('Failed to fetch queue', error);
            } finally {
                setLoading(false);
            }
        };
        fetchQueue();
    }, []);

    const filteredItems = items.filter(item =>
        item.lead?.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.lead?.reference_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Loan Facilitation Queue</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage loan processing and facilitation fees</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by Name or Ref ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-medium">Customer Details</th>
                                <th className="px-6 py-4 font-medium">Validation Status</th>
                                <th className="px-6 py-4 font-medium">Fee Status</th>
                                <th className="px-6 py-4 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading queue...</td></tr>
                            ) : filteredItems.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-400">No loan files found in queue.</td></tr>
                            ) : (
                                filteredItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">{item.lead?.owner_name || 'N/A'}</span>
                                                <span className="text-xs text-gray-500">{item.lead?.reference_id || item.lead?.id} • {item.lead?.owner_contact}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border
                                                ${item.company_validation_status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    item.company_validation_status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                                {item.company_validation_status === 'approved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                                {item.company_validation_status.charAt(0).toUpperCase() + item.company_validation_status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border
                                                ${item.facilitation_fee_status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                                {item.facilitation_fee_status === 'paid' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <IndianRupee className="w-3.5 h-3.5" />}
                                                {item.facilitation_fee_status === 'paid' ? 'Paid' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/loans/facilitation-queue/${item.id}`}>
                                                <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Process
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
