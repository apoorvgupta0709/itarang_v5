
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/lib/db/schema';
import { users } from './src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function test() {
    console.log('--- DB Connection Test ---');
    const connectionString = process.env.DATABASE_URL;
    console.log('DATABASE_URL:', connectionString ? connectionString.replace(/:[^:@]+@/, ':****@') : 'MISSING');

    if (!connectionString || connectionString.includes('[PASSWORD]')) {
        console.error('ERROR: DATABASE_URL is missing or contains placeholder [PASSWORD]');
        return;
    }

    const queryClient = postgres(connectionString);
    const db = drizzle(queryClient, { schema });

    try {
        console.log('Executing basic select on public.users...');
        const result = await db.select().from(users).where(eq(users.role, 'ceo')).limit(1);
        console.log('Success:', result);
    } catch (err) {
        console.error('QUERY FAILED:', err);
    } finally {
        await queryClient.end();
    }
}

test();
