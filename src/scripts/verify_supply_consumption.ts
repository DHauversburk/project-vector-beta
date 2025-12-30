import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runVerification() {
    console.log("--- Starting Supply Consumption Verification ---");

    // 1. Get a Provider (Supply Creator)
    const { data: providers } = await supabase.from('users').select('id').eq('role', 'provider').limit(1);
    const providerId = providers?.[0]?.id;
    if (!providerId) { console.error("No provider found"); return; }

    // 2. Find an Open Slot (Supply)
    // We expect slots from previous generator test. If none, create one.
    let { data: slots } = await supabase.from('appointments')
        .select('*')
        .eq('provider_id', providerId)
        .is('member_id', null) // Open
        .limit(1);

    let slotId = slots?.[0]?.id;

    if (!slotId) {
        console.log("No open slots found. Creating one for test...");
        const { data: newSlot } = await supabase.from('appointments').insert({
            provider_id: providerId,
            start_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            end_time: new Date(Date.now() + 86400000 + 1800000).toISOString(),
            status: 'pending',
            member_id: null
        }).select().single();
        slotId = newSlot.id;
        console.log("Created Test Supply Slot:", slotId);
    } else {
        console.log("Found Existing Open Slot:", slotId);
    }

    // 3. Get a Member (Consumer)
    const { data: members } = await supabase.from('users').select('id').eq('role', 'member').limit(1);
    const memberId = members?.[0]?.id;
    if (!memberId) { console.error("No member found"); return; }
    console.log("Member Consumer:", memberId);

    // 4. Consume/Claim the Slot (Simulate api.bookSlot)
    // IMPORTANT: This mimics the RLS policy "Members can book open slots"
    console.log("Attempting to CLAIM slot...");

    const { data: claimedSlot, error } = await supabase
        .from('appointments')
        .update({
            member_id: memberId,
            status: 'confirmed',     // Auto-confirm or pending depending on logic? Dashboard sets 'confirmed'.
            is_booked: true,
            notes: 'Verification Claim'
        })
        .eq('id', slotId)
        .is('member_id', null) // Ensure concurrency safety
        .select()
        .single();

    if (error) {
        console.error("❌ CLAIM FAILED:", error);
    } else {
        console.log("✅ CLAIM SUCCESS:", claimedSlot);
        console.log(`Slot ${claimedSlot.id} is now owned by ${claimedSlot.member_id}`);
    }

    // 5. Verify it's no longer "Open"
    const { data: check } = await supabase.from('appointments').select('*').eq('id', slotId).single();
    if (check.member_id === memberId && check.is_booked === true) {
        console.log("Verification PASSED: Supply Consumption logic holds.");
    } else {
        console.error("Verification FAILED: DB state mismatch.");
    }
}

runVerification();
