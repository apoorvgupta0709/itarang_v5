import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import postgres from 'postgres';

async function testPoolerExplicitOptions() {
    const projectRef = 'vfefaofazapbfuxavxrp';
    const password = 'MYsupabase%402026';
    const host = 'aws-0-ap-southeast-2.pooler.supabase.com';
    const dbName = 'postgres';

    // Connection string WITHOUT options
    const url = `postgresql://postgres:${password}@${host}:6543/${dbName}?sslmode=require`;

    console.log(`Testing Pooler Connection (Explicit Options Object): ${url.replace(password, '****')}`);

    const sql = postgres(url, {
        ssl: 'require',
        prepare: false,
        connect_timeout: 10,
        options: {
            project: projectRef
        }
    });

    try {
        const result = await sql`SELECT "id", "email" FROM "users" LIMIT 1`;
        console.log('✅✅✅ POOLER SUCCESS (Explicit Options)! ✅✅✅');
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (err: any) {
        console.error('❌ Failed:', err.message);
        console.error('Code:', err.code);
        console.error('Full Error:', err);
    } finally {
        await sql.end();
    }
}

testPoolerExplicitOptions();
