/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase, IS_MOCK } from '../supabase';
import { mockStore } from './mockStore';

import type { PublicUser, AuditLog, SystemStats } from './types';

export const adminActions = {
    /**
     * Gets List of Members (Token Station).
     */
    getMembers: async (search?: string): Promise<PublicUser[]> => {
        if (IS_MOCK) {
            const mockMembers = [
                { id: 'mock-user-8821', token_alias: 'PATIENT ALPHA', role: 'member', status: 'active', created_at: new Date().toISOString() },
                { id: 'mock-user-3392', token_alias: 'PATIENT BRAVO', role: 'member', status: 'active', created_at: new Date().toISOString() },
                { id: 'mock-user-1102', token_alias: 'PATIENT CHARLIE', role: 'member', status: 'active', created_at: new Date().toISOString() }
            ];
            if (search) {
                return mockMembers.filter(m => m.token_alias.includes(search.toUpperCase()) || m.id.includes(search)) as PublicUser[];
            }
            return mockMembers as PublicUser[];
        }

        let query = (supabase as any).from('users').select('*, appointments!member_id(count)').eq('role', 'member');
        if (search) {
            query = query.or(`token_alias.ilike.%${search}%,id.eq.${search}`);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []) as PublicUser[];
    },

    /**
     * Admin: Update Member Profile directly.
     */
    updateUser: async (id: string, updates: Partial<PublicUser>): Promise<PublicUser> => {
        const { data, error } = await (supabase as any).from('users').update(updates).eq('id', id);
        if (error) throw error;
        return data as PublicUser;
    },

    /**
     * Admin: Reset User Security (PIN/Password).
     */
    adminResetUserSecurity: async (userId: string): Promise<boolean> => {
        localStorage.removeItem(`TACTICAL_PIN_${userId}`);
        return true;
    },

    /**
     * Wipes all mock data.
     */
    resetMockData: async (): Promise<boolean> => {
        mockStore.reset();
        return true;
    },

    /**
     * Fixes duplicate user entries via RPC.
     */
    fixDuplicateUsers: async (): Promise<number> => {
        const { data, error } = await (supabase as any).rpc('fix_duplicate_users');
        if (error) throw error;
        return data as number;
    },

    /**
     * Logs an event to the audit log.
     */
    logEvent: async (type: string, description: string, severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' = 'INFO', metadata: Record<string, unknown> = {}): Promise<void> => {
        try {
            await (supabase as any).rpc('log_event', {
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
    getAuditLogs: async (filters: { type?: string; severity?: string, limit?: number } = {}): Promise<AuditLog[]> => {
        const { data, error } = await (supabase as any).rpc('get_audit_logs', {
            p_limit: filters.limit || 50,
            p_type: filters.type || null,
            p_severity: filters.severity || null
        });
        if (error) throw error;
        return (data || []) as AuditLog[];
    },

    /**
     * Retrieves system statistics.
     */
    getSystemStats: async (): Promise<SystemStats> => {
        if (IS_MOCK) {
            mockStore.load();
            const activeAppts = mockStore.appointments.filter(a =>
                a.status !== 'cancelled' && new Date(a.start_time) > new Date()
            ).length;
            return {
                total_users: 25,
                active_appointments: activeAppts,
                available_slots: 42,
                errors_today: 0,
                duplicates: 0
            };
        }

        const { data, error } = await (supabase as any).rpc('get_system_stats');
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
        return data as SystemStats;
    },

    /**
     * Admin: Create New User (RPC)
     */
    adminCreateUser: async (email: string, pass: string, token: string, role: string, serviceType: string): Promise<string> => {
        if (IS_MOCK) {
            console.log('[MOCK] Created user:', { email, token });
            return 'mock-user-id-' + Math.random();
        }

        const { data: userId, error } = await (supabase as any).rpc('admin_create_user', {
            new_email: email,
            new_password: pass,
            new_token: token,
            new_role: role,
            new_service_type: serviceType
        });

        if (error) throw error;
        return userId as string;
    },

    /**
     * Admin: Provision Member
     */
    provisionMember: async (token: string, serviceType: string): Promise<string> => {
        if (IS_MOCK) return 'mock-id-' + Math.random();
        const { data, error } = await (supabase as any).rpc('provision_member', {
            p_token: token,
            p_service_type: serviceType
        });
        if (error) throw error;
        return data as string;
    },

    /**
     * Prune inactive users
     */
    pruneInactiveUsers: async (days: number): Promise<number> => {
        if (IS_MOCK) {
            console.log('[MOCK] Pruned users older than', days);
            return Math.floor(Math.random() * 10);
        }
        const { data, error } = await (supabase as any).rpc('admin_prune_unused_accounts', { days_inactive: days });
        if (error) throw error;
        return data as number;
    },

    /**
     * Admin: Delete User
     */
    adminDeleteUser: async (userId: string): Promise<void> => {
        if (IS_MOCK) return;
        const { error } = await (supabase as any).rpc('admin_delete_user', { target_user_id: userId });
        if (error) throw error;
    }
};
