import React from 'react';
import { LeadCreateStep1Form } from '@/components/leads/LeadCreateStep1Form';

export default function NewLeadPage() {
    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">Create New Lead</h1>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Step 1 of 5</span>
                        <button className="w-7 h-7 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm hover:bg-blue-100 transition-colors" title="Help Information">
                            i
                        </button>
                    </div>
                </div>
                <p className="text-sm text-gray-500">Collect personal information, product details, vehicle details, and lead classification.</p>
            </div>

            <LeadCreateStep1Form />
        </div>
    );
}
