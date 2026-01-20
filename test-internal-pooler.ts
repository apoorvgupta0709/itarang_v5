import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import postgres from 'postgres';

async function testInternalPooler() {
    const projectRef = 'vfefaofazapbfuxavxrp';
    const password = 'MYsupabase%402026';
    const host = `db.${projectRef}.supabase.co`;
    const dbName = 'postgres';

    // Testing port 6543 on the main host
    const url = `postgresql://postgres:${password}@${host}:6543/${dbName}?sslmode=require`;

    console.log(`Testing Internal Pooler Connection: ${url.replace(password, '****')}`);

    const sql = postgres(url, { ssl: 'require', prepare: false, connect_timeout: 10 });

    try {
        const result = await sql`SELECT "id", "email" FROM "users" LIMIT 1`;
        console.log('✅✅✅ INTERNAL POOLER SUCCESS! ✅✅✅');
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (err: any) {
        console.error('❌ Failed:', err.message);
        console.error('Code:', err.code);
        console.error('Full Error:', err);
    } finally {
        await sql.end();
    }
}

testInternalPooler();
