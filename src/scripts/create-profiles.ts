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

// User credentials and their expected profiles
const TEST_USERS = [
    { email: 'patient01@example.com', password: 'password123', token_alias: 'PATIENT-01', role: 'member', service_type: 'PT_BLUE' },
    { email: 'docmh@example.com', password: 'password123', token_alias: 'DOC-MH', role: 'provider', service_type: 'MH_GREEN' },
    { email: 'admin@example.com', password: 'password123', token_alias: 'COMMAND-01', role: 'admin', service_type: 'ALL' },
];

async function createProfiles() {
    console.log('=== CREATING USER PROFILES WITH CORRECT IDS ===\n');

    // First, clear the old users table entries that have wrong IDs
    console.log('Cleaning up old entries...');
    const { error: deleteError } = await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteError) {
        console.log(`Note: ${deleteError.message}`);
    }

    for (const testUser of TEST_USERS) {
        console.log(`\nProcessing: ${testUser.email}`);

        // Sign in to get the user ID
        const { data, error } = await supabase.auth.signInWithPassword({
            email: testUser.email,
            password: testUser.password
        });

        if (error) {
            console.log(`  ✗ Login failed: ${error.message}`);
            continue;
        }

        if (!data.user) {
            console.log(`  ✗ No user returned`);
            continue;
        }

        const userId = data.user.id;
        console.log(`  ✓ Got user ID: ${userId}`);

        // Create/update profile in public.users with the CORRECT ID
        const { error: upsertError } = await supabase
            .from('users')
            .upsert({
                id: userId,
                token_alias: testUser.token_alias,
                role: testUser.role,
                service_type: testUser.service_type,
                status: 'active'
            });

        if (upsertError) {
            console.log(`  ✗ Profile error: ${upsertError.message}`);
        } else {
            console.log(`  ✓ Profile created: ${testUser.token_alias} (${testUser.role})`);
        }

        // Sign out
        await supabase.auth.signOut();
    }

    console.log('\n=== DONE ===');

    // Show final state
    const { data: finalUsers } = await supabase.from('users').select('id, token_alias, role');
    console.log('\nFinal users table:');
    finalUsers?.forEach(u => console.log(`  ${u.token_alias} | ${u.role} | ID: ${u.id.substring(0, 8)}...`));
}

createProfiles();
