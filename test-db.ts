import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import postgres from 'postgres';

async function testConnection() {
    const projectRef = 'vfefaofazapbfuxavxrp';
    const password = 'MYsupabase%402026';
    const dbName = 'postgres';
    const host = `db.${projectRef}.supabase.co`;

    // Direct Connection (IPv6)
    const url = `postgresql://postgres:${password}@${host}:5432/${dbName}?sslmode=require`;

    console.log(`Testing Direct Connection (IPv6) to: ${host}`);
    console.log(`URL: ${url.replace(password, '****')}`);

    const sql = postgres(url, { ssl: 'require', prepare: false, connect_timeout: 10 });

    try {
        const result = await sql`SELECT "id", "email" FROM "users" LIMIT 1`;
        console.log('✅✅✅ DIRECT CONNECTION SUCCESS! ✅✅✅');
        console.log('Result:', JSON.stringify(result, null, 2));
        console.log('\n!!! USE THIS URL FORMAT IN .env.local !!!');
    } catch (err: any) {
        console.error('❌ Failed:', err.message);
        console.error('Code:', err.code);
        if (err.message.includes('EFATAL') || err.message.includes('ECONNREFUSED')) {
            console.log('User likely relies on IPv4-only network -> MUST use pooler.');
        }
    } finally {
        await sql.end();
    }
}

testConnection();
