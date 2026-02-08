import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from './lib/api';
import { supabase } from './lib/supabase';

describe('Project Vector Core Logic Verification', () => {
    beforeEach(() => {
        // Reset mock store
        api.mockStore.appointments = [];
        api.mockStore.init = true; // Force init to true so logic works immediately
        /* 
           api.ts logic relies on 'init' to return mock data immediately.
           If init is false, getProviderOpenSlots might try to return [] first and lazy init.
           We'll manage it carefully.
        */
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it('Scenario 1: Provider blocks slot, Member sees it blocked', async () => {
        // 1. Login as Provider
        await supabase.auth.signInWithPassword({ email: 'jameson', password: 'password' });

        // Verify login
        const { data: { user } } = await supabase.auth.getUser();
        expect(user).toBeTruthy();
        expect(user!.email).toContain('jameson');

        // 2. Block 10:00 AM slot
        // "mock-slot-1" corresponds to 10am (9am + 1 hour) in getProviderOpenSlots logic
        const blocked = await api.toggleSlotBlock('mock-slot-1', true, 'Sick Leave');
        expect(blocked.status).toBe('blocked');

        // Verify it was added to store
        expect(api.mockStore.appointments).toHaveLength(1);

        // 3. Logout Provider
        await supabase.auth.signOut();

        // 4. Login as Member
        await supabase.auth.signInWithPassword({ email: 'ivan', password: 'password' });

        // 5. Get slots
        // We need to pass the provider ID. Mock defaults to 'mock-provider-jameson'
        const slots = await api.getProviderOpenSlots('mock-provider-jameson');

        // 6. Verify blocked slot is NOT in list
        // api.ts returns 4 slots: 0, 1, 2, 3.
        // blocked 'mock-slot-1' should result in it being filtered out.
        const slotIds = slots.map(s => s.id);

        console.log('Available Slots:', slotIds);

        expect(slotIds).not.toContain('mock-slot-1');
        expect(slotIds).toContain('mock-slot-0');
        expect(slotIds).toContain('mock-slot-2');
    });

    it('Scenario 2: Member books slot with Urgent Note, Provider sees badge', async () => {
        // 1. Login as Member
        await supabase.auth.signInWithPassword({ email: 'ivan', password: 'password' });

        // 2. Book 11am (slot 2) with Urgent Note
        // This simulates the outcome of rescheduling with a note, or booking new with a note.
        await api.bookSlot('mock-slot-2', 'Urgent Pain');

        // 3. Logout Member
        await supabase.auth.signOut();

        // 4. Login Provider
        const { data: { user: provider } } = await supabase.auth.signInWithPassword({ email: 'jameson', password: 'password' });

        // 5. Get Schedule
        // Range: Today to +5 days
        const start = new Date().toISOString();
        const end = new Date(Date.now() + 86400000 * 5).toISOString();

        const schedule = await api.getProviderSchedule(provider!.id, start, end);

        // 6. Verify Booked Slot
        const appt = schedule.find(a => a.notes === 'Urgent Pain');
        expect(appt).toBeDefined();
        expect(appt!.status).toBe('confirmed');
        // In the UI, the badge is rendered based on appt.notes.includes('Urgent'). 
        // Here we verify the data is present.
    });

    it('Scenario 3: Admin sees all appointments', async () => {
        // Setup state: Member books a slot
        await supabase.auth.signInWithPassword({ email: 'ivan', password: 'password' });
        await api.bookSlot('mock-slot-3', 'Routine Checkup');
        await supabase.auth.signOut();

        // Login as Admin
        await supabase.auth.signInWithPassword({ email: 'alex', password: 'password' });
        const { data: { user } } = await supabase.auth.getUser();
        expect(user!.user_metadata.token_alias).toBe('CMD. ALEX');

        // Get All Appointments
        const allAppts = await api.getAllAppointments();
        const booked = allAppts.find(a => a.notes === 'Routine Checkup');
        expect(booked).toBeDefined();
    });
});
