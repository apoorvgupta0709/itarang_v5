import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    // Stub implementation
    if (phone === '+919999999999') {
        return NextResponse.json({ isDuplicate: true, existingLeadId: 'LD-8392' });
    }

    return NextResponse.json({ isDuplicate: false });
}
