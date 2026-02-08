/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase, IS_MOCK } from '../supabase';
import { mockStore } from './mockStore';
import type { Appointment } from './types';

export const appointmentActions = {
    /**
     * Fetches appointments for the current user.
     */
    getMyAppointments: async (startDate?: string, endDate?: string): Promise<Appointment[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        if (IS_MOCK) {
            mockStore.load();

            if (!mockStore.init) {
                console.log('[MOCK] Seeding initial dataset...');
                const seedAppointments: Appointment[] = [];
                const now = new Date();
                const providerIds = [
                    { id: 'mock-provider-jameson', alias: 'Dr. Jameson', service: 'MH_GREEN' },
                    { id: 'mock-provider-smith', alias: 'Dr. Smith', service: 'PRIMARY_BLUE' },
                    { id: 'mock-provider-taylor', alias: 'Dr. Taylor', service: 'PT_GOLD' }
                ];

                for (let i = 1; i <= 5; i++) {
                    const pastDate = new Date(now);
                    pastDate.setDate(now.getDate() - (i * 2));
                    pastDate.setHours(10, 0, 0, 0);

                    seedAppointments.push({
                        id: `mock-appt-past-${i}`,
                        provider_id: 'mock-provider-jameson',
                        member_id: user.id,
                        start_time: pastDate.toISOString(),
                        end_time: new Date(pastDate.getTime() + 60 * 60 * 1000).toISOString(),
                        status: 'completed',
                        is_booked: true,
                        created_at: pastDate.toISOString(),
                        provider: { token_alias: 'Dr. Jameson', service_type: 'MH_GREEN' },
                        notes: 'Routine check-up | Location: Clinical Node B-4'
                    });
                }

                for (let d = 0; d < 90; d++) {
                    const day = new Date(now);
                    day.setDate(now.getDate() + d);
                    if (day.getDay() === 0 || day.getDay() === 6) continue;

                    providerIds.forEach(p => {
                        const startHours = [7, 8, 9, 10, 11, 13, 14, 15, 16];
                        startHours.forEach(h => {
                            const slotStart = new Date(day);
                            slotStart.setHours(h, h === 7 ? 30 : 0, 0, 0);

                            if (Math.random() < 0.05) {
                                seedAppointments.push({
                                    id: `mock-block-${p.id}-${d}-${h}`,
                                    provider_id: p.id,
                                    member_id: null,
                                    start_time: slotStart.toISOString(),
                                    end_time: new Date(slotStart.getTime() + 60 * 60 * 1000).toISOString(),
                                    status: 'blocked',
                                    is_booked: true,
                                    created_at: now.toISOString(),
                                    notes: 'Admin Block',
                                    provider: { token_alias: p.alias, service_type: p.service }
                                });
                                return;
                            }

                            if (Math.random() < 0.3) {
                                seedAppointments.push({
                                    id: `mock-booked-${p.id}-${d}-${h}`,
                                    provider_id: p.id,
                                    member_id: `other-patient-${Math.floor(Math.random() * 999)}`,
                                    start_time: slotStart.toISOString(),
                                    end_time: new Date(slotStart.getTime() + 60 * 60 * 1000).toISOString(),
                                    status: 'confirmed',
                                    is_booked: true,
                                    created_at: now.toISOString(),
                                    provider: { token_alias: p.alias, service_type: p.service }
                                });
                                return;
                            }

                            if (d % 14 === 0 && h === 9 && p.id === 'mock-provider-jameson') {
                                const reasons = [
                                    'Provider Referral: Bi-Weekly Therapy',
                                    'Follow-up: Treatment Plan Review',
                                    'Routine: Mental Health Check-in'
                                ];

                                seedAppointments.push({
                                    id: `mock-user-recurring-${d}`,
                                    provider_id: p.id,
                                    member_id: user.id,
                                    start_time: slotStart.toISOString(),
                                    end_time: new Date(slotStart.getTime() + 60 * 60 * 1000).toISOString(),
                                    status: 'confirmed',
                                    is_booked: true,
                                    created_at: now.toISOString(),
                                    notes: reasons[d % reasons.length],
                                    provider: { token_alias: p.alias, service_type: p.service }
                                });
                                return;
                            }

                            seedAppointments.push({
                                id: `mock-gen-${p.id}-${d}-${h}`,
                                provider_id: p.id,
                                member_id: null,
                                start_time: slotStart.toISOString(),
                                end_time: new Date(slotStart.getTime() + 60 * 60 * 1000).toISOString(),
                                status: 'pending',
                                is_booked: false,
                                created_at: now.toISOString(),
                                provider: { token_alias: p.alias, service_type: p.service }
                            });
                        });
                    });
                }

                mockStore.appointments = seedAppointments;
                mockStore.init = true;
                mockStore.save();
            }

            const myAppts = mockStore.appointments.filter(a => a.member_id === user.id);
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

        let query = (supabase as any)
            .from('appointments')
            .select('*, provider:users!provider_id(token_alias, service_type)')
            .eq('member_id', user.id);

        if (startDate) query = query.gte('start_time', startDate);
        if (endDate) query = query.lte('start_time', endDate);

        const { data, error } = await query.order('start_time', { ascending: true });
        if (error) throw error;
        return (data || []) as Appointment[];
    },

    /**
     * Books a specific slot for the current user.
     */
    bookSlot: async (slotId: string, notes?: string): Promise<Appointment> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        if (IS_MOCK) {
            if (slotId.startsWith('mock-slot')) {
                let pId = 'mock-provider-jameson';
                let idx = 0;

                if (slotId.includes('mock-provider')) {
                    const parts = slotId.split('-');
                    idx = parseInt(parts.pop() || '0');
                    pId = parts.slice(2).join('-');
                } else {
                    idx = parseInt(slotId.split('-').pop() || '0');
                }

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
                    provider: {
                        token_alias: pId.includes('smith') || pId.includes('blue') ? 'Dr. Smith' : (pId.includes('taylor') ? 'Dr. Taylor' : 'Dr. Jameson'),
                        service_type: pId.includes('smith') || pId.includes('blue') ? 'PRIMARY_BLUE' : (pId.includes('taylor') ? 'PT_GOLD' : 'MH_GREEN')
                    }
                };

                mockStore.appointments.push(newAppt);
                mockStore.save();
                return newAppt;
            }

            const idx = mockStore.appointments.findIndex(a => a.id === slotId);
            if (idx >= 0) {
                const appt = mockStore.appointments[idx];
                appt.member_id = user.id;
                appt.status = 'confirmed';
                appt.is_booked = true;
                appt.notes = notes || appt.notes;

                if (!appt.provider) {
                    const pid = appt.provider_id;
                    appt.provider = {
                        token_alias: pid.includes('smith') ? 'Dr. Smith' : (pid.includes('taylor') ? 'Dr. Taylor' : 'Dr. Jameson'),
                        service_type: pid.includes('smith') ? 'PRIMARY_BLUE' : (pid.includes('taylor') ? 'PT_GOLD' : 'MH_GREEN')
                    };
                }

                mockStore.save();
                return appt;
            }
            throw new Error('Mock Appointment Not Found');
        }

        const { data: existingSlot } = await (supabase as any)
            .from('appointments')
            .select('notes')
            .eq('id', slotId)
            .single();

        let finalNotes = notes || null;
        if (existingSlot?.notes && existingSlot.notes.includes('Location:')) {
            const locParts = existingSlot.notes.split('|').map((s: string) => s.trim());
            const loc = locParts.find((s: string) => s.startsWith('Location:'));
            if (loc) {
                finalNotes = notes ? `${notes} | ${loc}` : loc;
            } else if (existingSlot.notes.trim().startsWith('Location:')) {
                finalNotes = notes ? `${notes} | ${existingSlot.notes.trim()}` : existingSlot.notes.trim();
            }
        }

        const { data, error } = await (supabase as any)
            .from('appointments')
            .update({
                member_id: user.id,
                is_booked: true,
                status: 'confirmed',
                notes: finalNotes
            } as any)
            .eq('id', slotId)
            .select()
            .single();

        if (error) throw error;
        return data as Appointment;
    },

    deleteAppointment: async (appointmentId: string): Promise<void> => {
        if (IS_MOCK) {
            const idx = mockStore.appointments.findIndex(a => a.id === appointmentId);
            if (idx >= 0) {
                mockStore.appointments.splice(idx, 1);
                mockStore.save();
            }
            return;
        }

        const { error } = await (supabase as any).from('appointments').delete().eq('id', appointmentId);
        if (error) throw error;
    },

    cancelAppointment: async (appointmentId: string, reason?: string): Promise<void> => {
        if (IS_MOCK) {
            const idx = mockStore.appointments.findIndex(a => a.id === appointmentId);
            if (idx >= 0) {
                const appt = mockStore.appointments[idx];
                appt.status = 'cancelled';
                if (reason) {
                    appt.notes = (appt.notes || '') + ` | CANCEL_REASON: ${reason}`;
                }
                mockStore.save();
            }
            return;
        }

        const { error } = await (supabase as any).rpc('member_cancel_appointment', {
            p_appointment_id: appointmentId
        });

        if (error) throw error;

        if (reason) {
            try {
                const { data } = await (supabase as any).from('appointments').select('notes').eq('id', appointmentId).single();
                const newNotes = (data?.notes || '') + ` | CANCEL_REASON: ${reason}`;
                await (supabase as any).from('appointments').update({ notes: newNotes }).eq('id', appointmentId);
            } catch (e) {
                console.warn('Could not save cancel reason', e);
            }
        }
    },

    providerCancelAppointment: async (appointmentId: string, reason: string): Promise<void> => {
        if (IS_MOCK) {
            const idx = mockStore.appointments.findIndex(a => a.id === appointmentId);
            if (idx >= 0) {
                const appt = mockStore.appointments[idx];
                appt.status = 'cancelled';
                appt.notes = (appt.notes || '') + ` | CANCEL_REASON: ${reason}`;
                mockStore.save();
            }
            return;
        }

        const { data: current } = await (supabase as any).from('appointments').select('notes').eq('id', appointmentId).single();
        const newNotes = (current?.notes || '') + ` | CANCEL_REASON: ${reason}`;

        const { error } = await (supabase as any)
            .from('appointments')
            .update({
                status: 'cancelled',
                notes: newNotes,
                is_booked: false
            } as any)
            .eq('id', appointmentId);

        if (error) throw error;
    },

    directBook: async (slotId: string, memberId: string): Promise<Appointment> => {
        if (IS_MOCK) {
            const idx = mockStore.appointments.findIndex(a => a.id === slotId);
            if (idx >= 0) {
                const updated = {
                    ...mockStore.appointments[idx],
                    member_id: memberId,
                    is_booked: true,
                    status: 'confirmed' as const,
                    notes: ''
                };
                mockStore.appointments[idx] = updated;
                mockStore.save();
                return updated as Appointment;
            }
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
                mockStore.appointments.push(newAppt);
                mockStore.save();
                return newAppt;
            }
        }

        const { data, error } = await (supabase as any)
            .from('appointments')
            .update({
                member_id: memberId,
                is_booked: true,
                status: 'confirmed'
            } as any)
            .eq('id', slotId)
            .select()
            .single();

        if (error) throw error;
        return data as Appointment;
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    submitFeedback: async (_appointmentId: string, _rating: number, _comment?: string): Promise<{ success: boolean }> => {
        // Stub function for future feedback implementation
        return { success: true };
    },

    rescheduleAppointmentSwap: async (oldApptId: string, newSlotId: string): Promise<boolean> => {
        if (IS_MOCK) {
            const oldApptIndex = mockStore.appointments.findIndex(a => a.id === oldApptId);
            if (oldApptIndex === -1) throw new Error('Mock: Old appointment not found');

            const oldAppt = mockStore.appointments[oldApptIndex];
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

            mockStore.appointments.splice(oldApptIndex, 1);
            mockStore.appointments.push(newAppt);
            mockStore.save();
            return true;
        }

        const { data, error } = await (supabase as any).rpc('reschedule_appointment_swap', {
            p_old_appointment_id: oldApptId,
            p_new_slot_id: newSlotId
        } as any);

        if (error) throw error;
        return data;
    },

    updateAppointmentStatus: async (id: string, status: Appointment['status']): Promise<Appointment> => {
        if (IS_MOCK) {
            const idx = mockStore.appointments.findIndex(a => a.id === id);
            if (idx >= 0) {
                const isBooked = ['confirmed', 'completed', 'blocked'].includes(status);
                const updated = {
                    ...mockStore.appointments[idx],
                    status: status,
                    is_booked: isBooked
                };
                mockStore.appointments[idx] = updated;
                mockStore.save();
                return updated as Appointment;
            }
        }

        const { data, error } = await (supabase as any)
            .from('appointments')
            .update({ status } as any)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Appointment;
    },

    getAllAppointments: async (): Promise<Appointment[]> => {
        if (IS_MOCK) {
            mockStore.load();
            return mockStore.appointments;
        }
        const { data, error } = await (supabase as any)
            .from('appointments')
            .select('*, provider:users!provider_id(token_alias, service_type), member:users!member_id(token_alias)')
            .order('start_time', { ascending: false });

        if (error) throw error;
        return (data || []) as Appointment[];
    },

    checkAvailability: async (date: Date): Promise<boolean> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return true;

        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        if (IS_MOCK) {
            return !mockStore.appointments.some(a =>
                a.member_id === user.id &&
                new Date(a.start_time) >= start &&
                new Date(a.start_time) <= end &&
                a.status !== 'cancelled'
            );
        }

        const { count, error } = await (supabase as any)
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('member_id', user.id)
            .neq('status', 'cancelled')
            .gte('start_time', start.toISOString())
            .lte('start_time', end.toISOString());

        if (error) throw error;
        return (count || 0) === 0;
    },

    createAppointment: async (appt: Omit<Appointment, 'id' | 'created_at' | 'provider' | 'member'>): Promise<Appointment> => {
        if (IS_MOCK) {
            const newAppt: Appointment = {
                id: `mock-appt-create-${Date.now()}`,
                ...appt,
                is_booked: true,
                created_at: new Date().toISOString(),
                provider: { token_alias: 'Provider', service_type: 'PRIMARY' } // Mock default
            };
            mockStore.appointments.push(newAppt);
            mockStore.save();
            return newAppt;
        }

        const { data, error } = await (supabase as any)
            .from('appointments')
            .insert({ ...appt, is_booked: true })
            .select()
            .single();

        if (error) throw error;
        return data as Appointment;
    }
};
