'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type OEM = {
  id: string;
  business_entity_name: string;
};

type Product = {
  id: string;
  model_type: string;
  asset_type: string;
  asset_category: string;
};

type PreviewResponse = {
  provision_id: string;
  routing: {
    email_to: string[];
    email_cc: string[];
    whatsapp_to_phone: string;
  };
  templates: {
    email_subject: string;
    email_body: string;
    whatsapp_message: string;
  };
};

function csvToEmails(csv: string) {
  return Array.from(
    new Set(
      csv
        .split(',')
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

export default function CreateProvisionPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [oems, setOems] = useState<OEM[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedOemId, setSelectedOemId] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');

  const [qtyByProduct, setQtyByProduct] = useState<Record<string, number>>({});

  const [preview, setPreview] = useState<PreviewResponse | null>(null);

  // routing fields (auto-populated from DB via preview)
  const [emailToCsv, setEmailToCsv] = useState('');
  const [emailCcCsv, setEmailCcCsv] = useState('');
  const [whatsappToPhone, setWhatsappToPhone] = useState('');

  // templates
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');

  useEffect(() => {
    const loadOems = async () => {
      const res = await fetch('/api/oems');
      const json = await res.json();
      setOems(json?.data?.items || []);
    };
    loadOems().catch(console.error);
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      if (!selectedOemId) {
        setProducts([]);
        setQtyByProduct({});
        setPreview(null);
        return;
      }
      const res = await fetch(`/api/product-catalog?oem_id=${encodeURIComponent(selectedOemId)}`);
      const json = await res.json();
      setProducts(json?.data?.items || []);
      setQtyByProduct({});
      setPreview(null);
    };
    loadProducts().catch(console.error);
  }, [selectedOemId]);

  const selectedItems = useMemo(() => {
    return Object.entries(qtyByProduct)
      .filter(([, q]) => (q || 0) > 0)
      .map(([product_id, quantity]) => {
        const prod = products.find((p) => p.id === product_id);
        return {
          product_id,
          model_type: prod?.model_type || product_id,
          quantity,
        };
      });
  }, [qtyByProduct, products]);

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      return (
        p.id.toLowerCase().includes(q) ||
        p.model_type.toLowerCase().includes(q) ||
        p.asset_type.toLowerCase().includes(q) ||
        p.asset_category.toLowerCase().includes(q)
      );
    });
  }, [products, search]);

  const handleQtyChange = (product_id: string, quantity: number) => {
    setQtyByProduct((prev) => ({ ...prev, [product_id]: quantity }));
    setPreview(null);
  };

  const generatePreview = async () => {
    if (!selectedOemId || selectedItems.length === 0) {
      alert('Select an OEM and at least one item.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/provisions/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oem_id: selectedOemId, items: selectedItems }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error?.message || 'Failed to generate preview');

      const p: PreviewResponse = json.data;
      setPreview(p);

      // auto-populated routing
      setEmailToCsv((p.routing.email_to || []).join(', '));
      setEmailCcCsv((p.routing.email_cc || []).join(', '));
      setWhatsappToPhone(p.routing.whatsapp_to_phone || '');

      // editable templates
      setEmailSubject(p.templates.email_subject);
      setEmailBody(p.templates.email_body);
      setWhatsappMessage(p.templates.whatsapp_message);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Error generating preview');
    } finally {
      setLoading(false);
    }
  };

  const placeProcurementRequest = async () => {
    if (!preview) {
      alert('Generate preview first.');
      return;
    }

    const emailTo = csvToEmails(emailToCsv);
    const emailCc = csvToEmails(emailCcCsv).filter((x) => !emailTo.includes(x));

    if (emailTo.length === 0) {
      alert('Email TO is empty. (OEM Sales Manager email is required)');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/provisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: preview.provision_id,
          oem_id: selectedOemId,
          products: selectedItems,
          remarks: description,

          send_to_oem: true,
          email_to: emailTo,
          email_cc: emailCc,
          whatsapp_to_phone: whatsappToPhone,

          email_subject: emailSubject,
          email_body: emailBody,
          whatsapp_message: whatsappMessage,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error?.message || 'Failed to place procurement request');

      const status = json?.data?.status;

      if (status !== 'req_sent') {
        alert('Provision created, but n8n did not confirm BOTH email & WhatsApp delivery. Status kept as Pending.');
      } else {
        alert('Success! Procurement request sent (Email + WhatsApp).');
      }

      router.push('/provisions');
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Error placing procurement request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create Provision</h1>
        <p className="text-sm text-gray-500 mt-1">
          OEM selection → product selection → auto TO/CC/WhatsApp from DB → send via n8n
        </p>
      </div>

      {/* Step 1: OEM */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-bold text-gray-900">1) Select OEM</h2>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>OEM</Label>
            <select
              className="w-full h-10 rounded-xl border-gray-200 focus:ring-brand-500 focus:border-brand-500"
              value={selectedOemId}
              onChange={(e) => setSelectedOemId(e.target.value)}
            >
              <option value="">Select an OEM</option>
              {oems.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.business_entity_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              placeholder="Optional (e.g., urgent replenishment for Feb sales)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Step 2: Items */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">2) Pick items from Product Catalog</h2>
            <p className="text-sm text-gray-500 mt-1">Set quantities with slider (0 = excluded)</p>
          </div>
          <div className="w-full md:w-80">
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={!selectedOemId}
            />
          </div>
        </div>

        {!selectedOemId && <p className="mt-6 text-sm text-gray-500">Select an OEM to view its catalog.</p>}

        {selectedOemId && (
          <div className="mt-6 space-y-4">
            {visibleProducts.map((p) => {
              const q = qtyByProduct[p.id] || 0;
              return (
                <div key={p.id} className="p-4 rounded-xl border border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{p.model_type}</p>
                      <p className="text-xs text-gray-500">
                        {p.id} • {p.asset_category} • {p.asset_type}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-48">
                        <input
                          type="range"
                          min={0}
                          max={50}
                          value={q}
                          onChange={(e) => handleQtyChange(p.id, parseInt(e.target.value || '0', 10))}
                          className="w-full"
                        />
                      </div>
                      <div className="w-16 text-right">
                        <span className="text-sm font-bold text-gray-900">{q}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {products.length === 0 && (
              <div className="p-10 rounded-xl border border-dashed border-gray-300 text-center">
                <p className="text-sm text-gray-500">No products found for this OEM.</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            Selected items: <span className="font-semibold">{selectedItems.length}</span>
          </p>
          <Button
            type="button"
            variant="primary"
            onClick={generatePreview}
            disabled={loading || !selectedOemId || selectedItems.length === 0}
          >
            {loading ? 'Generating...' : 'Generate Preview (Auto TO/CC/WhatsApp)'}
          </Button>
        </div>
      </div>

      {/* Step 3 */}
      {preview && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-6">
          <h2 className="text-base font-bold text-gray-900">3) Send procurement request</h2>
          <p className="text-sm text-gray-500 mt-1">
            Provision ID: <span className="font-semibold text-gray-800">{preview.provision_id}</span>
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Email TO (OEM Sales Manager)</Label>
              <Input value={emailToCsv} onChange={(e) => setEmailToCsv(e.target.value)} />
              <p className="text-xs text-gray-400">Comma-separated emails</p>
            </div>
            <div className="space-y-2">
              <Label>Email CC (OEM Sales Head + iTarang SOM + iTarang Sales Head)</Label>
              <Input value={emailCcCsv} onChange={(e) => setEmailCcCsv(e.target.value)} />
              <p className="text-xs text-gray-400">Comma-separated emails</p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <Label>WhatsApp To (OEM Sales Manager phone)</Label>
            <Input value={whatsappToPhone} onChange={(e) => setWhatsappToPhone(e.target.value)} />
          </div>

          <div className="mt-6 space-y-2">
            <Label>Email Subject (editable)</Label>
            <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
          </div>

          <div className="mt-4 space-y-2">
            <Label>Email Body (editable)</Label>
            <textarea
              className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-brand-500 focus:border-brand-500"
              rows={8}
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
            />
          </div>

          <div className="mt-4 space-y-2">
            <Label>WhatsApp Message (editable)</Label>
            <textarea
              className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-brand-500 focus:border-brand-500"
              rows={5}
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="button" variant="primary" onClick={placeProcurementRequest} disabled={loading}>
              {loading ? 'Sending...' : 'Place Procurement Request to OEM'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}