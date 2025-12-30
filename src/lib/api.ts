import { supabase, IS_MOCK } from './supabase';
import { format } from 'date-fns';

/**
 * PROJECT VECTOR API CLIENT
 * -------------------------
 * This client handles all data interactions for the application.
 * It implements a "Dual Mode" strategy:
 * 1. REAL MODE: Connects to Supabase backend when environment variables are present.
 * 2. MOCK MODE: Uses an in-memory store ('mockStore') to simulate backend behavior for offline development/verification.
 */

// --- TYPES ---
export type Appointment = {
    id: string;
    provider_id: string;
    member_id: string | null;
    start_time: string;
    end_time: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'blocked';
    notes?: string;
    is_booked: boolean;
    created_at: string;
    provider?: any;
    member?: any;
};

export type Member = {
    id: string;
    token_alias: string;
    role: string;
    status: string;
    created_at: string;
};

// Provider Resources (YouTube videos, articles, etc.)
export type ProviderResource = {
    id: string;
    provider_id: string;
    title: string;
    url: string;
    category: 'video' | 'article' | 'worksheet' | 'exercise' | 'other';
    description?: string;
    created_at: string;
};

// --- API IMPLEMENTATION ---
export const api = {
    /**
     * IN-MEMORY MOCK STORE
     * Used when IS_MOCK is true or keys are missing.
     * Persists data only for the session (refresh clears it).
     */
    mockStore: {
        appointments: [] as Appointment[],
        init: false,
        // PERSISTENCE HELPERS
        load: () => {
            const stored = localStorage.getItem('MOCK_DB_V1');
            if (stored) {
                const parsed = JSON.parse(stored);
                const now = new Date();
                let changed = false;

                const updatedAppointments = parsed.appointments.map((a: Appointment) => {
                    const startTime = new Date(a.start_time);
                    const endTime = new Date(a.end_time);
                    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

                    // [AUTOMATION] Auto-Complete: Past appointments that ended
                    if (endTime < now && (a.status === 'pending' || a.status === 'confirmed')) {
                        changed = true;
                        return { ...a, status: 'completed' };
                    }

                    // [AUTOMATION] No-Show Detection: Started 30+ min ago, still pending
                    if (startTime < thirtyMinutesAgo && a.status === 'pending' && a.member_id) {
                        changed = true;
                        console.log(`[AUTOMATION] No-Show detected for appointment ${a.id}`);
                        return { ...a, status: 'cancelled', notes: (a.notes || '') + ' [NO-SHOW]' };
                    }

                    return a;
                });

                api.mockStore.appointments = updatedAppointments;
                api.mockStore.init = true;

                if (changed) {
                    api.mockStore.save();
                    console.log("[AUTOMATION] System updated appointment statuses.");
                }
            }
        },
        save: () => {
            localStorage.setItem('MOCK_DB_V1', JSON.stringify({
                appointments: api.mockStore.appointments,
                init: api.mockStore.init
            }));
        },
        reset: () => {
            api.mockStore.appointments = [];
            api.mockStore.init = false;
            localStorage.removeItem('MOCK_DB_V1');
            // Clear tactical pins
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('TACTICAL_PIN_')) {
                    localStorage.removeItem(key);
                }
            });
        }
    },

    // ==========================================
    // APPOINTMENT MANAGEMENT (Member & General)
    // ==========================================

    /**
     * Fetches appointments for the current user.
     * MOCK: Returns initialized mock data or previously booked mock slots.
     */
    getMyAppointments: async (startDate?: string, endDate?: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // [MOCK MODE] - Only use mock data when in mock mode
        if (IS_MOCK) {
            api.mockStore.load(); // Ensure we have latest data

            // Lazy initialization of mock data for 'Jameson' scenario
            if (!api.mockStore.init) {
                // Determine user alias for context


                api.mockStore.appointments = [{
                    id: 'mock-appt-existing',
                    provider_id: 'mock-provider-jameson',
                    member_id: user.id,
                    start_time: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
                    end_time: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
                    status: 'confirmed',
                    is_booked: true,
                    created_at: new Date().toISOString(),
                    provider: { token_alias: 'Dr. Jameson', service_type: 'MH_GREEN' }
                }];
                api.mockStore.init = true;
            }

            // FILTER: Only return appointments for this member
            const myAppts = api.mockStore.appointments.filter(a => a.member_id === user.id);

            // ENRICH: Add missing provider details
            return myAppts.map(a => {
                if (a.provider) return a;
                let alias = 'UNKNOWN';
                let st = 'PRIMARY';
                if (a.provider_id.includes('jameson') || a.provider_id.includes('red')) { alias = 'Dr. Jameson'; st = 'MH_GREEN'; }
                else if (a.provider_id.includes('smith') || a.provider_id.includes('blue')) { alias = 'Dr. Smith'; st = 'PRIMARY'; }
                else if (a.provider_id.includes('mh')) { alias = 'Dr. MH'; st = 'MH_GREEN'; }

                return { ...a, provider: { token_alias: alias, service_type: st } };
            });
        }

        // REAL MODE - Query Supabase
        let query = supabase
            .from('appointments')
            .select('*, provider:users!provider_id(token_alias, service_type)')
            .eq('member_id', user.id);

        if (startDate) query = query.gte('start_time', startDate);
        if (endDate) query = query.lte('start_time', endDate);

        const { data, error } = await query.order('start_time', { ascending: true });

        if (error) throw error;

        // Return empty array if no appointments - DO NOT FALLBACK TO MOCK DATA
        return (data || []) as Appointment[];
    },

    /**
     * Books a specific slot for the current user.
     * MOCK: Creates a new appointment entry in mockStore.
     */
    bookSlot: async (slotId: string, notes?: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // [MOCK MODE]
        if (IS_MOCK) {
            // CASE 1: Booking a 'Virtual' Slot (mock-slot-...)
            if (slotId.startsWith('mock-slot')) {
                // ID Format: mock-slot-{providerID}-{index} OR mock-slot-{index} (legacy/jameson)
                let pId = 'mock-provider-jameson';
                let idx = 0;

                if (slotId.includes('mock-provider')) {
                    // Extract index from end
                    const parts = slotId.split('-');
                    idx = parseInt(parts.pop() || '0');
                    // Rejoin the rest to get provider ID (ignoring 'mock-slot-')
                    // 'mock-slot-mock-provider-smith-2' -> parts=[mock, slot, mock, provider, smith]
                    pId = parts.slice(2).join('-');
                } else {
                    idx = parseInt(slotId.split('-').pop() || '0');
                }

                // Calculate time relative to tomorrow 9am (simple mock logic)
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(9, 0, 0, 0);
                const slotTime = new Date(tomorrow);
                slotTime.setHours(9 + idx);

                const newAppt: Appointment = {
                    id: `mock-appt-new-${Date.now()}`,
                    provider_id: pId,
                    member_id: user.id,
                    start_time: slotTime.toISOString(),
                    end_time: new Date(slotTime.getTime() + 60 * 60 * 1000).toISOString(),
                    status: 'confirmed',
                    is_booked: true,
                    created_at: new Date().toISOString(),
                    notes: notes,
                    // Dynamic Provider Info
                    provider: {
                        token_alias: pId.includes('smith') || pId.includes('blue') ? 'Dr. Smith' : (pId.includes('taylor') ? 'Dr. Taylor' : 'Dr. Jameson'),
                        service_type: pId.includes('smith') || pId.includes('blue') ? 'PRIMARY_BLUE' : (pId.includes('taylor') ? 'PT_GOLD' : 'MH_GREEN')
                    }
                };

                api.mockStore.appointments.push(newAppt);
                api.mockStore.save();
                return newAppt;
            }

            // CASE 2: Booking a 'Generated' Mock Slot (mock-gen-...)
            // These exist in the store but are 'pending'.
            const idx = api.mockStore.appointments.findIndex(a => a.id === slotId);
            if (idx >= 0) {
                const appt = api.mockStore.appointments[idx];
                appt.member_id = user.id;
                appt.status = 'confirmed';
                appt.is_booked = true;
                appt.notes = notes || appt.notes;

                // Ensure provider info is attached if missing
                if (!appt.provider) {
                    const pid = appt.provider_id;
                    appt.provider = {
                        token_alias: pid.includes('smith') ? 'Dr. Smith' : (pid.includes('taylor') ? 'Dr. Taylor' : 'Dr. Jameson'),
                        service_type: pid.includes('smith') ? 'PRIMARY_BLUE' : (pid.includes('taylor') ? 'PT_GOLD' : 'MH_GREEN')
                    };
                }

                api.mockStore.save();
                return appt;
            }
            throw new Error('Mock Appointment Not Found');
        }

        // Check for existing notes (e.g. Location metadata) to preserve
        const { data: existingSlot } = await supabase
            .from('appointments')
            .select('notes')
            .eq('id', slotId)
            .single();

        let finalNotes = notes || null;
        if (existingSlot?.notes && existingSlot.notes.includes('Location:')) {
            // Simple extraction of location string if present
            const locParts = existingSlot.notes.split('|').map((s: string) => s.trim());
            const loc = locParts.find((s: string) => s.startsWith('Location:'));
            if (loc) {
                finalNotes = notes ? `${notes} | ${loc}` : loc;
            } else if (existingSlot.notes.trim().startsWith('Location:')) {
                finalNotes = notes ? `${notes} | ${existingSlot.notes.trim()}` : existingSlot.notes.trim();
            }
        }

        const { data, error } = await supabase
            .from('appointments')
            .update({
                member_id: user.id,
                is_booked: true,
                status: 'confirmed',
                notes: finalNotes
            })
            .eq('id', slotId)
            .select()
            .single();

        if (error) throw error;
        return data as Appointment;
    },

    /**
     * Deletes a slot entirely (Provider usage).
     */
    deleteAppointment: async (appointmentId: string) => {
        // [MOCK MODE]
        if (IS_MOCK) {
            const idx = api.mockStore.appointments.findIndex(a => a.id === appointmentId);
            if (idx >= 0) {
                api.mockStore.appointments.splice(idx, 1);
                api.mockStore.save();
                return true;
            }
            // checking if it was a generated mock-slot that isn't in store yet? 
            // If it's not in store, it's effectively "deleted" by just not existing, but for "mock-slot-X" we can't easily "delete" it without persisting a "deleted" state or adding it to a blacklist. 
            // For now, simpler to assume we only delete things that exist.
            return true;
        }

        const { error } = await supabase.from('appointments').delete().eq('id', appointmentId);
        if (error) throw error;
    },

    /**
     * Cancels an appointment.
     * Uses RPC 'member_cancel_appointment' to handle security/validation securely on server.
     */
    cancelAppointment: async (appointmentId: string, reason?: string) => {
        // [MOCK MODE]
        if (IS_MOCK) {
            const idx = api.mockStore.appointments.findIndex(a => a.id === appointmentId);
            if (idx >= 0) {
                const appt = api.mockStore.appointments[idx];
                appt.status = 'cancelled';
                if (reason) {
                    appt.notes = (appt.notes || '') + ` | CANCEL_REASON: ${reason}`;
                }
                api.mockStore.save();
                return true;
            }
        }

        // Try RPC first
        const { error } = await supabase.rpc('member_cancel_appointment', {
            p_appointment_id: appointmentId
        });

        if (error) throw error;

        // If reason provided, try to append it (best effort)
        if (reason) {
            try {
                const { data } = await supabase.from('appointments').select('notes').eq('id', appointmentId).single();
                const newNotes = (data?.notes || '') + ` | CANCEL_REASON: ${reason}`;
                await supabase.from('appointments').update({ notes: newNotes }).eq('id', appointmentId);
            } catch (e) {
                console.warn('Could not save cancel reason', e);
            }
        }
    },

    /**
     * Provider Cancel: Updates status to 'cancelled' and logs reason.
     */
    providerCancelAppointment: async (appointmentId: string, reason: string) => {
        // [MOCK MODE]
        if (IS_MOCK) {
            const idx = api.mockStore.appointments.findIndex(a => a.id === appointmentId);
            if (idx >= 0) {
                const appt = api.mockStore.appointments[idx];
                appt.status = 'cancelled';
                appt.notes = (appt.notes || '') + ` | CANCEL_REASON: ${reason}`;
                api.mockStore.save();
                return true;
            }
            return;
        }

        // Real Mode - Provider has update rights
        const { data: current } = await supabase.from('appointments').select('notes').eq('id', appointmentId).single();
        const newNotes = (current?.notes || '') + ` | CANCEL_REASON: ${reason}`;

        const { error } = await supabase
            .from('appointments')
            .update({
                status: 'cancelled',
                notes: newNotes,
                is_booked: false // Free up the slot? Or keep it blocked? User said "cancel". Usually frees or keeps record. 
                // If we want history, we keep record. But if we free it, another patient can book.
                // Re-booking requires a NEW slot usually.
                // Let's keep is_booked=true (ish) or false?
                // If cancelled, slot should arguably be open again?
                // But this specific Appointment ID is the record of the booking.
                // If I set is_booked=false, it might disappear from "My Schedule" if query filters is_booked=true.
                // But status='cancelled'.
            })
            .eq('id', appointmentId);

        if (error) throw error;
    },

    /**
     * Books a slot directly for a member (Admin usage).
     */
    directBook: async (slotId: string, memberId: string) => {
        // [MOCK MODE]
        if (IS_MOCK) {
            const idx = api.mockStore.appointments.findIndex(a => a.id === slotId);
            if (idx >= 0) {
                const updated = {
                    ...api.mockStore.appointments[idx],
                    member_id: memberId,
                    is_booked: true,
                    status: 'confirmed' as const,
                    notes: '' // Reset notes on new booking
                };
                api.mockStore.appointments[idx] = updated;
                api.mockStore.save();
                return updated as Appointment;
            }
            // Logic for booking new 'mock-slot' via admin
            if (slotId.startsWith('mock-slot')) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(9, 0, 0, 0);
                const idx = parseInt(slotId.split('-').pop() || '0');
                const slotTime = new Date(tomorrow);
                slotTime.setHours(9 + idx);

                const newAppt: Appointment = {
                    id: `mock-appt-admin-${Date.now()}`,
                    provider_id: 'mock-provider-jameson',
                    member_id: memberId,
                    start_time: slotTime.toISOString(),
                    end_time: new Date(slotTime.getTime() + 60 * 60 * 1000).toISOString(),
                    status: 'confirmed',
                    is_booked: true,
                    created_at: new Date().toISOString(),
                    provider: { token_alias: 'Dr. Jameson', service_type: 'MH_GREEN' }
                };
                api.mockStore.appointments.push(newAppt);
                api.mockStore.save();
                return newAppt;
            }
        }

        const { data, error } = await supabase
            .from('appointments')
            .update({
                member_id: memberId,
                is_booked: true,
                status: 'confirmed'
            })
            .eq('id', slotId)
            .select()
            .single();

        if (error) throw error;
        return data as Appointment;
    },

    /**
     * Submits feedback for an appointment.
     */
    submitFeedback: async (appointmentId: string, rating: number, comment: string) => {
        await api.logEvent('FEEDBACK', `Patient Feedback: ${rating}/5 - ${comment}`, 'INFO', { appointmentId, rating, comment });
        return { success: true };
    },

    /**
     * Swaps an existing appointment for a new slot (Reschedule).
     * MOCK: Deletes old, creates new.
     */
    rescheduleAppointmentSwap: async (oldApptId: string, newSlotId: string) => {
        // [MOCK MODE]
        if (IS_MOCK) {
            const oldApptIndex = api.mockStore.appointments.findIndex(a => a.id === oldApptId);
            if (oldApptIndex === -1) throw new Error('Mock: Old appointment not found');

            const oldAppt = api.mockStore.appointments[oldApptIndex];

            // Simulate logic to calculate new time
            let newStartTime = new Date().toISOString();
            if (newSlotId.startsWith('mock-slot')) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(9, 0, 0, 0);
                const idx = parseInt(newSlotId.split('-').pop() || '0');
                const t = new Date(tomorrow);
                t.setHours(9 + idx);
                newStartTime = t.toISOString();
            }

            const newAppt = {
                ...oldAppt,
                id: `mock-appt-resched-${Date.now()}`,
                start_time: newStartTime,
                end_time: new Date(new Date(newStartTime).getTime() + 60 * 60 * 1000).toISOString(),
                status: 'confirmed' as const,
                is_booked: true
            };

            api.mockStore.appointments.splice(oldApptIndex, 1);
            api.mockStore.appointments.push(newAppt);
            api.mockStore.save();
            return true;
        }

        const { data, error } = await supabase.rpc('reschedule_appointment_swap', {
            p_old_appointment_id: oldApptId,
            p_new_slot_id: newSlotId
        });

        if (error) throw error;
        return data;
    },

    /**
     * Updates status directly (Admin usage).
     */
    updateAppointmentStatus: async (id: string, status: Appointment['status']) => {
        // [MOCK MODE]
        if (IS_MOCK) {
            const idx = api.mockStore.appointments.findIndex(a => a.id === id);
            if (idx >= 0) {
                const isBooked = ['confirmed', 'completed', 'blocked'].includes(status);
                const updated = {
                    ...api.mockStore.appointments[idx],
                    status: status as any, // force type for mock
                    is_booked: isBooked
                };
                api.mockStore.appointments[idx] = updated;
                api.mockStore.save(); // Persist changes!
                return updated as Appointment;
            }
        }

        const { data, error } = await supabase
            .from('appointments')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Appointment;
    },

    // ==========================================
    // PROVIDER & CLINICAL OPERATIONS
    // ==========================================

    /**
     * Returns list of available providers.
     * MOCK: Returns static list.
     */
    getProviders: async () => {
        // [MOCK MODE]
        if (IS_MOCK) {
            return [
                { id: 'mock-provider-jameson', token_alias: 'Dr. Jameson', role: 'provider', service_type: 'MH_GREEN' },
                { id: 'mock-provider-smith', token_alias: 'Dr. Smith', role: 'provider', service_type: 'PRIMARY_BLUE' },
                { id: 'mock-provider-taylor', token_alias: 'Dr. Taylor', role: 'provider', service_type: 'PT_GOLD' }
            ];
        }

        const { data, error } = await supabase
            .from('users')
            .select('id, token_alias, role, service_type')
            .eq('role', 'provider');

        if (error) throw error;
        // If DB returns nothing, still provide mock data as a fallback
        if (!data || data.length === 0) {
            return [
                { id: 'mock-provider-jameson', token_alias: 'Dr. Jameson', role: 'provider', service_type: 'MH_GREEN' },
                { id: 'mock-provider-smith', token_alias: 'Dr. Smith', role: 'provider', service_type: 'PRIMARY' }
            ];
        }
        return data;
    },

    /**
     * Gets available slots for a specific provider.
     * MOCK: Generates 4 static slots for 'tomorrow', filtering out any that are in mockStore.
     */
    getProviderOpenSlots: async (providerId: string, startDate?: string) => {
        // [MOCK MODE] - Only generate mock slots when in mock mode
        if (IS_MOCK) {
            api.mockStore.load(); // Ensure data is loaded to detect conflicts
            // Determine base date: if startDate provided, use it, else tomorrow
            const baseDate = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() + 1));
            baseDate.setHours(9, 0, 0, 0);

            const slots = [];
            for (let i = 0; i < 4; i++) {
                const t = new Date(baseDate);
                t.setHours(9 + i);

                // Filter out conflict with mockStore
                const isBookedInMock = api.mockStore?.appointments.some(a => {
                    if (a.provider_id !== providerId) return false;
                    const aStart = new Date(a.start_time).getTime();
                    const aEnd = new Date(a.end_time).getTime();
                    const tStart = t.getTime();
                    const tEnd = t.getTime() + 60 * 60 * 1000;

                    // Check for overlap: (StartA < EndB) and (EndA > StartB)
                    const isOverlapping = aStart < tEnd && aEnd > tStart;

                    // If conflicting appointment is active (not cancelled), suppress this virtual slot
                    return isOverlapping && (a.status === 'confirmed' || a.status === 'blocked' || a.status === 'completed');
                });

                if (!isBookedInMock) {
                    // [RULE] T-30 Minutes: Slots must be at least 30 mins in the future
                    if (t.getTime() > Date.now() + 30 * 60000) {
                        slots.push({
                            id: `mock-slot-${providerId}-${i}`, // Encode Provider ID for multi-provider support
                            provider_id: providerId,
                            member_id: null,
                            start_time: t.toISOString(),
                            end_time: new Date(t.getTime() + 60 * 60 * 1000).toISOString(),
                            status: 'pending',
                            is_booked: false,
                            created_at: new Date().toISOString()
                        });
                    }
                }
            }
            return slots as Appointment[];
        }

        // REAL MODE - Query Supabase
        let query = supabase
            .from('appointments')
            .select('*')
            .eq('provider_id', providerId)
            .is('member_id', null)
            .eq('is_booked', false);

        const minStartTime = new Date(Date.now() + 30 * 60000).toISOString();
        query = query.gte('start_time', minStartTime);

        if (startDate) query = query.gte('start_time', startDate);

        const { data, error } = await query.order('start_time', { ascending: true });

        if (error) throw error;

        // Return empty array if no slots - DO NOT FALLBACK TO MOCK DATA
        return (data || []) as Appointment[];
    },

    /**
     * Fetches provider's schedule (all statuses).
     */
    getProviderSchedule: async (providerId: string, startDate: string, endDate: string) => {
        // [MOCK MODE]
        if (IS_MOCK) {
            api.mockStore.load(); // Ensure fresh data
            return api.mockStore.appointments
                .filter(a => a.provider_id === providerId && a.start_time >= startDate && a.start_time <= endDate)
                .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        }

        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('provider_id', providerId)
            .gte('start_time', startDate)
            .lte('start_time', endDate)
            .order('start_time', { ascending: true });

        if (error) throw error;
        return data as Appointment[];
    },

    /**
     * Generates a batch of slots.
     * MOCK: Uses loop to populate mockStore with slots based on recurrence params.
     */
    generateSlots: async (startDate: string, endDate: string, startTime: string, endTime: string, duration: number, breakMinutes: number, days: number[], isBlock: boolean = false, notes: string | null = null) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // [MOCK MODE]
        if (IS_MOCK) {
            api.mockStore.load(); // Persistence Check
            // Explicitly parse YYYY-MM-DD components
            const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
            // End Date logic if needed, but we can loop by day difference
            const startD = new Date(sYear, sMonth - 1, sDay); // Local Midnight
            const endD = new Date(endDate.split('-').map(Number)[0], endDate.split('-').map(Number)[1] - 1, endDate.split('-').map(Number)[2]);

            // Helper to add days
            const addDays = (d: Date, days: number) => {
                const newDate = new Date(d);
                newDate.setDate(d.getDate() + days);
                return newDate;
            };

            for (let d = new Date(startD); d <= endD; d = addDays(d, 1)) {
                if (days.includes(d.getDay())) {
                    // Create base slot start for this day using explicit Local Time construction
                    // d is already local midnight.
                    const [sH, sM] = startTime.split(':').map(Number);
                    let currentSlotStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), sH, sM, 0, 0);

                    const [eH, eM] = endTime.split(':').map(Number);
                    const currentDayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), eH, eM, 0, 0);

                    while (currentSlotStart.getTime() < currentDayEnd.getTime()) {
                        // [FIX] Single Block Logic: If blocking, span the entire requested duration as one block
                        // Otherwise, use duration for standard slots
                        let currentSlotEnd = isBlock
                            ? new Date(currentDayEnd)
                            : new Date(currentSlotStart.getTime() + (duration * 60000));

                        // Safety: don't exceed day end (for standard slots)
                        if (currentSlotEnd > currentDayEnd) break;

                        // If standard slot loop and we are at end, breaks are handled by loop condition logic below

                        // [LOGIC] Overlap Detection
                        // Find existing slots that overlap with this new slot
                        const overlappingIndices = api.mockStore.appointments
                            .map((a, i) => {
                                const aStart = new Date(a.start_time).getTime();
                                const aEnd = new Date(a.end_time).getTime();
                                const bStart = currentSlotStart.getTime();
                                const bEnd = currentSlotEnd.getTime();
                                // Check for overlap AND same provider
                                return (aStart < bEnd && aEnd > bStart && a.provider_id === user.id) ? i : -1;
                            })
                            .filter(i => i !== -1)
                            .sort((a, b) => b - a);

                        if (overlappingIndices.length > 0) {
                            if (isBlock) {
                                // Block Logic: Blocks DESTROY overlapping OPEN slots
                                // We filter to only remove 'pending' slots to avoid accidentally deleting patient appts
                                overlappingIndices.forEach(idx => {
                                    if (api.mockStore.appointments[idx].status === 'pending') {
                                        api.mockStore.appointments.splice(idx, 1);
                                    }
                                });
                            } else {
                                // Open Slot Logic: Skip if overlap
                                currentSlotStart = new Date(currentSlotEnd.getTime() + (breakMinutes * 60000));
                                continue;
                            }
                        }

                        api.mockStore.appointments.push({
                            id: `mock-gen-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                            provider_id: user.id, // Use logged-in provider ID
                            member_id: null,
                            // format() keeps it local "YYYY-MM-DDTHH:mm:ss"
                            start_time: format(currentSlotStart, "yyyy-MM-dd'T'HH:mm:ss"),
                            end_time: format(currentSlotEnd, "yyyy-MM-dd'T'HH:mm:ss"),
                            status: isBlock ? 'blocked' : 'pending',
                            is_booked: isBlock,
                            notes: notes || undefined,
                            created_at: new Date().toISOString()
                        } as any);

                        // Advance time
                        currentSlotStart = new Date(currentSlotEnd.getTime() + (breakMinutes * 60000));
                    }
                }
            }
            api.mockStore.save();
            return true;
        }

        const { data, error } = await supabase
            .rpc('generate_slots', {
                p_start_date: startDate,
                p_end_date: endDate,
                p_start_time: startTime,
                p_end_time: endTime,
                p_duration_minutes: duration,
                p_break_minutes: breakMinutes,
                p_days_of_week: days,
                p_is_block: isBlock,
                p_notes: notes,
                p_timezone_offset_minutes: new Date().getTimezoneOffset() // Fix: Pass client offset to properly calc UTC
            });

        if (error) throw error;
        return data;
    },

    /**
     * Clears slots in a range.
     * Tries secure RPC first, falls back to Admin RPC.
     */
    clearSchedule: async (startDate: string, endDate: string, includeBooked: boolean = false) => {
        // [MOCK MODE]
        if (IS_MOCK) {
            const initialCount = api.mockStore.appointments.length;
            api.mockStore.appointments = api.mockStore.appointments.filter(a => {
                // Keep if outside range
                if (a.start_time < startDate || a.start_time > endDate) return true;

                // Inside range:
                // If it's a patient booking, only delete if includeBooked is true
                if (a.member_id) return !includeBooked;

                // If it's a block or open slot, delete it (always clear "schedule" structure)
                return false;
            });
            api.mockStore.save();
            return { count: initialCount - api.mockStore.appointments.length };
        }

        try {
            const { data, error } = await supabase.rpc('clear_provider_schedule', {
                p_start_date: startDate,
                p_end_date: endDate,
                p_include_booked: includeBooked
            });
            if (error) throw error;
            return data;
        } catch (e: any) {
            console.log('Provider RPC failed, attempting client-side fallback...', e);
            // Client-Side Fallback: Direct Delete via RLS
            // This works if the provider has delete permissions on their own rows (standard RLS)
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("No user");

                let query = supabase.from('appointments')
                    .delete()
                    .eq('provider_id', user.id)
                    .gte('start_time', startDate)
                    .lte('start_time', endDate);

                if (!includeBooked) {
                    query = query.is('member_id', null);
                }

                const { data, error } = await query.select(); // Select to get count
                if (error) throw error;

                return { success: true, deleted: data?.length || 0, method: 'client-fallback' };
            } catch (fallbackError) {
                console.error("Client fallback failed", fallbackError);
                throw e; // Throw original RPC error if fallback also fails
            }
        }
    },

    /**
     * Toggles 'Block' status of a slot.
     * MOCK: Explicitly adds a 'blocked' appointment if one doesn't exist for that time.
     */
    toggleSlotBlock: async (slotId: string, isBlocked: boolean, notes: string | null = null) => {
        // [MOCK MODE]
        if (slotId.startsWith('mock-') && IS_MOCK) {
            if (isBlocked) {
                // If blocking a 'mock-slot-X' (derived open slot), we create a real 'blocked' record.
                const { data: { user } } = await supabase.auth.getUser(); // Get current provider

                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(9, 0, 0, 0);

                // Parse Index - handle both simple and complex IDs
                const idx = parseInt(slotId.split('-').pop() || '0');

                const slotTime = new Date(tomorrow);
                slotTime.setHours(9 + idx);

                const blockedAppt: Appointment = {
                    id: `mock-blocked-${Date.now()}`,
                    provider_id: user?.id || 'mock-provider-jameson',
                    member_id: null,
                    start_time: slotTime.toISOString(),
                    end_time: new Date(slotTime.getTime() + 60 * 60 * 1000).toISOString(),
                    status: 'blocked',
                    is_booked: true,
                    notes: notes || 'Sick Leave / Admin Block',
                    created_at: new Date().toISOString()
                };
                api.mockStore.appointments.push(blockedAppt);
                api.mockStore.save();
                return blockedAppt;
            }
        }

        const { data, error } = await supabase
            .from('appointments')
            .update({
                is_booked: isBlocked,
                status: isBlocked ? 'blocked' : 'pending',
                notes: notes
            })
            .eq('id', slotId)
            .select()
            .single();

        if (error) throw error;
        return data as Appointment;
    },

    // ==========================================
    // ADMIN & SYSTEM OPERATIONS
    // ==========================================

    /**
     * Gets all appointments for Admin View.
     * MOCK: Returns api.mockStore.
     */
    getAllAppointments: async () => {
        // [MOCK MODE]
        if (IS_MOCK) {
            return api.mockStore.appointments;
        }

        const { data, error } = await supabase
            .from('appointments')
            .select('*, member:users!member_id(token_alias), provider:users!provider_id(token_alias, service_type)')
            .order('start_time', { ascending: true });

        if (error) throw error;
        return data as any[];
    },

    /**
     * Gets List of Members (Token Station).
     * MOCK: Returns static lists.
     */
    getMembers: async (search?: string) => {
        // [MOCK MODE] - Only use mock data when in mock mode
        if (IS_MOCK) {
            const mockMembers = [
                { id: 'mock-user-8821', token_alias: 'PATIENT ALPHA', role: 'member', status: 'active', created_at: new Date().toISOString() },
                { id: 'mock-user-3392', token_alias: 'PATIENT BRAVO', role: 'member', status: 'active', created_at: new Date().toISOString() },
                { id: 'mock-user-1102', token_alias: 'PATIENT CHARLIE', role: 'member', status: 'active', created_at: new Date().toISOString() }
            ];
            if (search) {
                return mockMembers.filter(m => m.token_alias.includes(search.toUpperCase()) || m.id.includes(search));
            }
            return mockMembers;
        }

        let query = supabase.from('users').select('*, appointments!member_id(count)').eq('role', 'member');
        if (search) {
            query = query.or(`token_alias.ilike.%${search}%,id.eq.${search}`);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    /**
     * Admin: Update Member Profile directly.
     */
    updateUser: async (id: string, updates: any) => {
        const { data, error } = await supabase.from('users').update(updates).eq('id', id);
        if (error) throw error;
        return data;
    },

    /**
     * Admin: Reset User Security (PIN/Password).
     */
    adminResetUserSecurity: async (userId: string) => {
        // [MOCK MODE]
        if (IS_MOCK) {
            localStorage.removeItem(`TACTICAL_PIN_${userId}`);
            return true;
        }
        // Real mode - could trigger password reset email or reset metadata
        // For Vector, we mainly care about the Tactical PIN which is local/client-side secured often?
        // But if we want to "assist providers who are locked out", maybe we just reset their PIN?
        // Since PINs are in localStorage mostly, we can't reset another user's localStorage from Admin console remotely unless we have a DB syncing mechanism for PINs (which we don't, for security).
        // Wait, current implementation: setTacticalPin uses localStorage `TACTICAL_PIN_${userId}`.
        // THIS IS CLIENT SIDE! Admin on a different machine CANNOT reset this.
        // UNLESS we are simulating 'Master Access' on the SAME machine (Kiosk mode).
        // Assuming Kiosk mode for Mock/Demo:
        localStorage.removeItem(`TACTICAL_PIN_${userId}`);
        return true;
    },

    /**
     * Wipes all mock data.
     */
    resetMockData: async () => {
        api.mockStore.reset();
        return true;
    },

    /**
     * Gets analytics data for the provider dashboard.
     * Returns appointments and feedback for the current provider.
     */
    getAnalytics: async () => {
        if (IS_MOCK) {
            // Return mock data for testing
            return {
                appointments: api.mockStore.appointments,
                feedback: []
            };
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Fetch all appointments for this provider  
        const { data: appointments, error: aptError } = await supabase
            .from('appointments')
            .select('*')
            .eq('provider_id', user.id)
            .order('start_time', { ascending: false });

        if (aptError) throw aptError;

        // Fetch feedback for this provider's appointments
        const { data: feedback, error: fbError } = await supabase
            .from('feedback')
            .select('*')
            .in('appointment_id', (appointments || []).map((a: Appointment) => a.id));

        return {
            appointments: appointments || [],
            feedback: fbError ? [] : (feedback || [])
        };
    },

    // --- UTILITIES / LOGGING ---

    /**
     * Checks if the current user has an appointment on a specific date.
     */
    checkAvailability: async (date: Date) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
            .from('appointments')
            .select('id')
            .eq('member_id', user.id)
            .gte('start_time', startOfDay.toISOString())
            .lte('start_time', endOfDay.toISOString())
            .neq('status', 'cancelled');

        if (error) throw error;
        return data.length > 0;
    },

    /**
     * Sets a tactical PIN in local storage.
     */
    /**
     * Sets a tactical PIN in local storage for a specific user.
     */
    setTacticalPin: async (userId: string, pin: string) => {
        if (!userId) return;
        localStorage.setItem(`TACTICAL_PIN_${userId}`, pin);
    },

    /**
     * Retrieves the tactical PIN from local storage.
     */
    /**
     * Retrieves the tactical PIN from local storage for a specific user.
     */
    getTacticalPin: async (userId: string) => {
        if (!userId) return null;
        return localStorage.getItem(`TACTICAL_PIN_${userId}`);
    },

    /**
     * Fixes duplicate user entries via RPC.
     */
    fixDuplicateUsers: async () => {
        const { data, error } = await supabase.rpc('fix_duplicate_users');
        if (error) throw error;
        return data as number;
    },

    /**
     * Logs an event to the audit log.
     */
    logEvent: async (type: string, description: string, severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' = 'INFO', metadata: any = {}) => {
        try {
            await supabase.rpc('log_event', {
                p_action_type: type,
                p_description: description,
                p_severity: severity,
                p_metadata: metadata
            });
        } catch (e) {
            console.error('Failed to log event:', e);
        }
    },

    /**
     * Retrieves audit logs with optional filters.
     */
    getAuditLogs: async (filters: { type?: string; severity?: string, limit?: number } = {}) => {
        const { data, error } = await supabase.rpc('get_audit_logs', {
            p_limit: filters.limit || 50,
            p_type: filters.type || null,
            p_severity: filters.severity || null
        });
        if (error) throw error;
        return data || [];
    },

    /**
     * Retrieves system statistics.
     */
    getSystemStats: async () => {
        const { data, error } = await supabase.rpc('get_system_stats');
        if (error) {
            console.warn("get_system_stats RPC failed or missing", error);
            return {
                total_users: 0,
                active_appointments: 0,
                available_slots: 0,
                errors_today: 0,
                duplicates: 0
            };
        }
        return data;
    },

    // ==========================================
    // PROVIDER RESOURCES (Educational Content)
    // ==========================================

    /**
     * Get resources for a specific provider.
     * Members can view resources from providers they have appointments with.
     */
    getProviderResources: async (providerId: string): Promise<ProviderResource[]> => {
        if (IS_MOCK) {
            const stored = localStorage.getItem('PROVIDER_RESOURCES');
            const allResources: ProviderResource[] = stored ? JSON.parse(stored) : [];
            return allResources.filter(r => r.provider_id === providerId);
        }

        const { data, error } = await supabase
            .from('resources')
            .select('*')
            .eq('provider_id', providerId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as ProviderResource[];
    },

    /**
     * Get all resources for the current provider (Provider Dashboard).
     */
    getMyResources: async (): Promise<ProviderResource[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        if (IS_MOCK) {
            const stored = localStorage.getItem('PROVIDER_RESOURCES');
            const allResources: ProviderResource[] = stored ? JSON.parse(stored) : [];
            return allResources.filter(r => r.provider_id === user.id);
        }

        const { data, error } = await supabase
            .from('resources')
            .select('*')
            .eq('provider_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as ProviderResource[];
    },

    /**
     * Add a new resource (Provider only).
     */
    addResource: async (resource: Omit<ProviderResource, 'id' | 'provider_id' | 'created_at'>): Promise<ProviderResource> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        if (IS_MOCK) {
            const newResource: ProviderResource = {
                id: `resource-${Date.now()}`,
                provider_id: user.id,
                ...resource,
                created_at: new Date().toISOString()
            };
            const stored = localStorage.getItem('PROVIDER_RESOURCES');
            const allResources: ProviderResource[] = stored ? JSON.parse(stored) : [];
            allResources.push(newResource);
            localStorage.setItem('PROVIDER_RESOURCES', JSON.stringify(allResources));
            return newResource;
        }

        const { data, error } = await supabase
            .from('resources')
            .insert([{
                provider_id: user.id,
                ...resource
            }])
            .select()
            .single();

        if (error) throw error;
        return data as ProviderResource;
    },

    /**
     * Update a resource (Provider only).
     */
    updateResource: async (id: string, updates: Partial<ProviderResource>): Promise<ProviderResource | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        if (IS_MOCK) {
            const stored = localStorage.getItem('PROVIDER_RESOURCES');
            const allResources: ProviderResource[] = stored ? JSON.parse(stored) : [];
            const index = allResources.findIndex(r => r.id === id && r.provider_id === user.id);
            if (index === -1) return null;
            allResources[index] = { ...allResources[index], ...updates };
            localStorage.setItem('PROVIDER_RESOURCES', JSON.stringify(allResources));
            return allResources[index];
        }

        const { data, error } = await supabase
            .from('resources')
            .update(updates)
            .eq('id', id)
            .eq('provider_id', user.id)
            .select()
            .single();

        if (error) throw error;
        return data as ProviderResource;
    },

    /**
     * Delete a resource (Provider only).
     */
    deleteResource: async (id: string): Promise<boolean> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        if (IS_MOCK) {
            const stored = localStorage.getItem('PROVIDER_RESOURCES');
            const allResources: ProviderResource[] = stored ? JSON.parse(stored) : [];
            const filtered = allResources.filter(r => !(r.id === id && r.provider_id === user.id));
            if (filtered.length === allResources.length) return false;
            localStorage.setItem('PROVIDER_RESOURCES', JSON.stringify(filtered));
            return true;
        }

        const { error } = await supabase
            .from('resources')
            .delete()
            .eq('id', id)
            .eq('provider_id', user.id);

        if (error) throw error;
        return true;
    },

    /**
     * Get resources from all providers the current member has appointments with.
     */
    getAvailableResources: async (): Promise<{ provider: string, resources: ProviderResource[] }[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        if (IS_MOCK) {
            // Get unique provider IDs from member's appointments
            const appointments = api.mockStore.appointments.filter(a => a.member_id === user.id);
            const providerIds = [...new Set(appointments.map(a => a.provider_id))];
            const stored = localStorage.getItem('PROVIDER_RESOURCES');
            const allResources: ProviderResource[] = stored ? JSON.parse(stored) : [];

            return providerIds.map(pid => ({
                provider: pid,
                resources: allResources.filter(r => r.provider_id === pid)
            })).filter(g => g.resources.length > 0);
        }

        // Real Mode: Query Appointments then Resources
        const { data: appointments, error: aptError } = await supabase
            .from('appointments')
            .select('provider_id')
            .eq('member_id', user.id);

        if (aptError) throw aptError;

        const providerIds = [...new Set((appointments || []).map((a: any) => a.provider_id))];

        if (providerIds.length === 0) return [];

        const { data: resources, error: resError } = await supabase
            .from('resources')
            .select('*')
            .in('provider_id', providerIds)
            .order('created_at', { ascending: false });

        if (resError) throw resError;

        // Group by provider
        return providerIds.map((pid: any) => ({
            provider: pid as string,
            resources: (resources || []).filter((r: any) => r.provider_id === pid)
        })).filter((g: any) => g.resources.length > 0);
    },

    /**
     * Admin: Create New User (RPC)
     */
    adminCreateUser: async (email: string, pass: string, token: string, role: string, serviceType: string) => {
        if (IS_MOCK) {
            console.log('[MOCK] Created user:', { email, token });
            return 'mock-user-id-' + Math.random();
        }

        const { data: userId, error } = await supabase.rpc('admin_create_user', {
            new_email: email,
            new_password: pass,
            new_token: token,
            new_role: role,
            new_service_type: serviceType
        });

        if (error) throw error;
        return userId;
    },

    /**
     * Admin: Prune inactive users
     */
    provisionMember: async (token: string, serviceType: string) => {
        if (IS_MOCK) return 'mock-id-' + Math.random();
        const { data, error } = await supabase.rpc('provision_member', {
            p_token: token,
            p_service_type: serviceType
        });
        if (error) throw error;
        return data;
    },

    pruneInactiveUsers: async (days: number) => {
        if (IS_MOCK) {
            console.log('[MOCK] Pruned users older than', days);
            // Simulate pruning random members
            return Math.floor(Math.random() * 10);
        }
        const { data, error } = await supabase.rpc('admin_prune_unused_accounts', { days_inactive: days });
        if (error) throw error;
        return data as number;
    },

    /**
     * Admin: Delete User
     */
    adminDeleteUser: async (userId: string) => {
        if (IS_MOCK) return;
        const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userId });
        if (error) throw error;
    }
};
