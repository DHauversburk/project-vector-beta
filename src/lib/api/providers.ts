/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase, IS_MOCK } from '../supabase';
import { mockStore } from './mockStore';
import type { Appointment, ProviderResource, ProviderProfile, Feedback, NoteStatistics } from './types';
import { interactionActions } from './interactions';
import { format } from 'date-fns';

export const providerActions = {
    /**
     * Returns list of available providers.
     */
    getProviders: async (): Promise<ProviderProfile[]> => {
        if (IS_MOCK) {
            return [
                { id: 'mock-provider-jameson', token_alias: 'Dr. Jameson', role: 'provider', service_type: 'MH_GREEN' },
                { id: 'mock-provider-smith', token_alias: 'Dr. Smith', role: 'provider', service_type: 'PRIMARY_BLUE' },
                { id: 'mock-provider-taylor', token_alias: 'Dr. Taylor', role: 'provider', service_type: 'PT_GOLD' }
            ];
        }

        const { data, error } = await (supabase as any)
            .from('users')
            .select('id, token_alias, role, service_type')
            .eq('role', 'provider');

        if (error) throw error;
        if (!data || data.length === 0) {
            return [
                { id: 'mock-provider-jameson', token_alias: 'Dr. Jameson', role: 'provider', service_type: 'MH_GREEN' },
                { id: 'mock-provider-smith', token_alias: 'Dr. Smith', role: 'provider', service_type: 'PRIMARY' }
            ];
        }
        return data as ProviderProfile[];
    },

    /**
     * Gets available slots for a specific provider.
     */
    getProviderOpenSlots: async (providerId: string, startDate?: string): Promise<Appointment[]> => {
        if (IS_MOCK) {
            mockStore.load();
            const minTime = startDate ? new Date(startDate).getTime() : Date.now();
            const openSlots = mockStore.appointments.filter(a => {
                const t = new Date(a.start_time).getTime();
                return (
                    a.provider_id === providerId &&
                    a.status === 'pending' &&
                    a.member_id === null &&
                    t >= minTime
                );
            });
            openSlots.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
            return openSlots.slice(0, 50);
        }

        let query = (supabase as any)
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
        return (data || []) as Appointment[];
    },

    /**
     * Fetches provider's schedule (all statuses).
     */
    getProviderSchedule: async (providerId: string, startDate: string, endDate: string): Promise<Appointment[]> => {
        if (IS_MOCK) {
            mockStore.load();
            return mockStore.appointments
                .filter(a => a.provider_id === providerId && a.start_time >= startDate && a.start_time <= endDate)
                .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        }

        const { data, error } = await (supabase as any)
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
     */
    generateSlots: async (startDate: string, endDate: string, startTime: string, endTime: string, duration: number, breakMinutes: number, days: number[], isBlock: boolean = false, notes: string | null = null): Promise<unknown> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        if (IS_MOCK) {
            mockStore.load();
            const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
            const startD = new Date(sYear, sMonth - 1, sDay);
            const [eYear, eMonth, eDay] = endDate.split('-').map(Number);
            const endD = new Date(eYear, eMonth - 1, eDay);

            const addDays = (d: Date, days: number) => {
                const newDate = new Date(d);
                newDate.setDate(d.getDate() + days);
                return newDate;
            };

            for (let d = new Date(startD); d <= endD; d = addDays(d, 1)) {
                if (days.includes(d.getDay())) {
                    const [sH, sM] = startTime.split(':').map(Number);
                    let currentSlotStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), sH, sM, 0, 0);
                    const [eH, eM] = endTime.split(':').map(Number);
                    const currentDayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), eH, eM, 0, 0);

                    while (currentSlotStart.getTime() < currentDayEnd.getTime()) {
                        const currentSlotEnd = isBlock ? new Date(currentDayEnd) : new Date(currentSlotStart.getTime() + (duration * 60000));
                        if (currentSlotEnd > currentDayEnd) break;

                        const overlappingIndices = mockStore.appointments
                            .map((a, i) => {
                                const aStart = new Date(a.start_time).getTime();
                                const aEnd = new Date(a.end_time).getTime();
                                const bStart = currentSlotStart.getTime();
                                const bEnd = currentSlotEnd.getTime();
                                return (aStart < bEnd && aEnd > bStart && a.provider_id === user.id) ? i : -1;
                            })
                            .filter(i => i !== -1)
                            .sort((a, b) => b - a);

                        if (overlappingIndices.length > 0) {
                            if (isBlock) {
                                overlappingIndices.forEach(idx => {
                                    if (mockStore.appointments[idx].status === 'pending') {
                                        mockStore.appointments.splice(idx, 1);
                                    }
                                });
                            } else {
                                currentSlotStart = new Date(currentSlotEnd.getTime() + (breakMinutes * 60000));
                                continue;
                            }
                        }

                        const isVideo = !isBlock && Math.random() < 0.3;
                        mockStore.appointments.push({
                            id: `mock-gen-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                            provider_id: user.id,
                            member_id: null,
                            start_time: format(currentSlotStart, "yyyy-MM-dd'T'HH:mm:ss"),
                            end_time: format(currentSlotEnd, "yyyy-MM-dd'T'HH:mm:ss"),
                            status: isBlock ? 'blocked' : 'pending',
                            is_booked: isBlock,
                            is_video: isVideo,
                            notes: notes || (isVideo ? 'Telehealth Available' : undefined),
                            created_at: new Date().toISOString()
                        });
                        currentSlotStart = new Date(currentSlotEnd.getTime() + (breakMinutes * 60000));
                    }
                }
            }
            mockStore.save();
            return true;
        }

        const { data, error } = await (supabase as any).rpc('generate_slots', {
            p_start_date: startDate,
            p_end_date: endDate,
            p_start_time: startTime,
            p_end_time: endTime,
            p_duration_minutes: duration,
            p_break_minutes: breakMinutes,
            p_days_of_week: days,
            p_is_block: isBlock,
            p_notes: notes,
            p_timezone_offset_minutes: new Date().getTimezoneOffset()
        } as any);

        if (error) throw error;
        return data;
    },

    /**
     * Clears slots in a range.
     */
    clearSchedule: async (startDate: string, endDate: string, includeBooked: boolean = false): Promise<{ count?: number; deleted?: number; success?: boolean; method?: string }> => {
        if (IS_MOCK) {
            const initialCount = mockStore.appointments.length;
            mockStore.appointments = mockStore.appointments.filter(a => {
                if (a.start_time < startDate || a.start_time > endDate) return true;
                if (a.member_id) return !includeBooked;
                return false;
            });
            mockStore.save();
            return { count: initialCount - mockStore.appointments.length };
        }

        try {
            const { data, error } = await (supabase as any).rpc('clear_provider_schedule', {
                p_start_date: startDate,
                p_end_date: endDate,
                p_include_booked: includeBooked
            } as any);
            if (error) throw error;
            return data;
        } catch (e) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");
            let query = (supabase as any).from('appointments')
                .delete()
                .eq('provider_id', user.id)
                .gte('start_time', startDate)
                .lte('start_time', endDate);
            if (!includeBooked) query = query.is('member_id', null);
            const { data, error } = await query.select();
            if (error) throw e;
            return { success: true, deleted: data?.length || 0, method: 'client-fallback' };
        }
    },

    /**
     * Toggles 'Block' status of a slot.
     */
    toggleSlotBlock: async (slotId: string, isBlocked: boolean, notes: string | null = null): Promise<Appointment> => {
        if (slotId.startsWith('mock-') && IS_MOCK) {
            if (isBlocked) {
                const { data: { user } } = await supabase.auth.getUser();
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(9, 0, 0, 0);
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
                mockStore.appointments.push(blockedAppt);
                mockStore.save();
                return blockedAppt;
            }
        }

        const { data, error } = await (supabase as any)
            .from('appointments')
            .update({
                is_booked: isBlocked,
                status: isBlocked ? 'blocked' : 'pending',
                notes: notes
            } as any)
            .eq('id', slotId)
            .select()
            .single();

        if (error) throw error;
        return data as Appointment;
    },

    /**
     * Gets analytics data for the provider dashboard.
     */
    getAnalytics: async (): Promise<{ appointments: Appointment[]; feedback: Feedback[]; noteStats: NoteStatistics[] }> => {
        // Fetch note stats
        const noteStats = await interactionActions.getNoteStatistics(6);

        if (IS_MOCK) {
            mockStore.load();
            return { appointments: mockStore.appointments, feedback: [], noteStats };
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        const { data: appointments, error: aptError } = await (supabase as any)
            .from('appointments')
            .select('*')
            .eq('provider_id', user.id)
            .order('start_time', { ascending: false });
        if (aptError) throw aptError;
        const { data: feedback, error: fbError } = await (supabase as any)
            .from('feedback')
            .select('*')
            .in('appointment_id', (appointments || []).map((a: Appointment) => a.id));
        return { appointments: appointments || [], feedback: fbError ? [] : (feedback || []), noteStats };
    },

    /**
     * Get resources for a specific provider.
     */
    getProviderResources: async (providerId: string): Promise<ProviderResource[]> => {
        if (IS_MOCK) {
            const stored = localStorage.getItem('PROVIDER_RESOURCES');
            const allResources: ProviderResource[] = stored ? JSON.parse(stored) : [];
            return allResources.filter(r => r.provider_id === providerId);
        }
        const { data, error } = await (supabase as any)
            .from('resources')
            .select('*')
            .eq('provider_id', providerId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as ProviderResource[];
    },

    /**
     * Get all resources for the current provider.
     */
    getMyResources: async (): Promise<ProviderResource[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        if (IS_MOCK) {
            const stored = localStorage.getItem('PROVIDER_RESOURCES');
            const allResources: ProviderResource[] = stored ? JSON.parse(stored) : [];
            return allResources.filter(r => r.provider_id === user.id);
        }
        const { data, error } = await (supabase as any)
            .from('resources')
            .select('*')
            .eq('provider_id', user.id)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as ProviderResource[];
    },

    /**
     * Add a new resource.
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
        const { data, error } = await (supabase as any)
            .from('resources')
            .insert([{ provider_id: user.id, ...resource }])
            .select()
            .single();
        if (error) throw error;
        return data as ProviderResource;
    },

    /**
     * Update a resource.
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
        const { data, error } = await (supabase as any)
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
     * Delete a resource.
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
        const { error } = await (supabase as any).from('resources').delete().eq('id', id).eq('provider_id', user.id);
        if (error) throw error;
        return true;
    },

    /**
     * Get available resources for a member.
     */
    getAvailableResources: async (): Promise<{ provider: string, resources: ProviderResource[] }[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        if (IS_MOCK) {
            mockStore.load();
            const appointments = mockStore.appointments.filter(a => a.member_id === user.id);
            const providerIds = [...new Set(appointments.map(a => a.provider_id))];
            const stored = localStorage.getItem('PROVIDER_RESOURCES');
            const allResources: ProviderResource[] = stored ? JSON.parse(stored) : [];
            return providerIds.map(pid => ({
                provider: pid,
                resources: allResources.filter(r => r.provider_id === pid)
            })).filter(g => g.resources.length > 0);
        }
        const { data: appointments, error: aptError } = await (supabase as any).from('appointments').select('provider_id').eq('member_id', user.id);
        if (aptError) throw aptError;
        const providerIds = [...new Set((appointments || []).map((a: { provider_id: string }) => a.provider_id))] as string[];
        if (providerIds.length === 0) return [];
        const { data: resources, error: resError } = await (supabase as any).from('resources').select('*').in('provider_id', providerIds).order('created_at', { ascending: false });
        if (resError) throw resError;
        return providerIds.map((pid) => ({
            provider: pid,
            resources: (resources || []).filter((r: ProviderResource) => r.provider_id === pid)
        })).filter(g => g.resources.length > 0);
    }
};
