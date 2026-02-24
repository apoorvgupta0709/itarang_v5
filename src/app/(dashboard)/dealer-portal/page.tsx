import React from 'react';
import { QuickActions } from '@/components/dashboard/QuickActions';

export default function DealerPortalPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Dealer Dashboard</h1>
                <p className="text-gray-500 mt-1">Manage your leads, loans, assets, and campaigns.</p>
            </div>

            <QuickActions />

            {/* We could add summary cards or recent activity here if needed, but the spec mainly asks for Action Buttons */}
        </div>
    );
}
