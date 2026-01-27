
import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env.local') });

import { db } from './src/lib/db/index.ts';
import { sql } from 'drizzle-orm';

async function diagnose() {
    console.log('🔍 Diagnosing Database Connection...');
    console.log(`Endpoint: ${process.env.DATABASE_URL?.split('@')[1]}`);

    try {
        const start = Date.now();
        const result = await db.execute(sql`SELECT 1 as connected, now() as db_time`);
        const end = Date.now();

        console.log('✅ Connection Successful!');
        console.log(`Latency: ${end - start}ms`);
        console.table(result);

        // Check if pooler is restricting schema changes
        console.log('\n🛠 Checking schema capabilities...');
        try {
            await db.execute(sql`CREATE TEMP TABLE connection_test (id int)`);
            console.log('✅ Temporary table creation: OK');
            await db.execute(sql`DROP TABLE connection_test`);
        } catch (e) {
            console.log('❌ Temporary table creation: FAILED (Pooler might be in Transaction mode)');
        }

    } catch (err) {
        console.error('❌ Connection Failed:', err);
    }
    process.exit(0);
}

diagnose();
