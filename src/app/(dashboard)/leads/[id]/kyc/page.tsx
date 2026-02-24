import React from 'react';
import { KYCStep2Form } from '@/components/leads/KYCStep2Form';

export default function KYCPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">KYC Verification</h1>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Step 2 of 5</span>
                    </div>
                </div>
                <p className="text-sm text-gray-500">Upload documents and verify identity for Lead {id}.</p>
            </div>

            <KYCStep2Form leadId={id} />
        </div>
    );
}
