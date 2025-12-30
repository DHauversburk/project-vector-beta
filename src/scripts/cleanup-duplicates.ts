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

async function cleanup() {
    console.log('=== CLEANUP DUPLICATES ===\n');

    // Get all users
    const { data: users, error } = await supabase.from('users').select('*');
    if (error) {
        console.error('Error fetching users:', error.message);
        return;
    }

    // Find duplicates by token_alias
    const seen = new Map<string, string>();
    const toDelete: string[] = [];

    for (const user of users) {
        if (seen.has(user.token_alias)) {
            // This is a duplicate - delete it
            toDelete.push(user.id);
            console.log(`Duplicate found: ${user.token_alias} (will delete ID: ${user.id})`);
        } else {
            seen.set(user.token_alias, user.id);
        }
    }

    if (toDelete.length === 0) {
        console.log('No duplicates found!');
        return;
    }

    // Delete duplicates
    for (const id of toDelete) {
        const { error: delError } = await supabase.from('users').delete().eq('id', id);
        if (delError) {
            console.error(`Error deleting ${id}:`, delError.message);
        } else {
            console.log(`Deleted: ${id}`);
        }
    }

    console.log(`\nCleanup complete. Removed ${toDelete.length} duplicates.`);

    // Show final state
    const { data: finalUsers } = await supabase.from('users').select('token_alias, role, status');
    console.log('\nFinal users:');
    finalUsers?.forEach(u => console.log(`  - ${u.token_alias} | ${u.role}`));
}

cleanup();
