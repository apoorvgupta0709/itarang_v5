
'use client';

import { useState, useEffect } from 'react';

// Battery Variant Definitions (9 Specs x 2 IOT Statuses)
const batterySpecs = [
    { volts: '51.2', amp_hours: '105' }, // Confirmed
    { volts: '48', amp_hours: '40' },
    { volts: '60', amp_hours: '30' },
    { volts: '60', amp_hours: '50' },
    { volts: '72', amp_hours: '50' },
    { volts: '48', amp_hours: '100' },
    { volts: '60', amp_hours: '100' },
    { volts: '72', amp_hours: '100' },
    { volts: '51.2', amp_hours: '80' },
];

const iotStatuses = ['With IOT', 'Without IOT'];

export default function ProductCatalogForm() {
    const [assetCategory, setAssetCategory] = useState('');
    const [assetType, setAssetType] = useState('');
    const [iotStatus, setIotStatus] = useState('');
    const [technicalSpec, setTechnicalSpec] = useState('');
    const [modelType, setModelType] = useState('');

    useEffect(() => {
        if (assetCategory === '3W' && assetType === 'Battery' && iotStatus && technicalSpec) {
            // Format: "With IOT 51.2 V-105AH"
            setModelType(`${iotStatus} ${technicalSpec}`);
        } else {
            setModelType('');
        }
    }, [assetCategory, assetType, iotStatus, technicalSpec]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Integrate with creating product API
        alert(`Creating Product: ${modelType}`);
    };

    return (
        <div className="max-w-2xl mx-auto card-parcel">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Product</h2>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Asset Category */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Asset Category</label>
                    <select
                        className="input-parcel"
                        value={assetCategory}
                        onChange={(e) => setAssetCategory(e.target.value)}
                        required
                    >
                        <option value="">Select Category</option>
                        <option value="3W">3W</option>
                        <option value="2W">2W</option>
                        <option value="Inverter">Inverter</option>
                    </select>
                </div>

                {/* Asset Type */}
                {assetCategory && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Asset Type</label>
                        <select
                            className="input-parcel"
                            value={assetType}
                            onChange={(e) => setAssetType(e.target.value)}
                            required
                        >
                            <option value="">Select Type</option>
                            {assetCategory === '3W' && (
                                <>
                                    <option value="Battery">Battery</option>
                                    <option value="Charger">Charger</option>
                                    <option value="Spare">Spare</option>
                                </>
                            )}
                            {/* Add other logic if needed */}
                        </select>
                    </div>
                )}

                {/* Battery Specific Cascading Dropdowns */}
                {assetCategory === '3W' && assetType === 'Battery' && (
                    <div className="bg-brand-50 p-6 rounded-2xl space-y-6 border border-brand-100/50">
                        <h3 className="text-lg font-semibold text-brand-800">Battery Specifications</h3>

                        {/* IOT Status */}
                        <div>
                            <label className="block text-sm font-medium text-brand-900 mb-2">IOT Status</label>
                            <select
                                className="input-parcel bg-white"
                                value={iotStatus}
                                onChange={(e) => setIotStatus(e.target.value)}
                                required
                            >
                                <option value="">Select Status</option>
                                {iotStatuses.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        {/* Technical Specs */}
                        <div>
                            <label className="block text-sm font-medium text-brand-900 mb-2">Technical Specification (Voltage - Capacity)</label>
                            <select
                                className="input-parcel bg-white"
                                value={technicalSpec}
                                onChange={(e) => setTechnicalSpec(e.target.value)}
                                required
                            >
                                <option value="">Select Spec</option>
                                {batterySpecs.map((spec, idx) => {
                                    const val = `${spec.volts} V-${spec.amp_hours}AH`;
                                    return <option key={idx} value={val}>{val}</option>;
                                })}
                            </select>
                        </div>
                    </div>
                )}

                {/* Model Type Preview */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Generated Model Type</label>
                    <input
                        type="text"
                        value={modelType}
                        readOnly
                        className="input-parcel bg-gray-50/50 text-gray-500 cursor-not-allowed font-mono"
                        placeholder="Auto-generated..."
                    />
                </div>

                <button
                    type="submit"
                    className="btn-primary w-full"
                >
                    Create Product
                </button>
            </form>
        </div>
    );
}
