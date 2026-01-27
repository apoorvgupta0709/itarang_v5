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

async function createCEOUser() {
    try {
        // Create or update auth.users record using Admin API
        const { data, error } = await supabase.auth.admin.createUser({
            email: 'ceo@itarang.com',
            password: 'password123',
            email_confirm: true,
            user_metadata: {
                name: 'Sanchit Gupta'
            }
        });

        if (error) {
            console.error('Error creating user:', error);
            return;
        }

        console.log('✓ Successfully created Auth user:', data.user);
        console.log('  - User ID:', data.user.id);
        console.log('  - Email:', data.user.email);
        console.log('  - Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');

        // Now update public.users to use the same UUID
        console.log('\nPlease run this SQL to update public.users:');
        console.log(`UPDATE users SET id = '${data.user.id}' WHERE email = 'ceo@itarang.com';`);

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

createCEOUser();
