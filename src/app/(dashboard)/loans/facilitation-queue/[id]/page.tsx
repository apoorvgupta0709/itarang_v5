'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, IndianRupee, FileText, Loader2 } from 'lucide-react';

export default function FacilitationQueueDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const [file, setFile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await fetch(`/api/loans/facilitation-queue/${id}`);
                const data = await res.json();
                if (data.success) {
                    setFile(data.file);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchDetail();
    }, [id]);

    const handlePayFee = async () => {
        setPaying(true);
        try {
            const res = await fetch(`/api/loans/facilitation-queue/${id}/pay-fee`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                alert('Fee Paid Successfully');
                // Optimistic update
                setFile({ ...file, facilitation_fee_status: 'paid' });
            } else {
                alert('Failed to pay fee');
            }
        } catch (e) {
            console.error(e);
            alert('Error paying fee');
        } finally {
            setPaying(false);
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
    if (!file) return <div className="p-8">File Not Found</div>;

    const isPaid = file.facilitation_fee_status === 'paid';

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900 flex items-center gap-2 text-sm font-medium mb-4">
                <ArrowLeft className="w-4 h-4" /> Back to Queue
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Loan Facilitation File</h1>
                    <p className="text-gray-500 text-sm mt-1">{file.lead?.reference_id || 'Ref N/A'}</p>
                </div>
                {!isPaid && (
                    <Button onClick={handlePayFee} disabled={paying} className="bg-brand-600 hover:bg-brand-700">
                        {paying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <IndianRupee className="w-4 h-4 mr-2" />}
                        Collect Facilitation Fee
                    </Button>
                )}
                {isPaid && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium border border-green-200">
                        <CheckCircle2 className="w-5 h-5" /> Fee Collected
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-brand-600" /> Customer Details
                    </h3>
                    <dl className="space-y-4 text-sm">
                        <div>
                            <dt className="text-gray-500">Name</dt>
                            <dd className="font-medium text-gray-900">{file.lead?.owner_name}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">Contact</dt>
                            <dd className="font-medium text-gray-900">{file.lead?.owner_contact}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">Address</dt>
                            <dd className="font-medium text-gray-900">{file.lead?.shop_address || 'Not Provided'}</dd>
                        </div>
                    </dl>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                        <IndianRupee className="w-4 h-4 text-brand-600" /> Facilitation Info
                    </h3>
                    <dl className="space-y-4 text-sm">
                        <div>
                            <dt className="text-gray-500">Payment Method</dt>
                            <dd className="font-medium text-gray-900 capitalize">{file.payment_method || 'Upfront'}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">Fee Amount</dt>
                            <dd className="font-medium text-gray-900">₹{file.fee_amount || 0}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">Validation Status</dt>
                            <dd className="font-medium text-gray-900 capitalize">{file.company_validation_status}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">File Created</dt>
                            <dd className="font-medium text-gray-900">{new Date(file.created_at).toLocaleString()}</dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>
    );
}
