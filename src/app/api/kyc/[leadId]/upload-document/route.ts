import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { kycSessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
    try {
        const { leadId } = await params;
        const formData = await request.formData();

        const documentType = formData.get('documentType') as string;
        const documentNumber = formData.get('documentNumber') as string;
        const frontScan = formData.get('frontScan') as File;
        const backScan = formData.get('backScan') as File | null;

        if (!documentType || !documentNumber || !frontScan) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = await createClient();

        // Optional: Actually upload to Supabase Storage here.
        // For BRD Phase 2, we simulate successful upload returning mock URLs.
        const mockFrontUrl = `https://storage.mock.dev/itarang/kyc/${leadId}_${documentType}_front.pdf`;
        const mockBackUrl = backScan ? `https://storage.mock.dev/itarang/kyc/${leadId}_${documentType}_back.pdf` : null;

        // Fetch current session
        const [session] = await db.select().from(kycSessions).where(eq(kycSessions.lead_id, leadId));
        if (!session) {
            return NextResponse.json({ success: false, error: 'KYC session not found' }, { status: 404 });
        }

        const updatedDocuments = {
            ...(session.documents as any || {}),
            [documentType.toLowerCase().replace(/\s/g, '_')]: {
                number: documentNumber,
                frontUrl: mockFrontUrl,
                backUrl: mockBackUrl,
                status: 'pending_verification',
                uploadedAt: new Date().toISOString()
            }
        };

        // For now, auto-verify for demo purposes
        const autoVerified = true;
        if (autoVerified) {
            updatedDocuments[documentType.toLowerCase().replace(/\s/g, '_')].status = 'verified';
        }

        // Update the session
        await db.update(kycSessions)
            .set({
                documents: updatedDocuments,
                updated_at: new Date()
            })
            .where(eq(kycSessions.lead_id, leadId));

        return NextResponse.json({ success: true, message: 'Document uploaded successfully', documents: updatedDocuments });

    } catch (error: any) {
        console.error('KYC Upload Document Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
