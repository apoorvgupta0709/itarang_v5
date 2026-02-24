import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const supabase = await createClient();

        // 1. Get Uploader ID (use current user, or fallback to any user for dev)
        const { data: authData } = await supabase.auth.getUser();
        let uploaderId = authData?.user?.id;

        if (!uploaderId) {
            if (process.env.NODE_ENV !== 'production') {
                const { data: anyUser } = await supabase.from('users').select('id').limit(1).single();
                if (anyUser) uploaderId = anyUser.id;
            } else {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
            }
        }

        if (!uploaderId) {
            return NextResponse.json({ success: false, error: 'No user to assign lead owner' }, { status: 500 });
        }

        // 2. Generate Reference ID & ID
        const year = new Date().getFullYear();
        let seq = 1;

        // Simple retry loop for sequence generation
        for (let i = 0; i < 3; i++) {
            const { data: counter } = await supabase.from('lead_reference_counter').select('seq').eq('year', year).single();
            if (counter) {
                seq = counter.seq + 1;
                const { error: updateErr } = await supabase.from('lead_reference_counter').update({ seq }).eq('year', year).eq('seq', counter.seq);
                if (!updateErr) break; // Success
            } else {
                const { error: insertErr } = await supabase.from('lead_reference_counter').insert({ year, seq: 1 });
                if (!insertErr) break; // Success
            }
        }

        const referenceId = `#IT-${year}-${String(seq).padStart(7, '0')}`;
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const id = `LEAD-${dateStr}-${String(seq).padStart(4, '0')}`;
        const leadScore = body.interestLevel === 'hot' ? 90 : (body.interestLevel === 'warm' ? 60 : 30);

        // 3. Insert into Leads
        const { data: inserted, error } = await supabase.from('leads').insert({
            reference_id: referenceId,
            lead_source: 'ground_sales',
            interest_level: body.interestLevel || 'cold',
            lead_status: 'new',
            workflow_step: 1,
            lead_score: leadScore,
            owner_name: body.fullName || 'Unknown',
            owner_contact: body.phone,
            state: 'Unknown', // Placeholder, ideally extracted from address
            city: 'Unknown',  // Placeholder
            shop_address: body.currentAddress || null,
            uploader_id: uploaderId
        }).select('id, reference_id').single();

        if (error || !inserted) {
            console.error("DB Insert Error", error);
            throw error;
        }

        return NextResponse.json({
            success: true,
            leadId: inserted.id,
            referenceId: inserted.reference_id,
            message: "Lead created successfully"
        });
    } catch (error: any) {
        console.error("Error in /api/leads/create", error);

        return NextResponse.json({
            success: false,
            error: "Failed to create lead",
        }, { status: 500 });
    }
}
