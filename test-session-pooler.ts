import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import postgres from 'postgres';

async function testSessionPooler() {
    const projectRef = 'vfefaofazapbfuxavxrp';
    const password = 'MYsupabase%402026';
    const host = 'aws-0-ap-southeast-2.pooler.supabase.com';
    const dbName = 'postgres';

    // Using port 5432 (Session Pooler)
    const url = `postgresql://postgres.${projectRef}:${password}@${host}:5432/${dbName}?sslmode=require`;

    console.log(`Testing Session Pooler Connection: ${url.replace(password, '****')}`);

    const sql = postgres(url, { ssl: 'require', prepare: false, connect_timeout: 10 });

    try {
        const result = await sql`SELECT "id", "email" FROM "users" LIMIT 1`;
        console.log('✅✅✅ SESSION POOLER CONNECTION SUCCESS! ✅✅✅');
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (err: any) {
        console.error('❌ Failed:', err.message);
        console.error('Code:', err.code);
        console.error('Full Error:', err);
    } finally {
        await sql.end();
    }
}

testSessionPooler();
