
const postgres = require('postgres');

async function test() {
    const ref = 'vfefaofazapbfuxavxrp';
    const pass = 'invalid_password_test';
    const host = 'aws-0-ap-southeast-2.pooler.supabase.com';

    console.log('Testing connection to ANOTHER project (Syd) to verify format');
    const url = `postgresql://postgres.${ref}:${pass}@${host}:5432/postgres?sslmode=require`;

    console.log('URL:', url.replace(/:[^:@]+@/, ':****@'));

    const sql = postgres(url, { connect_timeout: 10 });

    try {
        const result = await sql`SELECT 1 as connected`;
        console.log('✅ Success! (Wait, how?)');
    } catch (err) {
        console.log('Got error:', err.message);
    } finally {
        await sql.end();
    }
}

test();
