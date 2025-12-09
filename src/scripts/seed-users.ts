import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env from current working directory
dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; // Use Service Key

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials (URL or Service Role Key)');
    process.exit(1);
}

// Create client with Service Key to bypass RLS and Auth restrictions
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const TEST_USERS = [
    { email: 'patient01@example.com', password: 'password123', role: 'member', token_alias: 'PATIENT-01', service_type: 'PT_BLUE' },
    { email: 'docmh@example.com', password: 'password123', role: 'provider', token_alias: 'DOC-MH', service_type: 'MH_GREEN' },
    { email: 'admin@example.com', password: 'password123', role: 'admin', token_alias: 'COMMAND-01', service_type: 'ALL' },
];

async function seed() {
    console.log('Seeding users with Service Role Key...');

    for (const u of TEST_USERS) {
        console.log(`Processing ${u.email}...`);

        let userId: string | undefined;

        // 1. Admin Create User (Bypasses email confirmation)
        const { data: userData, error: userError } = await supabase.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true // Auto-confirm
        });

        if (userError) {
            console.log(`Note for ${u.email}: ${userError.message}`);
            // If already exists, we need to fetch ID
            if (userError.message.includes('already registered') || userError.message.includes('unique constraint')) {
                // Admin get user by email is only possible if we list users or maybe just proceed
                // We can't easily "get" user by email via admin API without listing all... 
                // BUT we can use the Service Key to just query the profile if it exists, OR try to Query auth.users via Rpc? No.
                // Simplest: Just try to upsert the profile. If the user exists in Auth, they have an ID.
                // We can't get the ID easily if we can't login or search. 
                // Let's try to list users by email?
                const { data: listData } = await supabase.auth.admin.listUsers();
                const found = listData.users.find(x => x.email === u.email);
                if (found) userId = found.id;
            }
        } else {
            userId = userData.user.id;
        }

        if (!userId) {
            console.error(`Could not obtain User ID for ${u.email} - skipping profile creation.`);
            continue;
        }

        console.log(`User ID: ${userId}`);

        // 2. Upsert into 'users' table using Service Role (Bypasses RLS)
        const { error: dbError } = await supabase
            .from('users')
            .upsert({
                id: userId,
                token_alias: u.token_alias,
                role: u.role,
                service_type: u.service_type,
                status: 'active'
            });

        if (dbError) {
            console.error(`Error inserting details for ${u.email}:`, dbError.message);
        } else {
            console.log(`Successfully seeded ${u.email} (${u.role})`);
        }
    }
}

seed();
