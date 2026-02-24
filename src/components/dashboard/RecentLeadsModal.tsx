"use client";

import React, { useEffect } from 'react';
import { X, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function RecentLeadsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Mock data
    const leads = [
        { id: '1', name: 'Raj Kumar', status: 'Hot', lastContactDate: new Date(Date.now() - 2 * 86400000).toISOString() }, // 2 days ago
        { id: '2', name: 'Sanjay Singh', status: 'Warm', lastContactDate: new Date(Date.now() - 8 * 86400000).toISOString() }, // 8 days ago
        { id: '3', name: 'Amit Patel', status: 'Cold', lastContactDate: new Date(Date.now() - 1 * 86400000).toISOString() } // 1 day ago
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Recent Leads</h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 flex-1 bg-gray-50/50">
                    <div className="space-y-4">
                        {leads.map(lead => {
                            const daysSinceContact = Math.floor((Date.now() - new Date(lead.lastContactDate).getTime()) / (1000 * 3600 * 24));
                            const needsAttention = daysSinceContact > 7;

                            return (
                                <div key={lead.id} className="bg-white border text-left border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand-300 transition-colors shadow-sm">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-gray-900">{lead.name}</h3>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${lead.status === 'Hot' ? 'bg-red-50 text-red-700' :
                                                    lead.status === 'Warm' ? 'bg-yellow-50 text-yellow-700' :
                                                        'bg-blue-50 text-blue-700'
                                                }`}>
                                                {lead.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <Clock className="w-3.5 h-3.5" />
                                            Last contact {daysSinceContact} days ago
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {needsAttention && (
                                            <div className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg">
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                Follow up required
                                            </div>
                                        )}
                                        <Link
                                            href={`/leads/${lead.id}`}
                                            className="p-2 bg-gray-50 hover:bg-brand-50 text-gray-500 hover:text-brand-600 rounded-lg transition-colors"
                                        >
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-4 bg-white border-t border-gray-100 text-center">
                    <Link href="/leads" onClick={onClose} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                        View all leads
                    </Link>
                </div>
            </div>
        </div>
    );
}
