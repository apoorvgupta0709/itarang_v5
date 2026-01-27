
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials in .env.local');
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function syncCEO() {
    // Dynamic imports to ensure env vars are loaded
    const { db } = await import('./src/lib/db');
    const { users } = await import('./src/lib/db/schema');
    const { eq, sql } = await import('drizzle-orm');

    console.log('Fetching CEO user from Auth...');
    // 1. Get Auth User
    const { data: { users: authUsers }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    const ceoUser = authUsers.find(u => u.email === 'ceo@itarang.com');

    if (!ceoUser) {
        console.error('CEO user not found in Supabase Auth!');
        return;
    }

    console.log(`Found Auth User: ${ceoUser.id} (${ceoUser.email})`);

    // 2. Update DB
    console.log('Updating public.users table...');

    try {
        // Check if user exists in public.users with this email
        const existing = await db.select().from(users).where(eq(users.email, 'ceo@itarang.com'));

        if (existing.length === 0) {
            console.log('User not found in public.users, creating...');
            await db.insert(users).values({
                id: ceoUser.id,
                email: 'ceo@itarang.com',
                name: 'Sanchit Gupta',
                role: 'ceo',
                created_at: new Date(),
                updated_at: new Date()
            });
        } else {
            console.log(`User found in public.users (ID: ${existing[0].id}). Updating ID to match Auth...`);

            // Only update if IDs match or do not match, but we want to Force sync.
            // If they are different, we update the ID.
            if (existing[0].id !== ceoUser.id) {
                await db.execute(sql`
                    UPDATE users 
                    SET id = ${ceoUser.id}, role = 'ceo' 
                    WHERE email = 'ceo@itarang.com'
                `);
                console.log('Updated ID and role.');

            } else {
                await db.update(users)
                    .set({ role: 'ceo' })
                    .where(eq(users.email, 'ceo@itarang.com'));
                console.log('ID matches. Ensured role is ceo.');
            }
        }

        console.log('✓ Successfully synced CEO user!');

    } catch (dbErr) {
        console.error('Database error:', dbErr);
        process.exit(1);
    }
}

syncCEO();
