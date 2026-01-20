import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
    try {
        const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('Existing tables:', result.map(r => r.table_name));
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
