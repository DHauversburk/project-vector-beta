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

async function diagnose() {
    console.log('=== SUPABASE DIAGNOSTICS ===\n');

    // 1. List Auth Users
    console.log('1. AUTH USERS:');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error('   Error:', authError.message);
    } else {
        console.log(`   Found ${authUsers.users.length} users in auth.users:`);
        authUsers.users.forEach(u => {
            console.log(`   - ${u.email} (ID: ${u.id})`);
        });
    }

    // 2. Check users table
    console.log('\n2. PUBLIC USERS TABLE:');
    const { data: publicUsers, error: publicError } = await supabase
        .from('users')
        .select('*');
    if (publicError) {
        console.error('   Error:', publicError.message);
    } else {
        console.log(`   Found ${publicUsers.length} users in public.users:`);
        publicUsers.forEach(u => {
            console.log(`   - ${u.token_alias} | Role: ${u.role} | Status: ${u.status}`);
        });
    }

    // 3. Check appointments
    console.log('\n3. APPOINTMENTS TABLE:');
    const { data: appointments, error: apptError } = await supabase
        .from('appointments')
        .select('*')
        .limit(5);
    if (apptError) {
        console.error('   Error:', apptError.message);
    } else {
        console.log(`   Found ${appointments.length} appointments (showing up to 5):`);
        appointments.forEach(a => {
            console.log(`   - ${a.id.substring(0, 8)}... | ${a.start_time} | Status: ${a.status}`);
        });
    }

    console.log('\n=== END DIAGNOSTICS ===');
}

diagnose();
