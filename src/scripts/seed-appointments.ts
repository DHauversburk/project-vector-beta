import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedAppointments() {
    console.log('Seeding appointments...');

    // 1. Get Providers
    const { data: providers, error: providerError } = await supabase
        .from('users')
        .select('id, token_alias')
        .eq('role', 'provider');

    if (providerError || !providers || providers.length === 0) {
        console.error('Error fetching providers or no providers found:', providerError);
        return;
    }

    console.log(`Found ${providers.length} providers.`);

    // 2. Get Members
    const { data: members, error: memberError } = await supabase
        .from('users')
        .select('id, token_alias')
        .eq('role', 'member');

    if (memberError || !members || members.length === 0) {
        console.error('Error fetching members or no members found:', memberError);
        return;
    }

    console.log(`Found ${members.length} members.`);

    // 3. Create Appointments
    const appointments = [
        // Past appointment
        {
            provider_id: providers[0].id,
            member_id: members[0].id,
            start_time: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            end_time: new Date(Date.now() - 86400000 + 3600000).toISOString(),
            status: 'completed',
            notes: 'Routine checkup'
        },
        // Future appointment (confirmed)
        {
            provider_id: providers[0].id,
            member_id: members[0].id,
            start_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            end_time: new Date(Date.now() + 86400000 + 3600000).toISOString(),
            status: 'confirmed',
            notes: 'Follow-up'
        },
        // Future appointment (pending)
        {
            provider_id: providers[0].id,
            member_id: members[0].id,
            start_time: new Date(Date.now() + 172800000).toISOString(), // 2 days from now
            end_time: new Date(Date.now() + 172800000 + 3600000).toISOString(),
            status: 'pending',
            notes: 'New issue'
        }
    ];

    const { error: seedError } = await supabase
        .from('appointments')
        .insert(appointments);

    if (seedError) {
        console.error('Error seeding appointments:', seedError);
    } else {
        console.log('Appointments seeded successfully.');
    }
}

seedAppointments();
