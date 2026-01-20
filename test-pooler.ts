import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import postgres from 'postgres';

async function testPooler() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('DATABASE_URL not found in .env.local');
        return;
    }

    console.log(`Testing Pooler Connection (Raw URL): ${url.replace(/:[^:@]+@/, ':****@')}`);

    const sql = postgres(url, { ssl: 'require', prepare: false, connect_timeout: 10 });

    try {
        const result = await sql`SELECT "id", "email" FROM "users" LIMIT 1`;
        console.log('✅✅✅ POOLER CONNECTION SUCCESS! ✅✅✅');
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (err: any) {
        console.error('❌ Failed:', err.message);
        console.error('Code:', err.code);
        console.error('Full Error:', err);
    } finally {
        await sql.end();
    }
}

testPooler();
