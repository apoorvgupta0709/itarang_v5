import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
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

const defaultPassword = 'password123';

const usersToCreate = [
    { email: 'ceo@itarang.com', name: 'Sanchit Gupta', role: 'ceo' },
    { email: 'business@itarang.com', name: 'Rajesh Kumar', role: 'business_head' },
    { email: 'sales.head@itarang.com', name: 'Priya Singh', role: 'sales_head' },
    { email: 'sales.manager@itarang.com', name: 'Amit Verma', role: 'sales_manager' },
    { email: 'sales.exec@itarang.com', name: 'Vikram Mehta', role: 'sales_executive' },
    { email: 'operations@itarang.com', name: 'Ops Manager', role: 'sales_order_manager' },
    { email: 'finance@itarang.com', name: 'Finance Lead', role: 'finance_controller' },
    { email: 'inventory@itarang.com', name: 'Suresh Raina', role: 'inventory_manager' },
    { email: 'service@itarang.com', name: 'Service Engineer', role: 'service_engineer' },
];

async function setupAllUsers() {
    console.log('🚀 Starting Auth user setup...');

    for (const user of usersToCreate) {
        try {
            console.log(`\nProcessing: ${user.email} (${user.role})`);

            // 1. Create or update auth.users record
            const { data, error: authError } = await supabase.auth.admin.createUser({
                email: user.email,
                password: defaultPassword,
                email_confirm: true,
                user_metadata: { name: user.name }
            });

            if (authError) {
                if (authError.message.includes('already has been registered')) {
                    console.log(`  - Auth user already exists. Fetching existing user...`);
                    const { data: listData } = await supabase.auth.admin.listUsers();
                    const existingUser = listData.users.find(u => u.email === user.email);

                    if (existingUser) {
                        console.log(`  - Found existing ID: ${existingUser.id}`);
                        await updatePublicUser(existingUser.id, user.email);
                    }
                } else {
                    console.error(`  - Error: ${authError.message}`);
                }
                continue;
            }

            console.log(`  - Registered new Auth user: ${data.user.id}`);
            await updatePublicUser(data.user.id, user.email);

        } catch (err) {
            console.error(`  - Unexpected error for ${user.email}:`, err);
        }
    }

    console.log('\n✅ All users processed.');
}

async function updatePublicUser(authId: string, email: string) {
    // We do this via SQL or direct DB update. 
    // Since we have the service role key, we could use supabase.from('users').update()
    const { error: dbError } = await supabase
        .from('users')
        .update({ id: authId })
        .eq('email', email);

    if (dbError) {
        console.error(`  - Error linking to public.users: ${dbError.message}`);
        // If the update fails due to foreign keys, we output the SQL as a fallback
        console.log(`  - Manual SQL Fallback: UPDATE public.users SET id = '${authId}' WHERE email = '${email}';`);
    } else {
        console.log(`  - Successfully linked to public.users`);
    }
}

setupAllUsers();
