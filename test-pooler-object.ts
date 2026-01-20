import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import postgres from 'postgres';

async function testPoolerObject() {
    const projectRef = 'vfefaofazapbfuxavxrp';
    const password = 'MYsupabase@2026'; // Decoded
    const host = 'aws-0-ap-southeast-2.pooler.supabase.com';
    const dbName = 'postgres';

    console.log(`Testing Pooler Connection (Object Config) for project: ${projectRef}`);

    const sql = postgres({
        host,
        port: 6543,
        database: dbName,
        username: `postgres.${projectRef}`,
        password,
        ssl: 'require',
        prepare: false,
        connect_timeout: 10
    });

    try {
        const result = await sql`SELECT "id", "email" FROM "users" LIMIT 1`;
        console.log('✅✅✅ POOLER SUCCESS (Object)! ✅✅✅');
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (err: any) {
        console.error('❌ Failed:', err.message);
        console.error('Code:', err.code);
        console.error('Full Error:', err);
    } finally {
        await sql.end();
    }
}

testPoolerObject();
