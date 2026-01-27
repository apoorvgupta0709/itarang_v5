
const postgres = require('postgres');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

async function test() {
    const ref = 'eahydskawkcbhppnnvev';
    const pass = 'MYsupabase@2026'; // Plaintext
    const host = 'aws-0-ap-south-1.pooler.supabase.com';

    console.log('Testing connection with configuration object');
    console.log('Host:', host);
    console.log('User:', `postgres.${ref}`);

    const sql = postgres({
        host: host,
        port: 5432,
        database: 'postgres',
        username: `postgres.${ref}`,
        password: pass,
        ssl: 'require',
        connect_timeout: 10
    });

    try {
        const result = await sql`SELECT 1 as connected`;
        console.log('✅ Success!');
        console.log(result);
    } catch (err) {
        console.error('❌ Failed:', err.message);
        if (err.stack) console.error(err.stack);
    } finally {
        await sql.end();
    }
}

test();
