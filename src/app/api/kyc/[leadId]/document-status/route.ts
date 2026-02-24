import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { kycSessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
    try {
        const { leadId } = await params;

        let [session] = await db.select().from(kycSessions).where(eq(kycSessions.lead_id, leadId));

        if (!session) {
            return NextResponse.json({ success: false, error: 'KYC session not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, documents: session.documents || {} });

    } catch (error: any) {
        console.error('KYC Document Status Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
