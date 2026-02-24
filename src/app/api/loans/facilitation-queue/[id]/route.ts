import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const supabase = await createClient();
        const { id } = await context.params;

        const { data, error } = await supabase
            .from('loan_facilitation_files')
            .select(`
                *,
                leads (
                    id,
                    reference_id,
                    owner_name,
                    owner_contact,
                    shop_address
                )
            `)
            .eq('id', id)
            .single();

        if (error || !data) {
            return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
        }

        const file = {
            ...data,
            lead: data.leads
        };

        return NextResponse.json({ success: true, file });
    } catch (error) {
        console.error('API Error /api/loans/facilitation-queue/[id]:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
