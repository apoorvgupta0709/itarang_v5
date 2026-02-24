"use client";

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { LeadCreateStep1Form } from '@/components/leads/LeadCreateStep1Form';

export function NewLeadModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Create New Lead</h2>
                        <p className="text-sm text-gray-500 mt-1">Step 1 of 5: Customer Information</p>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 flex-1 bg-gray-50/50 isolate relative">
                    {/* The LeadCreateStep1Form uses position sticky for its footer, which works well in a long scrolling container */}
                    <LeadCreateStep1Form />
                </div>
            </div>
        </div>
    );
}
