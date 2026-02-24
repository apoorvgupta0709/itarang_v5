import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { leads, kycSessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
    try {
        const { leadId } = await params;
        const supabase = await createClient();

        // 1. Check if lead exists and is valid for KYC (only hot leads)
        const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
        if (!lead) {
            return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
        }

        if (lead.interest_level !== 'hot') {
            return NextResponse.json({ success: false, error: 'Lead is not eligible for KYC (must be hot)', redirectTo: `/leads/${leadId}` }, { status: 403 });
        }

        // 2. Load or create KYC session
        let [session] = await db.select().from(kycSessions).where(eq(kycSessions.lead_id, leadId));

        if (!session) {
            // Create a new session with empty defaults
            const newSession = {
                lead_id: leadId,
                kyc_status: 'pending',
                required_total: 0,
                documents: {},
                verification_status: {},
                kyc_draft_data: {}
            };
            await db.insert(kycSessions).values(newSession);
            session = { ...newSession, created_at: new Date(), updated_at: new Date() } as any;
        }

        return NextResponse.json({ success: true, lead, session });

    } catch (error: any) {
        console.error('KYC Access Check Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
