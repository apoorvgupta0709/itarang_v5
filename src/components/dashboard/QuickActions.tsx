"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserPlus, CircleDollarSign, PlusCircle, Users, Megaphone } from 'lucide-react';
import { RecentLeadsModal } from './RecentLeadsModal';
import { NewLeadModal } from './NewLeadModal';

export function QuickActions({ paymentMet }: { paymentMet?: boolean }) {
    const [isRecentLeadsOpen, setIsRecentLeadsOpen] = useState(false);
    const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
    const [canProcessLoan, setCanProcessLoan] = useState(false);

    useEffect(() => {
        const checkQueue = async () => {
            try {
                const res = await fetch('/api/loans/facilitation-queue');
                const data = await res.json();
                if (data.success && data.files && data.files.length > 0) {
                    setCanProcessLoan(true);
                }
            } catch (err) {
                console.error(err);
            }
        };
        checkQueue();
    }, []);

    return (
        <div className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">

                {/* 1. New Lead */}
                <button
                    onClick={() => setIsNewLeadOpen(true)}
                    className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-200 transition-all text-center group focus:outline-none"
                >
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <UserPlus className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">New Lead</span>
                </button>

                {/* 2. Process Loan */}
                <Link
                    href={canProcessLoan ? "/loans/facilitation-queue" : "#"}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border shadow-sm transition-all text-center group ${canProcessLoan
                        ? "bg-white border-gray-100 hover:shadow-md hover:border-green-200"
                        : "bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed"
                        }`}
                >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${canProcessLoan
                        ? "bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white"
                        : "bg-gray-200 text-gray-400"
                        }`}>
                        <CircleDollarSign className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">Process Loan</span>
                </Link>

                {/* 3. Add Assets */}
                <Link
                    href="/assets/add"
                    className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all text-center group"
                >
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <PlusCircle className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">Add Assets</span>
                </Link>

                {/* 4. View Recent Leads */}
                <button
                    onClick={() => setIsRecentLeadsOpen(true)}
                    className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all text-center group focus:outline-none"
                >
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                        <Users className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">Recent Leads</span>
                </button>

                {/* 5. Start Campaign */}
                <Link
                    href="/campaigns/new"
                    className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-rose-200 transition-all text-center group"
                >
                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                        <Megaphone className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">Start Campaign</span>
                </Link>

            </div>

            <RecentLeadsModal
                isOpen={isRecentLeadsOpen}
                onClose={() => setIsRecentLeadsOpen(false)}
            />

            <NewLeadModal
                isOpen={isNewLeadOpen}
                onClose={() => setIsNewLeadOpen(false)}
            />
        </div>
    );
}
