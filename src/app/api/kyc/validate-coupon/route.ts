import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { couponCode } = body;

        if (!couponCode) {
            return NextResponse.json({ success: false, error: 'Coupon code required' }, { status: 400 });
        }

        // Mock coupon validation
        const MOCK_VALID_COUPON = 'ITRNG100'; // Example

        if (couponCode.toUpperCase() === MOCK_VALID_COUPON) {
            return NextResponse.json({ success: true, discountValue: 100, message: 'Coupon applied successfully' });
        } else {
            return NextResponse.json({ success: false, error: 'Invalid or expired coupon' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Coupon Validate Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
