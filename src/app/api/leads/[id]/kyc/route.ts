import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const formData = await request.formData();
        const documentType = formData.get('documentType');
        const documentNumber = formData.get('documentNumber');
        const frontScan = formData.get('frontScan');
        const backScan = formData.get('backScan');

        // Validation stub
        if (!documentType || !documentNumber || !frontScan) {
            return NextResponse.json({ success: false, message: 'Missing required parameters' }, { status: 400 });
        }

        // Output some simulation logging
        console.log(`Processing KYC for Lead: ${id}, Doc: ${documentType}-${documentNumber}`);

        // Mock 1.5s delay to simulate API verification
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Always return verified in mock except when doc number contains 'fail'
        if (typeof documentNumber === 'string' && documentNumber.toLowerCase().includes('fail')) {
            return NextResponse.json({ success: false, status: 'failed', message: 'Document validation failed' });
        }

        return NextResponse.json({
            success: true,
            status: 'verified',
            message: 'Document successfully verified'
        });

    } catch (error: any) {
        console.error("KYC Verification API Error", error);
        return NextResponse.json({ success: false, message: 'Server error processing KYC' }, { status: 500 });
    }
}
