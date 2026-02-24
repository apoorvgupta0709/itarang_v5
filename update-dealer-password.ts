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

const NEW_PASSWORD = 'password123';

async function updateDealerPasswords() {
    console.log(`🚀 Updating password for all dealers...`);

    try {
        // 1. Fetch dealers from the public profile table
        const { data: dealers, error: dbError } = await supabase
            .from('users')
            .select('id, email')
            .eq('role', 'dealer');

        if (dbError) {
            throw new Error(`Error fetching dealers: ${dbError.message}`);
        }

        if (!dealers || dealers.length === 0) {
            console.log(`No dealers found in the system.`);
            return;
        }

        console.log(`Found ${dealers.length} dealers. Updating passwords...`);

        // 2. Update password for each dealer in Supabase Auth
        for (const dealer of dealers) {
            if (!dealer.id) {
                console.warn(`Dealer ${dealer.email} does not have a linked auth ID.`);
                continue;
            }

            console.log(`  - Updating user ID: ${dealer.id} (${dealer.email})`);
            const { data, error: updateError } = await supabase.auth.admin.updateUserById(
                dealer.id,
                { password: NEW_PASSWORD }
            );

            if (updateError) {
                console.error(`    ❌ Error updating password for ${dealer.email}: ${updateError.message}`);
            } else {
                console.log(`    ✅ Successfully updated password for ${dealer.email}.`);
            }
        }

        console.log(`🎉 Finished updating dealer passwords.`);
    } catch (err) {
        console.error(`❌ Failed to update dealer passwords:`, err);
        process.exit(1);
    }
}

updateDealerPasswords();
