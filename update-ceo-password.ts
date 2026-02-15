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

const TARGET_EMAIL = 'ceo@itarang.com';
const NEW_PASSWORD = 'password@123';

async function updatePassword() {
    console.log(`🚀 Updating password for ${TARGET_EMAIL}...`);

    try {
        // 1. Find user by email
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            throw new Error(`Error listing users: ${listError.message}`);
        }

        const user = users.find(u => u.email === TARGET_EMAIL);

        if (!user) {
            throw new Error(`User with email ${TARGET_EMAIL} not found.`);
        }

        console.log(`  - Found user ID: ${user.id}`);

        // 2. Update password
        const { data, error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: NEW_PASSWORD }
        );

        if (updateError) {
            throw new Error(`Error updating password: ${updateError.message}`);
        }

        console.log(`✅ Successfully updated password for ${TARGET_EMAIL}.`);
    } catch (err) {
        console.error(`❌ Failed to update password:`, err);
        process.exit(1);
    }
}

updatePassword();
