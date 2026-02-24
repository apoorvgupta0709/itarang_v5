import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { kycSessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
    try {
        const { leadId } = await params;
        const body = await request.json();

        // Mock sending consent (email/SMS to lead owner)
        // Set consent_status = 'sent'
        await db.update(kycSessions)
            .set({
                consent_status: 'sent',
                updated_at: new Date()
            })
            .where(eq(kycSessions.lead_id, leadId));

        return NextResponse.json({ success: true, message: 'Consent link/OTP sent successfully via SMS/Email' });

    } catch (error: any) {
        console.error('KYC Send Consent Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
