import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    // Stub OCR processing
    return NextResponse.json({
        success: true,
        data: {
            fullName: "Aarti Sharma",
            fatherName: "Rakesh Sharma",
            dob: "1990-05-15",
            address: "123 Main St, Tech Park, Bangalore 560001"
        },
        message: "Successfully extracted data from document."
    });
}
