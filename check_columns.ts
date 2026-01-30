import postgres from 'postgres';

const DATABASE_URL = "postgresql://postgres:MYsupabase%402026@db.eahydskawkcbhppnnvev.supabase.co:5432/postgres?sslmode=require";

async function checkColumns() {
    const sql = postgres(DATABASE_URL);
    try {
        console.log('--- Orders Table Columns ---');
        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'orders'
        `;
        columns.forEach(col => {
            console.log(`- ${col.column_name} (${col.data_type})`);
        });

    } catch (err: any) {
        console.error('Unexpected error:', err.message);
    } finally {
        await sql.end();
        process.exit();
    }
}

checkColumns();
