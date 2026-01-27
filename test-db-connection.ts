
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env vars
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function testConnection() {
    // 1. Test Direct Connection (5432)
    // Use the host from NEXT_PUBLIC_SUPABASE_URL subdomain essentially
    // But let's use the one from env if we parsed it, or hardcode based on project ref

    // Project Ref: eahydskawkcbhppnnvev
    // Password (assuming encoded in env): MYsupabase%402026 -> MYsupabase@2026

    const projectRef = 'eahydskawkcbhppnnvev';
    // Use the password exactly as valid in connection string (encoded)
    const passwordEncoded = 'MYsupabase%402026';

    const directUrl = `postgresql://postgres:${passwordEncoded}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`;

    console.log('\n--- Testing DIRECT Connection (5432) ---');
    console.log('URL:', directUrl.replace(/:[^:@]*@/, ':***@'));

    const sqlDirect = postgres(directUrl, { ssl: 'require', connect_timeout: 10 });

    try {
        const result = await sqlDirect`SELECT version()`;
        console.log('✓ Direct Connection Successful!');
        console.log('Version:', result[0].version);
    } catch (err) {
        console.error('✗ Direct Connection Failed:', err);
        if (typeof err === 'object' && err !== null && 'code' in err) {
            console.error('Error Code:', (err as any).code);
        }
    } finally {
        await sqlDirect.end();
    }

    // 2. Test Pooler Connection (6543)
    // Host: aws-0-ap-south-1.pooler.supabase.com
    // User: postgres.eahydskawkcbhppnnvev

    const poolerUrl = `postgresql://postgres.${projectRef}:${passwordEncoded}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require`;

    console.log('\n--- Testing POOLER Connection (6543) ---');
    console.log('URL:', poolerUrl.replace(/:[^:@]*@/, ':***@'));

    const sqlPooler = postgres(poolerUrl, { ssl: 'require', prepare: false, connect_timeout: 10 });

    try {
        const result = await sqlPooler`SELECT version()`;
        console.log('✓ Pooler Connection Successful!');
        console.log('Version:', result[0].version);
    } catch (err) {
        console.error('✗ Pooler Connection Failed:', err);
        if (typeof err === 'object' && err !== null && 'code' in err) {
            console.error('Error Code:', (err as any).code);
        }
    } finally {
        await sqlPooler.end();
    }
}

testConnection();
