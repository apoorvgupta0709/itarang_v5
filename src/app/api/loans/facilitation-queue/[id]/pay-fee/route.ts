import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const supabase = await createClient();
        const { id } = await context.params;

        // Mock payment process, simply updating the status in DB
        const { error } = await supabase
            .from('loan_facilitation_files')
            .update({
                facilitation_fee_status: 'paid',
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('API Error paying fee:', error);
            return NextResponse.json({ success: false, error: 'Failed to update payment status' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Fee paid successfully' });
    } catch (error) {
        console.error('API Error /api/loans/facilitation-queue/[id]/pay-fee:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
