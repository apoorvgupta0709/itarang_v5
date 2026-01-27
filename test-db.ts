import postgres from 'postgres';

async function testConnection() {
    const url = "postgresql://postgres.eahydskawkcbhppnnvev:MYsupabase%402026@3.111.105.85:6543/postgres?sslmode=require";
    console.log('Testing connection to:', url.replace(/:[^:@]+@/, ':****@'));

    const sql = postgres(url);

    try {
        const result = await sql`SELECT 1 as success`;
        console.log('✓ Connection successful:', result);
    } catch (err) {
        console.error('✗ Connection failed:', err);
    } finally {
        await sql.end();
    }
}

testConnection();
