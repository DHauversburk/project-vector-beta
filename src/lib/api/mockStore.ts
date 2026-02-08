import type { Appointment, EncounterNote, HelpRequest, WaitlistEntry, NoteStatistics } from './types';

export const mockStore = {
    appointments: [] as Appointment[],
    encounterNotes: [] as EncounterNote[],
    helpRequests: [] as HelpRequest[],
    waitlist: [] as WaitlistEntry[],
    noteStatistics: [] as NoteStatistics[],
    init: false,

    load: () => {
        const stored = localStorage.getItem('MOCK_DB_V4');
        if (stored) {
            const parsed = JSON.parse(stored);
            const now = new Date();
            let changed = false;

            const updatedAppointments = (parsed.appointments || []).map((a: Appointment) => {
                const startTime = new Date(a.start_time);
                const endTime = new Date(a.end_time);
                const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

                if (endTime < now && (a.status === 'pending' || a.status === 'confirmed')) {
                    changed = true;
                    return { ...a, status: 'completed' };
                }

                if (startTime < thirtyMinutesAgo && a.status === 'pending' && a.member_id) {
                    changed = true;
                    return { ...a, status: 'cancelled', notes: (a.notes || '') + ' [NO-SHOW]' };
                }

                return a;
            });

            mockStore.appointments = updatedAppointments;
            mockStore.encounterNotes = parsed.encounterNotes || [];
            mockStore.helpRequests = parsed.helpRequests || [];
            mockStore.waitlist = parsed.waitlist || [];
            mockStore.noteStatistics = parsed.noteStatistics || [];
            mockStore.init = true;

            if (changed) {
                mockStore.save();
            }
        } else {
            // Migration from V3
            const oldStored = localStorage.getItem('MOCK_DB_V3');
            if (oldStored) {
                const parsed = JSON.parse(oldStored);
                mockStore.appointments = parsed.appointments || [];
                mockStore.encounterNotes = parsed.encounterNotes || [];
                mockStore.helpRequests = parsed.helpRequests || [];
                mockStore.waitlist = parsed.waitlist || [];
                mockStore.noteStatistics = []; // Initialize empty stats
                mockStore.init = parsed.init || false;
                mockStore.save(); // Will save to V4
                localStorage.removeItem('MOCK_DB_V3');
            }
        }
    },

    save: () => {
        localStorage.setItem('MOCK_DB_V4', JSON.stringify({
            appointments: mockStore.appointments,
            encounterNotes: mockStore.encounterNotes,
            helpRequests: mockStore.helpRequests,
            waitlist: mockStore.waitlist,
            noteStatistics: mockStore.noteStatistics,
            init: mockStore.init
        }));
    },

    reset: () => {
        mockStore.appointments = [];
        mockStore.encounterNotes = [];
        mockStore.helpRequests = [];
        mockStore.waitlist = [];
        mockStore.noteStatistics = [];
        mockStore.init = false;
        localStorage.removeItem('MOCK_DB_V4');
        localStorage.removeItem('MOCK_DB_V3');
        localStorage.removeItem('MOCK_DB_V2');
        localStorage.removeItem('MOCK_DB_V1');
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('TACTICAL_PIN_')) {
                localStorage.removeItem(key);
            }
        });
    }
};
