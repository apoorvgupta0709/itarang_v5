import postgres from 'postgres';

const DATABASE_URL = "postgresql://postgres:MYsupabase%402026@db.eahydskawkcbhppnnvev.supabase.co:5432/postgres?sslmode=require";

async function verifyAllQueries() {
    const sql = postgres(DATABASE_URL);
    try {
        console.log('--- Verifying CEO Dashboard Queries ---');

        // 1. Revenue MTD (deals)
        // Table 'deals' usually has 'total_payable' based on previous route.ts code
        try {
            const result = await sql`SELECT SUM(total_payable) as revenue FROM deals`;
            console.log(`✅ Query 1 (deals.total_payable): Success. Value=${result[0].revenue}`);
        } catch (err: any) {
            console.error(`❌ Query 1 (deals.total_payable) Failed: ${err.message}`);
        }

        // 2. Conversion Rate (leads)
        try {
            const result = await sql`SELECT COUNT(*) as total FROM leads`;
            console.log(`✅ Query 2 (leads.count): Success. Count=${result[0].total}`);
        } catch (err: any) {
            console.error(`❌ Query 2 (leads.count) Failed: ${err.message}`);
        }

        // 3. Inventory Value (inventory)
        try {
            const result = await sql`SELECT SUM(final_amount) as value FROM inventory`;
            console.log(`✅ Query 3 (inventory.final_amount): Success. Value=${result[0].value}`);
        } catch (err: any) {
            console.error(`❌ Query 3 (inventory.final_amount) Failed: ${err.message}`);
        }

        // 4. Outstanding Credits (orders) - THE FIXED ONE
        try {
            const result = await sql`SELECT SUM(total_amount) as credits FROM orders`;
            console.log(`✅ Query 4 (orders.total_amount): Success. Value=${result[0].credits}`);
        } catch (err: any) {
            console.error(`❌ Query 4 (orders.total_amount) Failed: ${err.message}`);
        }

    } catch (err: any) {
        console.error('Unexpected error:', err.message);
    } finally {
        await sql.end();
        process.exit();
    }
}

verifyAllQueries();
