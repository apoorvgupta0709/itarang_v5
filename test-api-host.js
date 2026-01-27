
const postgres = require('postgres');

async function test() {
    const ref = 'eahydskawkcbhppnnvev';
    const pass = 'MYsupabase%402026';
    const host = `${ref}.supabase.co`; // API host that resolves!
    const url = `postgresql://postgres.${ref}:${pass}@${host}:6543/postgres?sslmode=require`;

    console.log('Testing connection to API host pooler:', host);
    console.log('URL:', url.replace(/:[^:@]+@/, ':****@'));

    const sql = postgres(url, { connect_timeout: 5 });

    try {
        const result = await sql`SELECT 1 as connected`;
        console.log('✅ Success!');
        console.log(result);
    } catch (err) {
        console.error('❌ Failed:', err.message);
    } finally {
        await sql.end();
    }
}

test();
