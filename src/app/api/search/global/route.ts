import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q || q.length < 2) {
        return NextResponse.json({ results: [] });
    }

    const supabase = await createClient();

    try {
        let allResults: any[] = [];

        // 1. Leads
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('id, reference_id, owner_name, owner_contact')
                .or(`owner_name.ilike.%${q}%,owner_contact.ilike.%${q}%,reference_id.ilike.%${q}%,id.ilike.%${q}%`)
                .limit(5);
            if (!error && data) {
                const mapped = data.map((l: any) => ({
                    id: l.id,
                    title: l.owner_name || l.reference_id || l.id,
                    subtitle: `${l.reference_id || 'No Ref'} • ${l.owner_contact}`,
                    type: 'Lead',
                    href: `/leads/${l.id}`
                }));
                allResults.push(...mapped);
            }
        } catch (e) {
            console.log("Leads table query failed", e);
        }

        // 2. Customers (Accounts)
        try {
            const { data, error } = await supabase
                .from('accounts')
                .select('id, business_name, owner_name, phone')
                .or(`business_name.ilike.%${q}%,owner_name.ilike.%${q}%,phone.ilike.%${q}%,id.ilike.%${q}%`)
                .limit(5);
            if (!error && data) {
                const mapped = data.map((c: any) => ({
                    id: c.id,
                    title: c.business_name || c.owner_name,
                    subtitle: `Customer • ${c.phone || c.id}`,
                    type: 'Customer',
                    href: `/customers/${c.id}` // Placeholder page
                }));
                allResults.push(...mapped);
            }
        } catch (e) {
            console.log("Accounts query failed", e);
        }

        // 3. Inventory
        try {
            const { data, error } = await supabase
                .from('inventory')
                .select('id, serial_number, oem_name')
                .or(`id.ilike.%${q}%,serial_number.ilike.%${q}%,oem_name.ilike.%${q}%`)
                .limit(5);
            if (!error && data) {
                const mapped = data.map((i: any) => ({
                    id: i.id,
                    title: i.serial_number || i.id,
                    subtitle: `Inventory • ${i.oem_name || ''}`,
                    type: 'Inventory',
                    href: `/inventory/${i.id}`
                }));
                allResults.push(...mapped);
            }
        } catch (e) {
            console.log("Inventory query failed", e);
        }

        // Group by type
        const grouped = allResults.reduce((acc: any, item: any) => {
            if (!acc[item.type]) acc[item.type] = [];
            acc[item.type].push(item);
            return acc;
        }, {});

        const formattedResults = Object.keys(grouped).map(key => ({
            category: key,
            items: grouped[key]
        }));

        return NextResponse.json({ results: formattedResults });

    } catch (error) {
        console.error('Global search error:', error);
        return NextResponse.json({ results: [] }, { status: 500 });
    }
}
