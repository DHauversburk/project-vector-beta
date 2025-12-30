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

async function syncUsers() {
    console.log('=== SYNC AUTH USERS WITH PUBLIC USERS TABLE ===\n');

    // 1. Get all auth users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error('Error listing auth users:', authError.message);
        return;
    }

    console.log(`Found ${authData.users.length} users in auth.users:\n`);

    for (const authUser of authData.users) {
        console.log(`Processing: ${authUser.email} (ID: ${authUser.id})`);

        // Map email to role and token_alias
        let role = 'member';
        let token_alias = 'Unknown';
        let service_type = 'PT_BLUE';

        if (authUser.email?.includes('docmh') || authUser.email?.includes('provider')) {
            role = 'provider';
            token_alias = 'DOC-MH';
            service_type = 'MH_GREEN';
        } else if (authUser.email?.includes('admin') || authUser.email?.includes('command')) {
            role = 'admin';
            token_alias = 'COMMAND-01';
            service_type = 'ALL';
        } else if (authUser.email?.includes('patient01')) {
            role = 'member';
            token_alias = 'PATIENT-01';
            service_type = 'PT_BLUE';
        } else if (authUser.email?.includes('patient02')) {
            role = 'member';
            token_alias = 'PATIENT-02';
            service_type = 'PT_BLUE';
        } else if (authUser.email?.includes('sarah')) {
            role = 'member';
            token_alias = 'SARAH';
            service_type = 'PT_BLUE';
        }

        // Upsert into public.users table with matching ID
        const { error: upsertError } = await supabase
            .from('users')
            .upsert({
                id: authUser.id,  // USE THE AUTH USER ID
                token_alias,
                role,
                service_type,
                status: 'active'
            }, {
                onConflict: 'id'
            });

        if (upsertError) {
            console.error(`  Error upserting: ${upsertError.message}`);
        } else {
            console.log(`  ✓ Synced as ${role} (${token_alias})`);
        }
    }

    console.log('\n=== SYNC COMPLETE ===\n');

    // Show final state
    const { data: finalUsers } = await supabase.from('users').select('id, token_alias, role');
    console.log('Final users table:');
    finalUsers?.forEach(u => console.log(`  ${u.token_alias} | ${u.role} | ID: ${u.id}`));
}

syncUsers();
