import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('loan_facilitation_files')
            .select(`
                id,
                lead_id,
                payment_method,
                documents_uploaded,
                company_validation_status,
                facilitation_fee_status,
                fee_amount,
                created_at,
                updated_at,
                leads (
                    id,
                    reference_id,
                    owner_name,
                    owner_contact
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching loan queue:', error);
            // Fallback for missing tables locally
            return NextResponse.json({ success: true, files: [] });
        }

        const files = data?.map(item => ({
            ...item,
            lead: item.leads // mapping correctly for frontend
        })) || [];

        return NextResponse.json({ success: true, files });
    } catch (error) {
        console.error('API Error /api/loans/facilitation-queue:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
