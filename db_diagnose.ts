import postgres from 'postgres';

const DATABASE_URL = "postgresql://postgres:MYsupabase%402026@db.eahydskawkcbhppnnvev.supabase.co:5432/postgres?sslmode=require";

async function diagnose() {
    const sql = postgres(DATABASE_URL);
    try {
        console.log('--- Database Diagnosis ---');

        // Check users table
        const usersCount = await sql`SELECT count(*) FROM users`;
        console.log(`✅ Table "users" exists. Count: ${usersCount[0].count}`);

        // Find CEO user
        const ceo = await sql`SELECT * FROM users WHERE email = 'ceo@itarang.com'`;
        if (ceo.length > 0) {
            console.log(`✅ CEO user found: id=${ceo[0].id}, role=${ceo[0].role}`);
        } else {
            console.error(`❌ CEO user not found in public.users table!`);
        }

        // Check other tables
        const tables = ['deals', 'leads', 'inventory', 'orders'];
        for (const table of tables) {
            try {
                const count = await sql`SELECT count(*) FROM ${sql(table)}`;
                console.log(`✅ Table "${table}" exists. Count: ${count[0].count}`);
            } catch (err: any) {
                console.error(`❌ Table "${table}" error: ${err.message}`);
            }
        }

    } catch (err: any) {
        console.error('Unexpected error:', err.message);
    } finally {
        await sql.end();
        process.exit();
    }
}

diagnose();
