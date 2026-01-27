
const postgres = require('postgres');

async function test() {
    const ref = 'eahydskawkcbhppnnvev';
    const pass = 'MYsupabase%402026';
    const host = 'aws-0-ap-south-1.pooler.supabase.com';

    console.log('Testing connection with supavisor_session_id');
    const url = `postgresql://postgres.${ref}:${pass}@${host}:5432/postgres?sslmode=require&supavisor_session_id=test123456`;

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
