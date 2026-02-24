import React from 'react';

export default function ChangePasswordPage() {
    return (
        <div className="max-w-md mx-auto py-12 px-4">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">Change Password</h1>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <p className="text-sm text-gray-500 mb-6">Enter your current password and a new password below.</p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                        <input type="password" disabled className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 opacity-50 cursor-not-allowed" value="********" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input type="password" disabled className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 opacity-50 cursor-not-allowed" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                        <input type="password" disabled className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 opacity-50 cursor-not-allowed" />
                    </div>
                    <button disabled className="w-full bg-brand-600 text-white font-medium py-2.5 rounded-xl opacity-50 cursor-not-allowed mt-4">
                        Update Password (Coming Soon)
                    </button>
                </div>
            </div>
        </div>
    );
}
