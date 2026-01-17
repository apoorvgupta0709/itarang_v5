import { z } from 'zod';
import { db } from '@/lib/db';
import { inventory, productCatalog } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';
import { successResponse, withErrorHandler, generateId } from '@/lib/api-utils';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const inventoryRowSchema = z.object({
    hsn_code: z.string().regex(/^[0-9]{8}$/),
    serial_number: z.string().optional(),
    is_serialized: z.string().transform(v => v.toLowerCase() === 'true' || v === '1'),
    inventory_amount: z.coerce.number().positive(),
    gst_percent: z.coerce.number().refine(v => [5, 18].includes(v)),
});

export const POST = withErrorHandler(async (req: Request) => {
    const user = await requireAuth();
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
        throw new Error('No file uploaded');
    }

    const buffer = await file.arrayBuffer();
    let rows: any[] = [];

    if (file.name.endsWith('.csv')) {
        const text = new TextDecoder().decode(buffer);
        rows = Papa.parse(text, { header: true, skipEmptyLines: true }).data;
    } else {
        const workbook = XLSX.read(buffer);
        rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    }

    const results = { success: [] as any[], errors: [] as any[] };

    for (let i = 0; i < rows.length; i++) {
        try {
            const row = rows[i];
            const validated = inventoryRowSchema.parse(row);

            if (validated.is_serialized && !validated.serial_number) {
                throw new Error('Serial number required for serialized items');
            }

            // Check product exists
            const product = await db.query.productCatalog.findFirst({
                where: eq(productCatalog.hsn_code, validated.hsn_code),
            });
            if (!product) throw new Error(`Product with HSN ${validated.hsn_code} not found in catalog`);

            // Calculate amounts
            const gst_amount = validated.inventory_amount * (validated.gst_percent / 100);
            const final_amount = validated.inventory_amount + gst_amount;

            // Insert
            const [created] = await db.insert(inventory).values({
                id: await generateId('INV', inventory),
                product_id: product.id,
                serial_number: validated.serial_number,
                is_serialized: validated.is_serialized,
                inventory_amount: validated.inventory_amount.toString(),
                gst_percent: validated.gst_percent,
                gst_amount: gst_amount.toString(),
                final_amount: final_amount.toString(),
                status: 'available',
                uploaded_by: user.id,
            }).returning();

            results.success.push({ row: i + 2, id: created.id });
        } catch (error: any) {
            results.errors.push({ row: i + 2, error: error.message });
        }
    }

    return successResponse(results);
});
