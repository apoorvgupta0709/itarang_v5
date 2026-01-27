import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env.local') });

import { sql } from 'drizzle-orm';

async function main() {
    const { db } = await import('./src/lib/db');
    try {
        const result = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'bolna_calls'
        `);
        console.log('--- BOLNA_CALLS SCHEMA ---');
        console.table(result);
    } catch (err) {
        console.error('Failed to query bolna_calls schema:', err);
    }
    process.exit(0);
}

main();
