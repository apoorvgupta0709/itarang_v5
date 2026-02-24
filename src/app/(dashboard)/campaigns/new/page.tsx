"use client";

import React, { useState } from 'react';
import { LayoutWrapper } from '@/components/layout/LayoutWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export default function NewCampaignPage() {
    const [step, setStep] = useState(1);

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6 bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[70vh]">
            <div className="mb-8 border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-900">Start Campaign</h1>
                <p className="text-sm text-gray-500 mt-1">Create a new marketing or outreach campaign</p>

                {/* Simple Wizard Steps */}
                <div className="flex gap-4 mt-6">
                    {['Audience Selection', 'Message Composition', 'Channel Selection', 'Confirmation'].map((s, i) => (
                        <div key={i} className={`flex-1 pb-2 border-b-2 font-medium text-sm ${step === i + 1 ? 'border-brand-600 text-brand-600' : 'border-gray-200 text-gray-400'}`}>
                            {i + 1}. {s}
                        </div>
                    ))}
                </div>
            </div>

            {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                    <h2 className="text-xl font-semibold">1. Select Audience</h2>

                    <div className="space-y-4">
                        <h3 className="font-medium text-gray-700">Pre-built Segments</h3>
                        <div className="flex flex-wrap gap-3">
                            {['All Customers', 'Hot Leads', 'Pending Loans', 'Overdue Payments', 'Inactive Customers'].map(seg => (
                                <button key={seg} className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:border-brand-300 hover:bg-brand-50 transition-colors text-sm">
                                    {seg}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6 border-t space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-medium text-gray-700">Custom Segment Builder</h3>
                            <Button variant="outline" size="sm">Save Segment</Button>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
                            <div className="flex gap-3 items-center">
                                <Select defaultValue="AND" className="w-24 border-gray-300">
                                    <option value="AND">AND</option>
                                    <option value="OR">OR</option>
                                </Select>
                                <span className="text-sm text-gray-500">Match rules</span>
                            </div>

                            <div className="flex gap-3">
                                <Select defaultValue="lead_status">
                                    <option value="lead_status">Lead Status</option>
                                    <option value="loan_status">Loan Status</option>
                                    <option value="purchase_history">Purchase History</option>
                                    <option value="last_contact">Last Contact Date</option>
                                    <option value="location">Location</option>
                                    <option value="product_interest">Product Interest</option>
                                </Select>
                                <Select defaultValue="equals">
                                    <option value="equals">Equals</option>
                                    <option value="contains">Contains</option>
                                    <option value="greater">Greater Than</option>
                                </Select>
                                <Input placeholder="Value..." className="flex-1" />
                                <Button variant="outline">Add Rule</Button>
                            </div>
                        </div>

                        <div className="flex gap-2 items-center bg-blue-50 text-blue-800 p-4 rounded-xl">
                            <span className="font-semibold text-xl">1,245</span>
                            <span className="text-sm">Estimated Audience Size</span>
                        </div>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                    <h2 className="text-xl font-semibold">2. Message Composition</h2>
                    <div className="p-12 text-center text-gray-500 border-2 border-dashed rounded-xl">
                        Message Builder Placeholder
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                    <h2 className="text-xl font-semibold">3. Channel Selection</h2>
                    <div className="p-12 text-center text-gray-500 border-2 border-dashed rounded-xl">
                        Channel Selection Placeholder (SMS, WhatsApp, Email)
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                    <h2 className="text-xl font-semibold">4. Confirmation</h2>
                    <div className="p-12 text-center text-gray-500 border-2 border-dashed rounded-xl">
                        Campaign Summary & Launch Placeholder
                    </div>
                </div>
            )}

            <div className="flex justify-between pt-8 border-t mt-auto">
                <Button variant="outline" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}>
                    Back
                </Button>
                <Button onClick={() => setStep(s => Math.min(4, s + 1))} className="bg-brand-600 hover:bg-brand-700 text-white">
                    {step === 4 ? 'Launch Campaign' : 'Next Step'}
                </Button>
            </div>
        </div>
    );
}
