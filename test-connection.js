
const postgres = require('postgres');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

async function test(url, label) {
    console.log(`--- Testing: ${label} ---`);
    console.log('URL:', url.replace(/:[^:@]+@/, ':****@'));

    const sql = postgres(url, { connect_timeout: 5 });

    try {
        const result = await sql`SELECT 1 as connected`;
        console.log('✅ Success!');
        console.log(result);
        return true;
    } catch (err) {
        console.error('❌ Failed:', err.message);
        return false;
    } finally {
        await sql.end();
    }
}

async function runAll() {
    const ref = 'eahydskawkcbhppnnvev';
    const pass = 'MYsupabase%402026';
    const host = 'aws-0-ap-south-1.pooler.supabase.com';

    const variations = [
        {
            label: 'Standard Pooler (5432, db=postgres)',
            url: `postgresql://postgres.${ref}:${pass}@${host}:5432/postgres?sslmode=require`
        },
        {
            label: 'Pooler (6543, db=postgres)',
            url: `postgresql://postgres.${ref}:${pass}@${host}:6543/postgres?sslmode=require`
        },
        {
            label: 'Pooler (5432, db=ref)',
            url: `postgresql://postgres.${ref}:${pass}@${host}:5432/${ref}?sslmode=require`
        },
        {
            label: 'Pooler (6543, db=ref)',
            url: `postgresql://postgres.${ref}:${pass}@${host}:6543/${ref}?sslmode=require`
        },
        {
            label: 'Pooler (5432, user=postgres, db=ref)',
            url: `postgresql://postgres:${pass}@${host}:5432/${ref}?sslmode=require`
        }
    ];

    for (const v of variations) {
        await test(v.url, v.label);
        console.log('\n');
    }
}

runAll();
