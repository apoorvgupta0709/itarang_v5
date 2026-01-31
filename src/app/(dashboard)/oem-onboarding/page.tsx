"use client";

import React, { useState } from "react";
import { OemForm } from "@/components/oems/oem-form";
import { OemTable } from "@/components/oems/oem-table";
import { useQueryClient } from "@tanstack/react-query";

export default function OEMOnboardingPage() {
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">OEM Onboarding</h1>
          <p className="text-sm text-gray-500">
            Create OEMs first. Inventory upload depends on valid OEM + Product Catalog.
          </p>
        </div>

        <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
          {showForm ? "Back to List" : "Create OEM"}
        </button>
      </div>

      {showForm ? (
        <OemForm
          onCreated={async () => {
            setShowForm(false);
            await qc.invalidateQueries({ queryKey: ["oems"] });
          }}
        />
      ) : (
        <OemTable />
      )}
    </div>
  );
}