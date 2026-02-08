import { useState, useEffect, useCallback, useRef } from 'react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, addMonths, subMonths, startOfMonth, parseISO } from 'date-fns';
import { api, type Appointment, type ScheduleUpdate, type ViewMode } from '../lib/api';
import { supabase } from '../lib/supabase';
import { generatePatientCodename } from '../lib/codenames';
import { toast } from 'sonner';
import { useOffline } from '../contexts/OfflineContext';

export function useProviderSchedule() {
    const { executeMutation } = useOffline();
    const [viewMode, setViewMode] = useState<ViewMode>('week');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [patientHistory, setPatientHistory] = useState<Appointment[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [updates, setUpdates] = useState<ScheduleUpdate[]>([]);
    const [showUpdates, setShowUpdates] = useState(false);
    const lastFetchRef = useRef<string[]>([]);
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
    const [confirmModal, setConfirmModal] = useState<{
        open: boolean;
        title: string;
        description: string;
        action: () => Promise<void>;
        variant?: 'destructive' | 'warning' | 'primary';
    } | null>(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const loadAppointments = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let start = startOfWeek(currentDate, { weekStartsOn: 0 });
            let end = addDays(start, 7);

            if (viewMode === 'month') {
                start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
                end = addDays(start, 42);
            } else if (viewMode === 'day') {
                start = new Date(currentDate);
                start.setHours(0, 0, 0, 0);
                end = new Date(currentDate);
                end.setHours(23, 59, 59, 999);
            }

            const data = await api.getProviderSchedule(user.id, start.toISOString(), end.toISOString());
            setAppointments(data);
        } catch (error) {
            console.error("Failed to load schedule", error);
            toast.error("Failed to sync schedule");
        } finally {
            setLoading(false);
        }
    }, [currentDate, viewMode]);

    useEffect(() => {
        loadAppointments();
    }, [loadAppointments]);

    useEffect(() => {
        refreshIntervalRef.current = setInterval(async () => {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) return;

            let start = startOfWeek(currentDate, { weekStartsOn: 0 });
            let end = addDays(start, 7);
            if (viewMode === 'month') {
                start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
                end = addDays(start, 42);
            } else if (viewMode === 'day') {
                start = new Date(currentDate);
                start.setHours(0, 0, 0, 0);
                end = new Date(currentDate);
                end.setHours(23, 59, 59, 999);
            }

            try {
                const newData = await api.getProviderSchedule(currentUser.id, start.toISOString(), end.toISOString());
                const oldIds = lastFetchRef.current;
                const newIds = newData.map(a => a.id);
                const addedAppointments = newData.filter(a => a.member_id && !oldIds.includes(a.id));

                if (addedAppointments.length > 0) {
                    const newUpdates: ScheduleUpdate[] = addedAppointments.map(a => ({
                        id: a.id,
                        type: 'new',
                        patientName: generatePatientCodename(a.member_id || ''),
                        reason: a.notes || 'General Visit',
                        time: format(parseISO(a.start_time), 'MMM d @ HH:mm'),
                        timestamp: new Date()
                    }));
                    setUpdates(prev => [...newUpdates, ...prev].slice(0, 10));
                }
                lastFetchRef.current = newIds;
                setAppointments(newData);
            } catch (err) {
                console.error("Auto-refresh failed", err);
            }
        }, 30000);

        return () => {
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
        };
    }, [currentDate, viewMode]);

    useEffect(() => {
        if (!selectedAppointment?.member_id) {
            setPatientHistory([]);
            return;
        }
        const loadHistory = async () => {
            setHistoryLoading(true);
            try {
                const allAppts = await api.getAllAppointments();
                const patientAppts = allAppts.filter(a => a.member_id === selectedAppointment.member_id);
                setPatientHistory(patientAppts.sort((a, b) =>
                    new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
                ));
            } catch (err) {
                console.error('Failed to load history', err);
            } finally {
                setHistoryLoading(false);
            }
        };
        loadHistory();
    }, [selectedAppointment]);

    const navigate = useCallback((direction: 'prev' | 'next') => {
        if (viewMode === 'week') {
            setCurrentDate(prev => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1));
        } else if (viewMode === 'day') {
            setCurrentDate(prev => direction === 'next' ? addDays(prev, 1) : addDays(prev, -1));
        } else if (viewMode === 'month') {
            setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
        }
    }, [viewMode]);

    const toggleSelection = useCallback((id: string) => {
        setSelectedSlots(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const handleSelectAll = useCallback(() => {
        if (selectedSlots.size === appointments.length) {
            setSelectedSlots(new Set());
        } else {
            setSelectedSlots(new Set(appointments.map(a => a.id)));
        }
    }, [selectedSlots.size, appointments]);

    const handleToggleBlock = async (id: string, isBlocked: boolean) => {
        const previous = [...appointments];
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, is_booked: isBlocked } : a));
        try {
            await executeMutation('TOGGLE_SLOT_BLOCK', { id, isBlocked });
        } catch {
            setAppointments(previous);
            toast.error("Failed to update status");
        }
    };

    const handleBulkDelete = async () => {
        setConfirmModal({
            open: true,
            title: 'Delete Multiple Slots?',
            description: `Verify: Delete ${selectedSlots.size} slots?`,
            variant: 'destructive',
            action: async () => {
                setConfirmLoading(true);
                const previous = [...appointments];
                const ids = Array.from(selectedSlots);
                setAppointments(prev => prev.filter(a => !selectedSlots.has(a.id)));
                try {
                    await Promise.all(ids.map(id => api.deleteAppointment(id)));
                    toast.success("Bulk delete complete");
                    setSelectedSlots(new Set());
                    setIsSelectionMode(false);
                    setConfirmModal(null);
                } catch {
                    setAppointments(previous);
                    toast.error("Bulk action failed");
                } finally {
                    setConfirmLoading(false);
                }
            }
        });
    };

    const handleDeleteSlot = async (id: string) => {
        setConfirmModal({
            open: true,
            title: 'Delete Slot?',
            description: 'Permanent removal from schedule.',
            variant: 'destructive',
            action: async () => {
                setConfirmLoading(true);
                const previous = [...appointments];
                setAppointments(prev => prev.filter(a => a.id !== id));
                try {
                    await api.deleteAppointment(id);
                    toast.success("Slot removed");
                    setConfirmModal(null);
                } catch {
                    setAppointments(previous);
                    toast.error("Failed to delete");
                } finally {
                    setConfirmLoading(false);
                }
            }
        });
    };

    const handleProviderCancel = async () => {
        if (!selectedAppointment) return;
        setConfirmLoading(true);
        try {
            await executeMutation('CANCEL_APPOINTMENT', { id: selectedAppointment.id, reason: cancelReason });
            toast.success("Appointment cancelled");

            // Optimistic update for cancellation
            setAppointments(prev =>
                prev.map(a => a.id === selectedAppointment.id ? { ...a, status: 'cancelled' } : a)
            );

            setSelectedAppointment(null);
            setIsCancelling(false);
            setCancelReason('');
            // loadAppointments(); // Don't reload if offline, rely on optimistic state
        } catch {
            toast.error("Cancellation failed");
        } finally {
            setConfirmLoading(false);
        }
    };

    const clearUpdates = useCallback(() => {
        setUpdates([]);
        setShowUpdates(false);
    }, []);

    return {
        viewMode, setViewMode,
        currentDate, setCurrentDate,
        appointments, loading,
        selectedAppointment, setSelectedAppointment,
        patientHistory, historyLoading,
        updates, showUpdates, setShowUpdates,
        isCancelling, setIsCancelling,
        cancelReason, setCancelReason,
        isSelectionMode, setIsSelectionMode,
        selectedSlots, setSelectedSlots,
        toggleSelection, handleSelectAll,
        confirmModal, setConfirmModal,
        confirmLoading,
        navigate,
        handleToggleBlock,
        handleBulkDelete,
        handleDeleteSlot,
        handleProviderCancel,
        clearUpdates,
        loadAppointments
    };
}
