import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { kycSessions, loanFacilitationFiles, leads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
    try {
        const { leadId } = await params;

        // Mark session as complete
        await db.update(kycSessions)
            .set({
                kyc_status: 'completed',
                updated_at: new Date()
            })
            .where(eq(kycSessions.lead_id, leadId));

        // Advance the lead workflow step
        await db.update(leads)
            .set({
                workflow_step: 3, // KYC Complete -> Step 3
                lead_status: 'qualified', // Update status
                updated_at: new Date()
            })
            .where(eq(leads.id, leadId));

        // Let's also create the facilitation fee entry if it's finance
        const [session] = await db.select().from(kycSessions).where(eq(kycSessions.lead_id, leadId));

        if (session && session.payment_method === 'finance') {
            const facilitationId = 'LF-' + Math.floor(10000 + Math.random() * 90000);
            await db.insert(loanFacilitationFiles).values({
                id: facilitationId,
                lead_id: leadId,
                payment_method: session.payment_method,
                documents_uploaded: true,
                company_validation_status: 'pending',
                facilitation_fee_status: 'pending',
                fee_amount: '1500.00' // Example mock fee
            }).onConflictDoNothing(); // If already created, ignore
        }

        return NextResponse.json({ success: true, message: 'KYC completed successfully!' });

    } catch (error: any) {
        console.error('KYC Complete Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
