"use client";

import React, { useState } from "react";

type Props = { onCreated?: () => void };

export function OemForm({ onCreated }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    business_entity_name: "",
    gstin: "",
    pan: "",
    cin: "",

    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",

    bank_name: "",
    bank_account_number: "",
    ifsc_code: "",
    bank_proof_url: "",

    contacts: {
      sales_head: { name: "", phone: "", email: "" },
      sales_manager: { name: "", phone: "", email: "" },
      finance_manager: { name: "", phone: "", email: "" },
    },
  });

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const setContact = (
    role: "sales_head" | "sales_manager" | "finance_manager",
    k: string,
    v: string
  ) => {
    setForm((p) => ({
      ...p,
      contacts: { ...p.contacts, [role]: { ...p.contacts[role], [k]: v } },
    }));
  };

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/oems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || "Failed to create OEM");
      }
      onCreated?.();
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Create OEM</h2>
        <p className="text-sm text-gray-500">
          Onboard OEM with banking + 3 mandatory contacts.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-sm border border-rose-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          className="input-parcel"
          placeholder="Business Entity Name *"
          value={form.business_entity_name}
          onChange={(e) => set("business_entity_name", e.target.value)}
        />
        <input
          className="input-parcel"
          placeholder="GSTIN *"
          value={form.gstin}
          onChange={(e) => set("gstin", e.target.value)}
        />
        <input
          className="input-parcel"
          placeholder="PAN"
          value={form.pan}
          onChange={(e) => set("pan", e.target.value)}
        />
        <input
          className="input-parcel"
          placeholder="CIN"
          value={form.cin}
          onChange={(e) => set("cin", e.target.value)}
        />

        <input
          className="input-parcel"
          placeholder="Bank Account Number *"
          value={form.bank_account_number}
          onChange={(e) => set("bank_account_number", e.target.value)}
        />
        <input
          className="input-parcel"
          placeholder="IFSC Code *"
          value={form.ifsc_code}
          onChange={(e) => set("ifsc_code", e.target.value)}
        />
        <input
          className="input-parcel"
          placeholder="Bank Name"
          value={form.bank_name}
          onChange={(e) => set("bank_name", e.target.value)}
        />
        <input
          className="input-parcel"
          placeholder="Bank Proof URL"
          value={form.bank_proof_url}
          onChange={(e) => set("bank_proof_url", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          className="input-parcel"
          placeholder="Address Line 1"
          value={form.address_line1}
          onChange={(e) => set("address_line1", e.target.value)}
        />
        <input
          className="input-parcel"
          placeholder="Address Line 2"
          value={form.address_line2}
          onChange={(e) => set("address_line2", e.target.value)}
        />
        <input
          className="input-parcel"
          placeholder="City"
          value={form.city}
          onChange={(e) => set("city", e.target.value)}
        />
        <input
          className="input-parcel"
          placeholder="State"
          value={form.state}
          onChange={(e) => set("state", e.target.value)}
        />
        <input
          className="input-parcel"
          placeholder="Pincode"
          value={form.pincode}
          onChange={(e) => set("pincode", e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Contacts (required)
        </h3>

        {(["sales_head", "sales_manager", "finance_manager"] as const).map(
          (role) => (
            <div
              key={role}
              className="p-4 rounded-2xl bg-gray-50 border border-gray-100"
            >
              <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                {role.replace("_", " ")}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  className="input-parcel"
                  placeholder="Name *"
                  value={form.contacts[role].name}
                  onChange={(e) => setContact(role, "name", e.target.value)}
                />
                <input
                  className="input-parcel"
                  placeholder="Phone *"
                  value={form.contacts[role].phone}
                  onChange={(e) => setContact(role, "phone", e.target.value)}
                />
                <input
                  className="input-parcel"
                  placeholder="Email *"
                  value={form.contacts[role].email}
                  onChange={(e) => setContact(role, "email", e.target.value)}
                />
              </div>
            </div>
          )
        )}
      </div>

      <button
        onClick={submit}
        disabled={loading}
        className="btn-primary w-full justify-center"
      >
        {loading ? "Creating..." : "Create OEM"}
      </button>
    </div>
  );
}