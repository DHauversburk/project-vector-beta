import { supabase } from './supabase';

export type Appointment = {
    id: string;
    provider_id: string;
    member_id: string;
    start_time: string;
    end_time: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    notes?: string;
    created_at: string;
};

export const api = {
    // Appointments
    getMyAppointments: async () => {
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .order('start_time', { ascending: true });

        if (error) throw error;
        return data as Appointment[];
    },

    createAppointment: async (appointment: { provider_id: string; start_time: string; end_time: string; notes?: string }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('appointments')
            .insert({
                ...appointment,
                member_id: user.id,
            })
            .select()
            .single();

        if (error) throw error;
        return data as Appointment;
    },

    updateAppointmentStatus: async (id: string, status: Appointment['status']) => {
        const { data, error } = await supabase
            .from('appointments')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Appointment;
    },

    // Providers (for members to select)
    getProviders: async () => {
        const { data, error } = await supabase
            .from('users') // Changed from 'profiles'
            .select('id, token_alias, role, service_type')
            .eq('role', 'provider');

        if (error) throw error;
        return data;
    }
};
