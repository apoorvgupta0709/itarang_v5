"use client";

import React, { useRef, useState } from "react";
import {
  Upload,
  FileDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ success: any[]; errors: any[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults(null);
    }
  };

  const handleUpload = async () => {
    if (!file || uploading) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/inventory/bulk-upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        setResults(json.data);
      } else {
        alert("Upload failed: " + (json?.error?.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  // ✅ FIX: download template from server with proper filename
  const downloadTemplate = async () => {
    try {
      const res = await fetch("/api/inventory/template");
      if (!res.ok) {
        alert("Template download failed");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "inventory_upload_template.xlsx"; // ✅ force name (no UUID)
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Template download failed");
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Bulk Inventory Upload</h1>
          <p className="text-gray-500 mt-1">Upload CSV or Excel files to update inventory</p>
        </div>

        <div className="card-parcel space-y-8">
          {/* Instructions */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Upload Instructions:</p>
              <ul className="list-disc ml-4 space-y-1 text-blue-800">
                <li>
                  Supported formats: <strong>.csv, .xlsx</strong>
                </li>
                <li>
                  <strong>Required:</strong>{" "}
                  <code>hsn_code</code>, <code>oem_name</code>, <code>inventory_amount</code>,{" "}
                  <code>gst_percent</code>, <code>warranty_months</code>
                </li>
                <li>
                  <strong>Serialized Items:</strong> <code>is_serialized=true</code> &amp;{" "}
                  <code>serial_number</code> required.
                </li>
                <li>
                  <strong>IoT Items:</strong> <code>iot_imei_no</code> required (if applicable).
                </li>
                <li>
                  <strong>Dates (YYYY-MM-DD):</strong>{" "}
                  <code>manufacturing_date</code>, <code>expiry_date</code>, <code>oem_invoice_date</code>,{" "}
                  <code>challan_date</code>
                </li>
                <li>
                  <strong>Optional:</strong> <code>batch_number</code>, <code>warehouse_location</code>.
                  Default quantity is 1.
                </li>
              </ul>
            </div>
          </div>

          {/* Upload Area */}
          <div
            className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center transition-all hover:border-brand-300 hover:bg-brand-50/10 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
            />

            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-2">
                {file ? (
                  <FileSpreadsheet className="w-8 h-8 text-brand-600" />
                ) : (
                  <Upload className="w-8 h-8" />
                )}
              </div>

              {file ? (
                <div>
                  <p className="text-lg font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setResults(null);
                    }}
                    className="mt-2 text-sm text-red-500 hover:text-red-600 font-medium"
                  >
                    Remove File
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium text-gray-700">Click to choose a file</p>
                  <p className="text-sm text-gray-500 mt-1">CSV or Excel template supported</p>
                </div>
              )}
            </div>
          </div>

          {/* ✅ Always-visible action bar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={downloadTemplate}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors active:scale-95 flex items-center gap-2 justify-center"
            >
              <FileDown className="w-4 h-4" />
              Download Template
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors active:scale-95 flex items-center gap-2 justify-center"
            >
              <Upload className="w-4 h-4" />
              Choose File
            </button>

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="btn-primary min-w-[180px] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {uploading ? "Processing..." : "Upload Inventory"}
            </button>
          </div>

          {/* Results */}
          {results && (
            <div className="border-t border-gray-100 pt-6 animate-in slide-in-from-top-4 fade-in">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Upload Results</h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-700">{results.success.length}</p>
                    <p className="text-xs font-medium text-green-600 uppercase tracking-wide">
                      Successful Rows
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-center gap-3">
                  <XCircle className="w-8 h-8 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold text-red-700">{results.errors.length}</p>
                    <p className="text-xs font-medium text-red-600 uppercase tracking-wide">
                      Failed Rows
                    </p>
                  </div>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-100/50">
                    <h4 className="text-sm font-semibold text-gray-700">Error Log</h4>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-4 space-y-2">
                    {results.errors.map((err, idx) => (
                      <div key={idx} className="flex gap-2 text-sm text-red-600">
                        <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200 text-gray-600">
                          Row {err.row}
                        </span>
                        <span>{err.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}