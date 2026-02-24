import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        products: [
            { id: 'prod-1', name: 'Tarang E-Rickshaw X1' },
            { id: 'prod-2', name: 'Tarang E-Loader Pro' },
            { id: 'prod-3', name: 'Tarang 2W Swift' },
        ]
    });
}
