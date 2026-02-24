import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { kycSessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
    try {
        const { leadId } = await params;
        const body = await request.json();
        const { payment_method } = body;

        if (!payment_method || !['finance', 'upfront'].includes(payment_method)) {
            return NextResponse.json({ success: false, error: 'Invalid payment method' }, { status: 400 });
        }

        // Determine required docs based on payment method
        // e.g. Finance requires Aadhaar, PAN, Utility Bill. Upfront only Aadhaar, PAN.
        const requiredDocs = payment_method === 'finance' ? 3 : 2;

        // Update the session
        await db.update(kycSessions)
            .set({
                payment_method,
                required_total: requiredDocs,
                updated_at: new Date()
            })
            .where(eq(kycSessions.lead_id, leadId));

        // Fetch updated session
        const [updatedSession] = await db.select().from(kycSessions).where(eq(kycSessions.lead_id, leadId));

        return NextResponse.json({ success: true, session: updatedSession });

    } catch (error: any) {
        console.error('KYC Payment Method Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
