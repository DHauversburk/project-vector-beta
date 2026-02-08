export type Feedback = {
    id: string;
    appointment_id: string;
    rating: number;
    comment?: string;
    created_at: string;
};

export type Appointment = {
    id: string;
    provider_id: string;
    member_id: string | null;
    start_time: string;
    end_time: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'blocked';
    notes?: string;
    is_booked: boolean;
    is_video?: boolean;
    created_at: string;
    provider?: {
        token_alias?: string;
        service_type?: string;
    };
    member?: {
        token_alias?: string;
    };
};

export type Member = {
    id: string;
    token_alias: string;
    role: string;
    status: string;
    created_at: string;
};

export type ProviderResource = {
    id: string;
    provider_id: string;
    title: string;
    url: string;
    category: 'video' | 'article' | 'worksheet' | 'exercise' | 'other';
    description?: string;
    created_at: string;
};

export type EncounterNoteCategory =
    | 'question'
    | 'counseling'
    | 'reschedule'
    | 'follow_up'
    | 'routine'
    | 'urgent'
    | 'administrative'
    | 'other';

export type EncounterNoteStatus = 'active' | 'requires_action' | 'resolved';

export type EncounterNote = {
    id: string;
    provider_id: string;
    member_id: string;
    member_name?: string;
    category: EncounterNoteCategory;
    content: string;
    created_at: string;
    resolved?: boolean;
    /** New: Action status for tracking workflow */
    status: EncounterNoteStatus;
    /** New: Linked follow-up appointment (if created from note) */
    follow_up_appointment_id?: string;
    /** New: Archival status */
    archived: boolean;
    archived_at?: string;
    /** New: Updated timestamp for edits */
    updated_at?: string;
};

/** Aggregate statistics for preserved analytics */
export type NoteStatistics = {
    period: string; // YYYY-MM format
    provider_id: string;
    total_encounters: number;
    by_category: Record<EncounterNoteCategory, number>;
    unique_patients: number;
    requires_action_count: number;
    created_at: string;
};

export type WaitlistEntry = {
    id: string;
    member_id: string;
    member_name: string;
    provider_id: string;
    service_type: string;
    preferred_days?: number[];
    note?: string;
    created_at: string;
    status: 'active' | 'fulfilled' | 'cancelled';
};

export interface HelpRequest {
    id: string;
    member_id: string;
    member_name?: string;
    provider_id?: string;
    category: 'question' | 'reschedule' | 'urgent' | 'technical' | 'other';
    subject: string;
    message: string;
    status: 'pending' | 'in_progress' | 'resolved';
    created_at: string;
    resolved_at?: string;
    resolution_note?: string;
}

export interface ScheduleUpdate {
    id: string;
    type: 'new' | 'cancelled' | 'rescheduled';
    patientName: string;
    reason: string;
    time: string;
    timestamp: Date;
}

export type ViewMode = 'day' | 'week' | 'month';

export type PublicUser = {
    id: string;
    token_alias: string;
    role: string;
    service_type: string;
    status?: string;
    created_at?: string;
};

export type ProviderProfile = {
    id: string;
    token_alias: string;
    role: 'provider';
    service_type: string;
};

export type AuditLog = {
    id: string;
    action_type: string;
    description: string;
    severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
    metadata?: Record<string, unknown>;
    created_at: string;
    actor_id?: string;
};

export type SystemStats = {
    total_users: number;
    active_appointments: number;
    available_slots: number;
    errors_today: number;
    duplicates: number;
};

export interface GenerateSlotsResult {
    success: boolean;
    count?: number;
    slots?: Appointment[];
}
