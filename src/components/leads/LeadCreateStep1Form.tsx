"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Upload, AlertCircle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

const formSchema = z.object({
    fullName: z.string().min(2, "Full Name is required (min 2 chars)").max(100),
    fatherName: z.string().optional(),
    dob: z.string().min(1, "Date of birth is required"),
    phone: z.string().regex(/^\+91[0-9]{10}$/, "Must be +91 followed by 10 digits"),
    currentAddress: z.string().optional(),
    permanentAddress: z.string().optional(),
    isCurrentSame: z.boolean().optional(),

    productCategory: z.string().min(1, "Product Category is required"),
    productType: z.string().min(1, "Product Type is required"),

    vehicleRegNumber: z.string().optional(),
    vehicleOwnership: z.string().optional(),
    vehicleOwnerName: z.string().optional(),
    vehicleOwnerPhone: z.string().optional(),

    interestLevel: z.enum(['hot', 'warm', 'cold']),
});

type FormValues = z.infer<typeof formSchema>;

export function LeadCreateStep1Form() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
    const [products, setProducts] = useState<{ id: string, name: string }[]>([]);

    const { register, handleSubmit, setValue, control, watch, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            isCurrentSame: false,
            interestLevel: 'hot',
            phone: '+91'
        }
    });

    const categoryId = useWatch({ control, name: 'productCategory' });
    const isCurrentSame = useWatch({ control, name: 'isCurrentSame' });
    const currentAddress = useWatch({ control, name: 'currentAddress' });
    const phone = useWatch({ control, name: 'phone' });
    const vehicleRegNumber = useWatch({ control, name: 'vehicleRegNumber' });

    // Sync addresses if checked
    useEffect(() => {
        if (isCurrentSame && currentAddress) {
            setValue('permanentAddress', currentAddress);
        }
    }, [isCurrentSame, currentAddress, setValue]);

    // Load categories
    useEffect(() => {
        fetch('/api/inventory/categories').then(r => r.json()).then(data => setCategories(data.categories || []));
    }, []);

    // Load products when category changes
    useEffect(() => {
        if (categoryId) {
            fetch(`/api/inventory/products?categoryId=${categoryId}`).then(r => r.json()).then(data => setProducts(data.products || []));
        } else {
            setProducts([]);
        }
    }, [categoryId]);

    // Duplicate check debounced
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (phone && phone.length === 13) {
                try {
                    const res = await fetch(`/api/leads/check-duplicate?phone=${encodeURIComponent(phone)}`);
                    const data = await res.json();
                    if (data.isDuplicate) {
                        setDuplicateWarning(`A lead with this number already exists (ID: ${data.existingLeadId})`);
                    } else {
                        setDuplicateWarning(null);
                    }
                } catch (e) {
                    console.error(e);
                }
            } else {
                setDuplicateWarning(null);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [phone]);

    const handleScanId = async () => {
        setScanStatus('scanning');
        try {
            const res = await fetch('/api/leads/autofillRequest', { method: 'POST' });
            const data = await res.json();
            if (data.success && data.data) {
                setValue('fullName', data.data.fullName, { shouldValidate: true });
                setValue('fatherName', data.data.fatherName, { shouldValidate: true });
                setValue('dob', data.data.dob, { shouldValidate: true });
                setValue('currentAddress', data.data.address, { shouldValidate: true });
                setScanStatus('success');
            } else {
                setScanStatus('error');
            }
        } catch (e) {
            setScanStatus('error');
        }
    };

    const onSubmit = async (data: FormValues) => {
        // Validate conditional vehicle fields manually if they entered a vehicle number
        if (data.vehicleRegNumber && data.vehicleRegNumber.length > 0) {
            if (!data.vehicleOwnership || !data.vehicleOwnerName || !data.vehicleOwnerPhone) {
                alert("Please complete all Vehicle Ownership details since you entered a Registration Number.");
                return;
            }
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/leads/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error("Failed to create lead");

            const resData = await res.json();

            // Show reference ID
            if (resData.referenceId) {
                alert(`Lead Created Successfully!\nReference ID: ${resData.referenceId}`);
            }

            if (data.interestLevel === 'hot') {
                router.push(`/leads/${resData.leadId}/kyc`);
            } else {
                router.push(`/leads/${resData.leadId}`);
            }
        } catch (err) {
            alert("Error creating lead. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const showVehicleSection = ['2W', '3W', '4W'].some(type =>
        categories.find(c => c.id === categoryId)?.name.includes(type)
    );

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

            {/* Auto-fill section */}
            <div className="bg-gradient-to-br from-indigo-50 leading-relaxed to-blue-50/30 p-6 rounded-2xl border border-indigo-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        Speed up with Auto-fill
                    </h3>
                    <p className="text-sm text-indigo-700/80 mt-1 max-w-lg">
                        Upload Aadhaar to securely extract name, DOB, and address. Or enter details manually below.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button type="button" className="px-4 py-2 bg-white border border-indigo-200 text-indigo-600 text-sm font-medium rounded-xl hover:bg-indigo-50 transition-colors shadow-sm flex items-center gap-2">
                        <Upload className="w-4 h-4" /> Upload IDs
                    </button>
                    <button
                        type="button"
                        onClick={handleScanId}
                        disabled={scanStatus === 'scanning'}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        {scanStatus === 'scanning' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Scan & Extract'}
                    </button>
                </div>
            </div>
            {scanStatus === 'error' && (
                <p className="text-sm text-red-500 flex items-center gap-1.5 mt-2"><AlertCircle className="w-4 h-4" /> Could not read documents. Please try again or enter manually.</p>
            )}
            {scanStatus === 'success' && (
                <p className="text-sm text-green-600 flex items-center gap-1.5 mt-2"><CheckCircle2 className="w-4 h-4" /> Data successfully extracted!</p>
            )}

            {/* Primary Details */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <h3 className="font-bold text-gray-900 text-lg border-b border-gray-50 pb-4">Personal Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Full Name <span className="text-red-500">*</span></Label>
                        <Input {...register('fullName')} placeholder="e.g. Rahul Kumar" />
                        {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Father/Husband Name</Label>
                        <Input {...register('fatherName')} placeholder="e.g. Ramesh Kumar" />
                        <p className="text-[10px] text-gray-400">Required if applying for a loan</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Date of Birth <span className="text-red-500">*</span></Label>
                        <Input type="date" {...register('dob')} />
                        {errors.dob && <p className="text-xs text-red-500">{errors.dob.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Phone Number <span className="text-red-500">*</span></Label>
                        <Input {...register('phone')} placeholder="+919876543210" />
                        {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                        {duplicateWarning && (
                            <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3 h-3" /> {duplicateWarning}
                            </p>
                        )}
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-50">
                    <div className="space-y-2">
                        <Label>Current Address</Label>
                        <Input {...register('currentAddress')} placeholder="Enter full address" />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Permanent Address</Label>
                            <label className="flex items-center gap-2 text-sm text-brand-600 cursor-pointer">
                                <input type="checkbox" {...register('isCurrentSame')} className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                                Same as Current
                            </label>
                        </div>
                        <Input {...register('permanentAddress')} disabled={isCurrentSame} placeholder="Enter full address" />
                    </div>
                </div>
            </div>

            {/* Product Details */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <h3 className="font-bold text-gray-900 text-lg border-b border-gray-50 pb-4">Product of Interest</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Product Category <span className="text-red-500">*</span></Label>
                        <Select {...register('productCategory')}>
                            <option value="">Select Category</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                        {errors.productCategory && <p className="text-xs text-red-500">{errors.productCategory.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Product Type <span className="text-red-500">*</span></Label>
                        <Select {...register('productType')} disabled={!categoryId}>
                            <option value="">Select Product...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </Select>
                        {errors.productType && <p className="text-xs text-red-500">{errors.productType.message}</p>}
                    </div>
                </div>

                {/* Conditional Vehicle Section */}
                {showVehicleSection && (
                    <div className="pt-6 border-t border-gray-50">
                        <h4 className="font-semibold text-gray-800 mb-4 bg-orange-50 text-orange-800 px-3 py-1.5 rounded-lg inline-block text-sm">
                            Existing Vehicle Information (Trade-in / Exchange)
                        </h4>

                        <div className="space-y-2 mb-4">
                            <Label>Vehicle Registration Number</Label>
                            <Input {...register('vehicleRegNumber')} placeholder="e.g. MH01AB1234" className="uppercase uppercase-input" />
                        </div>

                        {vehicleRegNumber && vehicleRegNumber.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="md:col-span-3 pb-2 border-b border-gray-200">
                                    <p className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5 text-blue-500" />
                                        You've entered vehicle details. Please complete ownership information.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Ownership <span className="text-red-500">*</span></Label>
                                    <Select {...register('vehicleOwnership')}>
                                        <option value="">Select...</option>
                                        <option value="self">Self</option>
                                        <option value="financed">Financed</option>
                                        <option value="leased">Leased</option>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Owner Name <span className="text-red-500">*</span></Label>
                                    <Input {...register('vehicleOwnerName')} placeholder="Owner Name" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Owner Phone <span className="text-red-500">*</span></Label>
                                    <Input {...register('vehicleOwnerPhone')} placeholder="+91..." />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Lead Classification */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <h3 className="font-bold text-gray-900 text-lg border-b border-gray-50 pb-4">Lead Classification</h3>

                <div className="space-y-4">
                    <Label>Interest Level <span className="text-red-500">*</span></Label>
                    <div className="flex flex-wrap gap-4">
                        {['hot', 'warm', 'cold'].map((level) => (
                            <label
                                key={level}
                                className={`
                            flex-1 min-w-[120px] text-center cursor-pointer p-4 rounded-xl border-2 transition-all
                            ${watch('interestLevel') === level
                                        ? level === 'hot' ? 'border-red-500 bg-red-50 text-red-700'
                                            : level === 'warm' ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                                : 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-100 bg-white hover:border-gray-200 text-gray-500'
                                    }
                        `}
                            >
                                <input type="radio" value={level} {...register('interestLevel')} className="hidden" />
                                <span className="font-bold uppercase tracking-wider block mb-1">{level}</span>
                                <span className="text-xs opacity-70">
                                    {level === 'hot' ? 'Ready to buy immediately' : level === 'warm' ? 'Interested, needs nurturing' : 'Just inquiring'}
                                </span>
                            </label>
                        ))}
                    </div>
                    {watch('interestLevel') === 'hot' && (
                        <p className="text-sm font-medium text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> Saving a HOT lead will automatically take you to Step 2 (KYC).
                        </p>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t mt-8 sticky bottom-0 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg shadow-gray-200/50">
                <Button variant="outline" type="button" onClick={() => router.back()} disabled={submitting}>
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={submitting}
                    className="min-w-[150px] bg-brand-600 hover:bg-brand-700 text-white font-medium"
                >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Create Lead & Continue'}
                </Button>
            </div>
        </form>
    );
}
