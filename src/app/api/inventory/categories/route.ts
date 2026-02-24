import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        categories: [
            { id: 'cat-1', name: '2-Wheeler (EV)' },
            { id: 'cat-2', name: '3-Wheeler (EV Passenger)' },
            { id: 'cat-3', name: '3-Wheeler (EV Cargo)' },
            { id: 'cat-4', name: 'Inverter/Battery' },
        ]
    });
}
