import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import postgres from 'postgres';

async function testPoolerIPv4() {
    const projectRef = 'vfefaofazapbfuxavxrp';
    const password = 'MYsupabase%402026';
    const host = '13.237.241.81'; // One of the IPv4 addresses for the pooler
    const dbName = 'postgres';

    // Testing IPv4 host
    const url = `postgresql://postgres.${projectRef}:${password}@${host}:6543/${dbName}?sslmode=require`;

    console.log(`Testing Pooler Connection (IPv4): ${url.replace(password, '****')}`);

    const sql = postgres(url, { ssl: 'require', prepare: false, connect_timeout: 10 });

    try {
        const result = await sql`SELECT "id", "email" FROM "users" LIMIT 1`;
        console.log('✅✅✅ POOLER SUCCESS (IPv4)! ✅✅✅');
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (err: any) {
        console.error('❌ Failed:', err.message);
        console.error('Code:', err.code);
        console.error('Full Error:', err);
    } finally {
        await sql.end();
    }
}

testPoolerIPv4();
