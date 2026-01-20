import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function testDrizzle() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL is not set');
        return;
    }

    console.log(`Testing Drizzle with URL: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);

    const queryClient = postgres(connectionString, {
        ssl: 'require',
        prepare: false,
    });
    const db = drizzle(queryClient, { schema });

    try {
        const userId = 'fc571565-a161-476e-82e4-1f30a4178f1b';
        console.log(`Querying user: ${userId}`);
        const result = await db.select()
            .from(schema.users)
            .where(eq(schema.users.id, userId))
            .limit(1);

        console.log('✅✅✅ DRIZZLE QUERY SUCCESS! ✅✅✅');
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (err: any) {
        console.error('❌ Failed:', err.message);
        console.error('Full Error:', err);
    } finally {
        await queryClient.end();
    }
}

testDrizzle();
