"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Loader2, UploadCloud, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

interface KYCStep2FormProps {
    leadId: string;
}

export function KYCStep2Form({ leadId }: KYCStep2FormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [session, setSession] = useState<any>(null);

    // Initial load
    useEffect(() => {
        const fetchAccess = async () => {
            try {
                const res = await fetch(`/api/kyc/${leadId}/access-check`);
                const data = await res.json();
                if (!res.ok || !data.success) {
                    setError(data.error || "Failed access check");
                    if (data.redirectTo) {
                        setTimeout(() => router.push(data.redirectTo), 2000);
                    }
                } else {
                    setSession(data.session);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAccess();
    }, [leadId, router]);

    // Setup Payment Method
    const [settingPayment, setSettingPayment] = useState(false);
    const handleSetPayment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const method = formData.get('payment_method') as string;
        if (!method) return;

        setSettingPayment(true);
        try {
            const res = await fetch(`/api/kyc/${leadId}/payment-method`, {
                method: 'PATCH',
                body: JSON.stringify({ payment_method: method }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) setSession(data.session);
        } catch (err) {
            console.error(err);
        } finally {
            setSettingPayment(false);
        }
    };

    // Upload Document
    const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
    const handleUpload = async (docType: string, e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        formData.append('documentType', docType);

        setUploadingDoc(docType);
        try {
            const res = await fetch(`/api/kyc/${leadId}/upload-document`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                // Refresh session to get updated documents
                const r = await fetch(`/api/kyc/${leadId}/document-status`);
                const d = await r.json();
                if (d.success) setSession({ ...session, documents: d.documents });
            } else {
                alert(data.error || 'Upload failed');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUploadingDoc(null);
        }
    };

    // Complete KYC
    const [completing, setCompleting] = useState(false);
    const handleComplete = async () => {
        setCompleting(true);
        try {
            // First, send consent just to mock the flow
            await fetch(`/api/kyc/${leadId}/send-consent`, { method: 'POST' });

            const res = await fetch(`/api/kyc/${leadId}/complete-and-next`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                alert('KYC Completed Successfully!');
                router.push(`/leads/${leadId}`);
            } else {
                alert(data.error || 'Completion failed');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setCompleting(false);
        }
    };

    if (loading) return <div className="p-8 flex items-center gap-2"><Loader2 className="animate-spin w-5 h-5" /> Checking access...</div>;

    if (error) return (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5" /> {error}
        </div>
    );

    if (!session) return <div className="p-4 bg-gray-50 rounded-lg">No active session.</div>;

    // Step 1: Payment Method
    if (!session.payment_method) {
        return (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
                <p className="text-sm text-gray-500 mb-6">This determines which documents are required.</p>
                <form onSubmit={handleSetPayment} className="space-y-4 max-w-sm">
                    <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Select name="payment_method" required>
                            <option value="">Select...</option>
                            <option value="upfront">Upfront / Cash</option>
                            <option value="finance">Finance / Loan</option>
                        </Select>
                    </div>
                    <Button type="submit" disabled={settingPayment} className="w-full bg-brand-600 hover:bg-brand-700">
                        {settingPayment ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Continue
                    </Button>
                </form>
            </div>
        );
    }

    // Step 2: Documents
    const requiredDocs = session.payment_method === 'finance' ? ['Aadhaar', 'PAN', 'Utility Bill'] : ['Aadhaar', 'PAN'];
    const docsObj = session.documents || {};
    const allVerified = requiredDocs.every(doc => {
        const key = doc.toLowerCase().replace(/\s/g, '_');
        return docsObj[key]?.status === 'verified';
    });

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                    <div>
                        <h3 className="text-lg font-semibold">Document Upload</h3>
                        <p className="text-sm text-gray-500">Method: <span className="capitalize font-medium text-gray-900">{session.payment_method}</span></p>
                    </div>
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                        {Object.values(docsObj).filter((d: any) => d.status === 'verified').length} / {requiredDocs.length} Verified
                    </span>
                </div>

                <div className="space-y-8">
                    {requiredDocs.map(docType => {
                        const key = docType.toLowerCase().replace(/\s/g, '_');
                        const docObj = docsObj[key];
                        const isVerified = docObj?.status === 'verified';

                        return (
                            <div key={docType} className="border border-gray-100 rounded-xl p-5 bg-gray-50/30">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-brand-500" /> {docType}
                                    </h4>
                                    {isVerified ? (
                                        <span className="flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-md">
                                            <CheckCircle2 className="w-4 h-4" /> Verified
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-sm font-medium text-orange-700 bg-orange-50 px-2.5 py-1 rounded-md">
                                            <AlertCircle className="w-4 h-4" /> Pending
                                        </span>
                                    )}
                                </div>

                                {!isVerified && (
                                    <form onSubmit={(e) => handleUpload(docType, e)} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                        <div className="md:col-span-4 space-y-2">
                                            <Label>Document Number</Label>
                                            <input name="documentNumber" required className="w-full px-3 py-2 border rounded-md text-sm" placeholder={`Enter ${docType} number`} />
                                        </div>
                                        <div className="md:col-span-3 space-y-2">
                                            <Label>Front Scan</Label>
                                            <input type="file" name="frontScan" required accept="image/*,.pdf" className="w-full text-sm" />
                                        </div>
                                        <div className="md:col-span-3 space-y-2">
                                            <Label>Back Scan (opt)</Label>
                                            <input type="file" name="backScan" accept="image/*,.pdf" className="w-full text-sm" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Button type="submit" disabled={uploadingDoc === docType} className="w-full" variant="outline">
                                                {uploadingDoc === docType ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload'}
                                            </Button>
                                        </div>
                                    </form>
                                )}
                                {isVerified && (
                                    <div className="text-sm text-gray-500">
                                        Number: <span className="font-medium text-gray-900">{docObj.number}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {allVerified && session.kyc_status !== 'completed' && (
                <div className="bg-green-50 p-6 rounded-2xl border border-green-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h4 className="text-lg font-bold text-green-900 mb-1">All Documents Verified!</h4>
                        <p className="text-sm text-green-700">You can now proceed to finalize the KYC and move to the next step.</p>
                    </div>
                    <Button
                        onClick={handleComplete}
                        disabled={completing}
                        className="bg-green-600 hover:bg-green-700 text-white min-w-[200px]"
                    >
                        {completing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Completing...</> : 'Complete KYC & Next'}
                    </Button>
                </div>
            )}

            {session.kyc_status === 'completed' && (
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
                    <h4 className="font-bold text-blue-900 flex items-center gap-2"><CheckCircle2 /> KYC Completed</h4>
                    <Button onClick={() => router.push(`/leads/${leadId}`)} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                        Return to Lead
                    </Button>
                </div>
            )}
        </div>
    );
}
