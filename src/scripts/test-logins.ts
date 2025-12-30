import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// User credentials to test
const TEST_USERS = [
    { email: 'patient01@example.com', password: 'password123' },
    { email: 'docmh@example.com', password: 'password123' },
    { email: 'admin@example.com', password: 'password123' },
];

async function testLogins() {
    console.log('=== TESTING USER LOGINS ===\n');

    for (const testUser of TEST_USERS) {
        console.log(`\nTesting: ${testUser.email}`);

        // Try to sign in
        const { data, error } = await supabase.auth.signInWithPassword({
            email: testUser.email,
            password: testUser.password
        });

        if (error) {
            console.log(`  ✗ Login failed: ${error.message}`);
        } else if (data.user) {
            console.log(`  ✓ Login success! User ID: ${data.user.id}`);

            // Now check if this ID exists in public.users
            const { data: profileData, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (profileError) {
                console.log(`  ✗ Profile NOT found: ${profileError.message}`);
                console.log(`    → Need to create profile with ID: ${data.user.id}`);
            } else {
                console.log(`  ✓ Profile found: ${profileData.token_alias} (${profileData.role})`);
            }

            // Sign out
            await supabase.auth.signOut();
        }
    }

    console.log('\n=== TEST COMPLETE ===');
}

testLogins();
