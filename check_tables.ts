import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { db } from './src/lib/db';
import { users, deals, leads, inventory, orders } from './src/lib/db/schema';
import { count } from 'drizzle-orm';

async function checkTables() {
    try {
        const tables = [
            { name: 'users', schema: users },
            { name: 'deals', schema: deals },
            { name: 'leads', schema: leads },
            { name: 'inventory', schema: inventory },
            { name: 'orders', schema: orders },
        ];

        console.log('--- Database Table Check ---');
        for (const table of tables) {
            try {
                const [result] = await db.select({ value: count() }).from(table.schema);
                console.log(`✅ Table "${table.name}" exists. Count: ${result.value}`);
            } catch (err: any) {
                console.error(`❌ Table "${table.name}" error: ${err.message}`);
            }
        }
    } catch (err: any) {
        console.error('Unexpected error:', err);
    } finally {
        process.exit();
    }
}

checkTables();
