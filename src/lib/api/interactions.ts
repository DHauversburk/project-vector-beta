import { supabase } from '../supabase';
import { mockStore } from './mockStore';
import type { EncounterNote, HelpRequest, WaitlistEntry, NoteStatistics } from './types';

// Helper to update aggregated statistics
const updateStats = (note: EncounterNote) => {
    const noteDate = new Date(note.created_at);
    const period = `${noteDate.getFullYear()}-${String(noteDate.getMonth() + 1).padStart(2, '0')}`;

    let statsIndex = mockStore.noteStatistics.findIndex(s => s.period === period && s.provider_id === note.provider_id);

    if (statsIndex === -1) {
        mockStore.noteStatistics.push({
            period,
            provider_id: note.provider_id,
            total_encounters: 0,
            by_category: {
                question: 0, counseling: 0, reschedule: 0, follow_up: 0,
                routine: 0, urgent: 0, administrative: 0, other: 0
            },
            unique_patients: 0,
            requires_action_count: 0,
            created_at: new Date().toISOString()
        });
        statsIndex = mockStore.noteStatistics.length - 1;
    }

    const stats = mockStore.noteStatistics[statsIndex];
    stats.total_encounters++;
    if (stats.by_category[note.category] !== undefined) {
        stats.by_category[note.category]++;
    }

    // Check uniqueness within current notes for this period
    const existingForMember = mockStore.encounterNotes.some(n =>
        n.member_id === note.member_id &&
        n.provider_id === note.provider_id &&
        n.created_at.startsWith(period) &&
        n.id !== note.id
    );

    if (!existingForMember) {
        stats.unique_patients++;
    }

    if (note.status === 'requires_action') {
        stats.requires_action_count++;
    }
};

export const interactionActions = {
    /**
     * Creates a quick encounter note (Provider use)
     */
    addEncounterNote: async (note: Omit<EncounterNote, 'id' | 'created_at'> & { id?: string }): Promise<EncounterNote> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const newNote: EncounterNote = {
            id: note.id || `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            provider_id: user.id,

            member_id: note.member_id,
            member_name: note.member_name,
            category: note.category,
            content: note.content,
            created_at: new Date().toISOString(),
            resolved: false,
            status: note.status || 'active',
            archived: note.archived || false
        };

        mockStore.load();
        mockStore.encounterNotes.push(newNote);
        updateStats(newNote); // Update aggregates
        mockStore.save();
        return newNote;
    },

    /**
     * Get aggregated note statistics
     */
    getNoteStatistics: async (months: number = 6): Promise<NoteStatistics[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        mockStore.load();

        // Return last X months of stats for this provider
        return mockStore.noteStatistics
            .filter(s => s.provider_id === user.id)
            .sort((a, b) => b.period.localeCompare(a.period))
            .slice(0, months);
    },

    /**
     * Gets encounter notes by provider
     * @param limit Max number of notes to return
     * @param includeArchived Whether to include archived notes (default: false)
     */
    getProviderEncounterNotes: async (limit: number = 50, includeArchived: boolean = false): Promise<EncounterNote[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        mockStore.load();
        return mockStore.encounterNotes
            .filter(n => n.provider_id === user.id && (includeArchived || !n.archived))
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, limit);
    },

    /**
     * Archives a note (hides from default view but preserves data)
     */
    archiveNote: async (noteId: string): Promise<EncounterNote | null> => {
        mockStore.load();
        const idx = mockStore.encounterNotes.findIndex(n => n.id === noteId);
        if (idx >= 0) {
            mockStore.encounterNotes[idx].archived = true;
            mockStore.encounterNotes[idx].archived_at = new Date().toISOString();
            mockStore.save();
            return mockStore.encounterNotes[idx];
        }
        return null;
    },

    /**
     * Unarchives a note (restores to active view)
     */
    unarchiveNote: async (noteId: string): Promise<EncounterNote | null> => {
        mockStore.load();
        const idx = mockStore.encounterNotes.findIndex(n => n.id === noteId);
        if (idx >= 0) {
            mockStore.encounterNotes[idx].archived = false;
            mockStore.encounterNotes[idx].archived_at = undefined;
            mockStore.save();
            return mockStore.encounterNotes[idx];
        }
        return null;
    },

    /**
     * Updates the status of a note (active, requires_action, resolved)
     */
    updateNoteStatus: async (noteId: string, status: EncounterNote['status']): Promise<EncounterNote | null> => {
        mockStore.load();
        const idx = mockStore.encounterNotes.findIndex(n => n.id === noteId);
        if (idx >= 0) {
            mockStore.encounterNotes[idx].status = status;
            mockStore.encounterNotes[idx].updated_at = new Date().toISOString();
            mockStore.save();
            return mockStore.encounterNotes[idx];
        }
        return null;
    },

    /**
     * Gets encounter notes for a specific member
     */
    getMemberEncounterNotes: async (memberId: string): Promise<EncounterNote[]> => {
        mockStore.load();
        return mockStore.encounterNotes
            .filter(n => n.member_id === memberId && !n.archived)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },

    /**
     * Links a note to a follow-up appointment
     */
    linkNoteToFollowUp: async (noteId: string, appointmentId: string): Promise<EncounterNote | null> => {
        mockStore.load();
        const idx = mockStore.encounterNotes.findIndex(n => n.id === noteId);
        if (idx >= 0) {
            mockStore.encounterNotes[idx].follow_up_appointment_id = appointmentId;
            mockStore.encounterNotes[idx].updated_at = new Date().toISOString();
            mockStore.save();
            return mockStore.encounterNotes[idx];
        }
        return null;
    },

    /**
     * Updates an entire note record
     */
    updateNote: async (noteId: string, updates: Partial<EncounterNote>): Promise<EncounterNote | null> => {
        mockStore.load();
        const idx = mockStore.encounterNotes.findIndex(n => n.id === noteId);
        if (idx >= 0) {
            mockStore.encounterNotes[idx] = {
                ...mockStore.encounterNotes[idx],
                ...updates,
                updated_at: new Date().toISOString()
            };
            mockStore.save();
            return mockStore.encounterNotes[idx];
        }
        return null;
    },

    /**
     * Bulk archive all notes before a given date
     * @param beforeDate - ISO date string, archive notes created before this date
     * @param providerId - Optional provider ID to limit scope
     * @returns Number of notes archived
     */
    bulkArchiveNotes: async (beforeDate: string, providerId?: string): Promise<{ archivedCount: number; notes: EncounterNote[] }> => {
        mockStore.load();
        const cutoffDate = new Date(beforeDate);
        const now = new Date().toISOString();
        let archivedCount = 0;
        const archivedNotes: EncounterNote[] = [];

        mockStore.encounterNotes.forEach((note, idx) => {
            // Skip already archived notes
            if (note.archived) return;

            // Optional provider filter
            if (providerId && note.provider_id !== providerId) return;

            // Archive if created before cutoff
            const noteDate = new Date(note.created_at);
            if (noteDate < cutoffDate) {
                mockStore.encounterNotes[idx].archived = true;
                mockStore.encounterNotes[idx].archived_at = now;
                archivedCount++;
                archivedNotes.push(mockStore.encounterNotes[idx]);
            }
        });

        mockStore.save();
        return { archivedCount, notes: archivedNotes };
    },

    /**
     * Creates a help request (Patient use)
     */
    createHelpRequest: async (request: Omit<HelpRequest, 'id' | 'member_id' | 'status' | 'created_at'> & { id?: string }): Promise<HelpRequest> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const newRequest: HelpRequest = {
            id: request.id || `help-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            member_id: user.id,
            member_name: request.member_name,
            provider_id: request.provider_id,
            category: request.category,
            subject: request.subject,
            message: request.message,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        mockStore.load();
        mockStore.helpRequests.push(newRequest);
        mockStore.save();
        return newRequest;
    },

    /**
     * Gets help requests for the current member
     */
    getMyHelpRequests: async (): Promise<HelpRequest[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        mockStore.load();
        return mockStore.helpRequests
            .filter(r => r.member_id === user.id)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },

    /**
     * Gets all pending help requests (Provider/Admin use)
     */
    getPendingHelpRequests: async (): Promise<HelpRequest[]> => {
        mockStore.load();
        return mockStore.helpRequests
            .filter(r => r.status === 'pending' || r.status === 'in_progress')
            .sort((a, b) => {
                if (a.category === 'urgent' && b.category !== 'urgent') return -1;
                if (b.category === 'urgent' && a.category !== 'urgent') return 1;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
    },

    /**
     * Updates help request status (Provider use)
     */
    updateHelpRequestStatus: async (requestId: string, status: HelpRequest['status']): Promise<HelpRequest | null> => {
        mockStore.load();
        const idx = mockStore.helpRequests.findIndex(r => r.id === requestId);
        if (idx >= 0) {
            mockStore.helpRequests[idx].status = status;
            mockStore.save();
            return mockStore.helpRequests[idx];
        }
        return null;
    },

    /**
     * Resolves a help request with a note (Provider use)
     */
    resolveHelpRequest: async (requestId: string, resolutionNote: string): Promise<HelpRequest | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        mockStore.load();
        const idx = mockStore.helpRequests.findIndex(r => r.id === requestId);
        if (idx >= 0) {
            mockStore.helpRequests[idx].status = 'resolved';
            mockStore.helpRequests[idx].resolved_at = new Date().toISOString();
            mockStore.helpRequests[idx].resolution_note = resolutionNote;
            mockStore.helpRequests[idx].provider_id = user.id;
            mockStore.save();
            return mockStore.helpRequests[idx];
        }
        return null;
    },

    /**
     * Gets count of pending help requests (for badge)
     */
    getPendingHelpRequestCount: async (): Promise<number> => {
        mockStore.load();
        return mockStore.helpRequests.filter(r => r.status === 'pending').length;
    },

    /**
     * Joins a waitlist for a specific provider
     */
    joinWaitlist: async (providerId: string, serviceType: string, note?: string, preferredDays?: number[]): Promise<WaitlistEntry> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const entry: WaitlistEntry = {
            id: `wait-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            member_id: user.id,
            member_name: user.user_metadata?.token_alias || 'Unknown',
            provider_id: providerId,
            service_type: serviceType,
            preferred_days: preferredDays,
            note: note,
            status: 'active',
            created_at: new Date().toISOString()
        };

        mockStore.load();
        const existing = mockStore.waitlist.find(w => w.member_id === user.id && w.provider_id === providerId && w.status === 'active');
        if (existing) throw new Error('You are already on the waitlist for this provider.');

        mockStore.waitlist.push(entry);
        mockStore.save();
        return entry;
    },

    /**
     * Leaves a waitlist
     */
    leaveWaitlist: async (entryId: string): Promise<void> => {
        mockStore.load();
        const idx = mockStore.waitlist.findIndex(w => w.id === entryId);
        if (idx >= 0) {
            mockStore.waitlist[idx].status = 'cancelled';
            mockStore.save();
        }
    },

    /**
     * Gets current user's active waitlist entries
     */
    getMyWaitlist: async (): Promise<WaitlistEntry[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        mockStore.load();
        return mockStore.waitlist
            .filter(w => w.member_id === user.id && w.status === 'active')
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },

    /**
     * Gets waitlist for a provider
     */
    getProviderWaitlist: async (providerId: string): Promise<WaitlistEntry[]> => {
        mockStore.load();
        return mockStore.waitlist
            .filter(w => w.provider_id === providerId && w.status === 'active')
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
};
