import React, { useState, useEffect, useRef } from 'react';
import { api, type Appointment } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { generatePatientCodename, getShortPatientId } from '../../lib/codenames';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    User,
    Lock,
    Check,
    MoreHorizontal,
    ShieldCheck,
    X,
    Clock,
    FileText,
    History,
    Bell
} from 'lucide-react';
import {
    format,
    startOfWeek,
    addDays,
    isSameDay,
    addWeeks,
    subWeeks,
    isToday,
    parseISO,
    startOfMonth,
    addMonths,
    subMonths
} from 'date-fns';


type ViewMode = 'day' | 'week' | 'month';

type ScheduleUpdate = {
    id: string;
    type: 'new' | 'cancelled' | 'rescheduled';
    patientName: string;
    reason: string; // Visit reason from dropdown
    time: string;
    timestamp: Date;
};

export const ProviderSchedule: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('week');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    // New state for detail modal
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [patientHistory, setPatientHistory] = useState<Appointment[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Auto-refresh and update notifications
    const [updates, setUpdates] = useState<ScheduleUpdate[]>([]);
    const [showUpdates, setShowUpdates] = useState(false);
    const lastFetchRef = useRef<string[]>([]);
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Cancel Flow State
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    // Floating Tooltip State
    const [hoveredApt, setHoveredApt] = useState<Appointment | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        setTooltipPos({ x: e.clientX, y: e.clientY });
    };

    const loadAppointments = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Determine fetch range based on view
            let start = startOfWeek(currentDate, { weekStartsOn: 0 });
            let end = addDays(start, 7);

            if (viewMode === 'month') {
                start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
                end = addDays(start, 42); // 6 weeks cover
            } else if (viewMode === 'day') {
                start = new Date(currentDate);
                start.setHours(0, 0, 0, 0);
                end = new Date(currentDate);
                end.setHours(23, 59, 59, 999);
            }

            console.log("Fetching schedule for:", { providerId: user.id, start: start.toISOString(), end: end.toISOString() });

            const data = await api.getProviderSchedule(
                user.id,
                start.toISOString(),
                end.toISOString()
            );
            console.log("Schedule data received:", data);
            setAppointments(data);
        } catch (error) {
            console.error("Failed to load schedule", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAppointments();
    }, [currentDate, viewMode]);

    // Auto-refresh every 30 seconds
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

            const newData = await api.getProviderSchedule(
                currentUser.id,
                start.toISOString(),
                end.toISOString()
            );

            // Detect changes
            const oldIds = lastFetchRef.current;
            const newIds = newData.map(a => a.id);

            const addedAppointments = newData.filter(a => a.member_id && !oldIds.includes(a.id));

            if (addedAppointments.length > 0) {
                const newUpdates: ScheduleUpdate[] = addedAppointments.map(a => ({
                    id: a.id,
                    type: 'new' as const,
                    patientName: generatePatientCodename(a.member_id || ''),
                    reason: a.notes || 'General Visit',
                    time: format(parseISO(a.start_time), 'MMM d @ HH:mm'),
                    timestamp: new Date()
                }));
                setUpdates(prev => [...newUpdates, ...prev].slice(0, 10));
            }

            lastFetchRef.current = newIds;
            setAppointments(newData);
        }, 30000); // 30 second refresh

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [currentDate, viewMode]);

    // Load patient history when appointment is selected
    useEffect(() => {
        if (!selectedAppointment?.member_id) {
            setPatientHistory([]);
            return;
        }

        const loadHistory = async () => {
            setHistoryLoading(true);
            try {
                // Fetch all appointments for this patient ID from our provider's schedule
                const allAppts = await api.getAllAppointments();
                const patientAppts = allAppts.filter(a => a.member_id === selectedAppointment.member_id);
                setPatientHistory(patientAppts.sort((a, b) =>
                    new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
                ));
            } catch (err) {
                console.error('Failed to load patient history', err);
            } finally {
                setHistoryLoading(false);
            }
        };

        loadHistory();
    }, [selectedAppointment]);

    const navigate = (direction: 'prev' | 'next') => {
        if (viewMode === 'week') {
            setCurrentDate(prev => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1));
        } else if (viewMode === 'day') {
            setCurrentDate(prev => direction === 'next' ? addDays(prev, 1) : addDays(prev, -1));
        } else if (viewMode === 'month') {
            setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
        }
    };

    const handleToggleBlock = async (id: string, isBlocked: boolean) => {
        try {
            await api.toggleSlotBlock(id, isBlocked);
            loadAppointments();
        } catch (error) {
            console.error("Toggle block failed", error);
        }
    };

    const handleDeleteSlot = async (id: string) => {
        if (!confirm('Delete this appointment/slot? This cannot be undone.')) return;
        try {
            await api.deleteAppointment(id);
            loadAppointments();
        } catch (error) {
            console.error("Delete failed", error);
            alert('Failed to delete appointment.');
        }
    };

    const handleProviderCancel = async () => {
        if (!selectedAppointment) return;
        if (!cancelReason.trim()) {
            alert('Please enter a cancellation reason so the patient is informed.');
            return;
        }

        try {
            await api.providerCancelAppointment(selectedAppointment.id, cancelReason);
            setSelectedAppointment(null);
            setIsCancelling(false);
            setCancelReason('');
            loadAppointments(); // Refresh schedule
        } catch (error) {
            console.error("Cancel failed", error);
            alert('Failed to cancel appointment.');
        }
    };

    const getBlockStyle = (apt: Appointment) => {
        if (apt.member_id) {
            // Booked Patient: Solid but transparent-ish in dark mode
            return "bg-indigo-50 border-indigo-200 text-indigo-900 dark:bg-indigo-900/50 dark:border-indigo-500 dark:text-indigo-50 border shadow-sm border-l-4 border-l-indigo-600";
        }
        if (apt.is_booked) {
            // Blocked/Lunch: Amber
            if (apt.notes?.toUpperCase().includes('LUNCH') || apt.notes?.toUpperCase().includes('BREAK')) {
                return "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/30 dark:border-amber-500/50 dark:text-amber-100 border border-l-4 border-l-amber-500/80 striped-bg-amber";
            }
            // Generic Block: Slate
            return "bg-slate-100 border-slate-300 text-slate-700 dark:bg-slate-800/40 dark:border-slate-500 dark:text-slate-100 border border-l-4 border-l-slate-400";
        }
        // Open Slot: Green dashed - Transparent in dark mode
        return "bg-white border-emerald-300 border border-dashed text-slate-700 dark:bg-emerald-950/20 dark:border-emerald-400/50 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-500 dark:hover:border-emerald-300 transition-all shadow-sm";
    };

    const renderWeekView = () => {
        const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(currentDate, { weekStartsOn: 0 }), i));

        // Time Scale Configuration (06:00 - 20:00)
        const START_HOUR = 6;
        const END_HOUR = 20;
        const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;
        const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

        return (
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-800 shadow-sm selec-none">

                {/* Header Row (Days) */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-20 shadow-sm">
                    <div className="w-12 flex-shrink-0 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800"></div>
                    <div className="flex-1 grid grid-cols-7 divide-x divide-slate-200 dark:divide-slate-800">
                        {weekDays.map((day) => (
                            <div key={day.toISOString()} className={cn(
                                "p-2 text-center transition-colors",
                                isToday(day) && "bg-indigo-50/50 dark:bg-indigo-900/20"
                            )}>
                                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{format(day, 'EEE')}</div>
                                <div className={cn(
                                    "text-sm font-black",
                                    isToday(day) ? "text-indigo-600 dark:text-indigo-400" : "text-slate-900 dark:text-white"
                                )}>{format(day, 'd')}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scrollable Content Area - Compacted Height */}
                <div className="flex-1 overflow-y-auto relative no-scrollbar bg-slate-100/50 dark:bg-slate-950/50">
                    <div className="flex min-h-[540px] relative"> {/* Compacted Height */}

                        {/* Time Grid (Left Column) */}
                        <div className="w-12 flex-shrink-0 flex flex-col bg-slate-50 dark:bg-slate-900/80 border-r border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-300 select-none z-10 sticky left-0">
                            {HOURS.map(h => (
                                <div key={h} className="flex-1 relative border-b border-slate-200/50 dark:border-slate-800/50">
                                    <span className="absolute -top-2 right-1.5 bg-slate-50 dark:bg-slate-900 px-1 rounded">{h}:00</span>
                                </div>
                            ))}
                        </div>

                        {/* Appointments Grid */}
                        <div className="flex-1 grid grid-cols-7 divide-x divide-slate-200 dark:divide-slate-800 relative bg-white dark:bg-slate-950/30">

                            {/* Background Hour Lines */}
                            <div className="absolute inset-0 flex flex-col pointer-events-none z-0">
                                {HOURS.map(h => (
                                    <div key={h} className="flex-1 border-b border-slate-100 dark:border-slate-800/30 border-dashed"></div>
                                ))}
                            </div>

                            {/* Day Columns */}
                            {weekDays.map(day => (
                                <div key={day.toISOString()} className={cn(
                                    "relative h-full z-10 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group/col",
                                    isToday(day) && "bg-indigo-50/10"
                                )}>
                                    {appointments
                                        .filter(a => isSameDay(parseISO(a.start_time), day))
                                        .map(apt => {
                                            const start = parseISO(apt.start_time);
                                            const end = parseISO(apt.end_time);

                                            const startMins = (start.getHours() - START_HOUR) * 60 + start.getMinutes();
                                            // Clamp startMins to positive (don't show tasks before 6am)
                                            const validStart = Math.max(0, startMins);

                                            const duration = (end.getTime() - start.getTime()) / 60000;

                                            const top = (validStart / TOTAL_MINUTES) * 100;
                                            const height = (duration / TOTAL_MINUTES) * 100;

                                            // Skip if completely out of bounds
                                            if (validStart >= TOTAL_MINUTES) return null;

                                            return (
                                                <div
                                                    key={apt.id}
                                                    className={cn(
                                                        "absolute inset-x-1 rounded overflow-hidden p-1.5 border shadow-sm cursor-pointer hover:z-20 transition-all hover:scale-[1.02] hover:shadow-md flex flex-col group/apt uppercase tracking-tight", // Added uppercase
                                                        getBlockStyle(apt),
                                                        height < 3 ? "flex-row items-center gap-1.5 px-2" : ""
                                                    )}
                                                    style={{ top: `${top}%`, height: `${height}%`, minHeight: '22px' }} // Min height for readability
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        apt.member_id && setSelectedAppointment(apt);
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        setHoveredApt(apt);
                                                        setTooltipPos({ x: e.clientX, y: e.clientY });
                                                    }}
                                                    onMouseMove={handleMouseMove}
                                                    onMouseLeave={() => setHoveredApt(null)}
                                                >
                                                    <div className="flex items-center justify-between leading-none w-full relative">
                                                        <span className="text-[10px] font-black text-current">{format(start, 'HH:mm')}</span>

                                                        {/* Quick Actions (Hover) */}
                                                        {!apt.member_id && (
                                                            <div className="opacity-0 group-hover/apt:opacity-100 transition-opacity flex gap-1 bg-black/10 rounded px-1 backdrop-blur-sm ml-auto">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleToggleBlock(apt.id, !apt.is_booked);
                                                                    }}
                                                                    className="hover:text-indigo-800 text-[8px] font-black uppercase p-0.5"
                                                                    title={apt.is_booked ? 'Unlock' : 'Block'}
                                                                >
                                                                    {apt.is_booked ? 'Unlock' : 'Hold'}
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteSlot(apt.id);
                                                                    }}
                                                                    className="hover:text-red-700 text-[8px] font-black uppercase p-0.5 text-red-600"
                                                                    title="Delete"
                                                                >
                                                                    X
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="truncate font-black mt-0.5 w-full tracking-tight">
                                                        {apt.member_id ? (
                                                            <span className="flex items-center gap-1 text-[11px]">
                                                                <User className="w-3 h-3" /> {generatePatientCodename(apt.member_id)}
                                                            </span>
                                                        ) : (
                                                            apt.is_booked ? (
                                                                <span className="block text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-100 leading-tight">
                                                                    {apt.notes || 'BLOCKED'}
                                                                </span>
                                                            ) : <span className="flex items-center gap-1 text-[11px]"><Check className="w-3 h-3" /> OPEN</span>
                                                        )}
                                                    </div>

                                                    {/* Full Details only for Patients (avoids duplication for blocks) */}
                                                    {height > 5 && apt.member_id && (
                                                        <div className="text-[10px] font-bold opacity-100 mt-0.5 overflow-hidden leading-tight truncate">
                                                            {apt.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        );
    };

    const renderDayView = () => (
        <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm min-h-[500px]">
            <div className="px-6 py-4 border-b border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
                <div className="flex flex-col">
                    <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none mb-1">{format(currentDate, 'EEEE')}</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{format(currentDate, 'MMMM d, yyyy')}</div>
                </div>
                {isToday(currentDate) && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-500 animate-pulse"></span>
                        <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">Clinic Day Active</span>
                    </div>
                )}
            </div>
            <div className="flex-1 p-6 space-y-3 overflow-y-auto bg-slate-50/10">
                {appointments
                    .filter(a => isSameDay(parseISO(a.start_time), currentDate))
                    .length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-24">
                        <CalendarIcon className="w-16 h-16 opacity-5" />
                        <div className="text-center">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Schedule Empty</p>
                            <p className="text-[10px] uppercase font-bold text-slate-300 mt-1">No appointments assigned for this day.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-2 max-w-4xl mx-auto w-full">
                        {appointments
                            .filter(a => isSameDay(parseISO(a.start_time), currentDate))
                            .map(apt => (
                                <div
                                    key={apt.id}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded border transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-md bg-white dark:bg-slate-950",
                                        apt.member_id ? "border-indigo-300 dark:border-indigo-800 border-l-4 border-l-indigo-600 shadow-sm" :
                                            (apt.is_booked ? "border-slate-300 dark:border-slate-800 opacity-60 bg-slate-100 dark:bg-slate-900" : "border-slate-300 dark:border-slate-800 border-dashed")
                                    )}
                                >
                                    <div className="flex items-center gap-8">
                                        <div className="text-xl font-black text-slate-900 dark:text-white w-24 tracking-tighter">
                                            {format(parseISO(apt.start_time), 'HH:mm')}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                                                {apt.member_id ? (
                                                    <><ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> {generatePatientCodename(apt.member_id)}</>
                                                ) : (
                                                    apt.is_booked ? <><Lock className="w-3.5 h-3.5 text-amber-500" /> {apt.notes || 'BLOCKED'}</> : <><Check className="w-3.5 h-3.5 text-emerald-500" /> OPEN SLOT</>
                                                )}
                                            </span>
                                            {apt.member_id && apt.notes && (
                                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{apt.notes}</span>
                                            )}
                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight mt-1">
                                                {format(parseISO(apt.start_time), 'HH:mm')} — {format(parseISO(apt.end_time), 'HH:mm')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {!apt.member_id && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleToggleBlock(apt.id, !apt.is_booked)}
                                                className="h-8 text-[9px] font-black uppercase tracking-widest px-4"
                                            >
                                                {apt.is_booked ? 'Unlock' : 'Hold'}
                                            </Button>
                                        )}
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-300 hover:text-slate-600"><MoreHorizontal className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderMonthView = () => {
        const monthStart = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
        const monthEnd = addDays(monthStart, 41);
        const days = [];
        let day = monthStart;
        while (day <= monthEnd) {
            days.push(day);
            day = addDays(day, 1);
        }

        return (
            <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
                {/* Legend */}
                <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-950/50">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Legend:</span>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-2 rounded-full bg-emerald-400"></div>
                        <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400">Open</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-2 rounded-full bg-indigo-500"></div>
                        <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400">Booked</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-2 rounded-full bg-amber-400"></div>
                        <span className="text-[9px] font-bold text-slate-500">Lunch</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-2 rounded-full bg-slate-400"></div>
                        <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400">Blocked</span>
                    </div>
                </div>
                <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="py-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-slate-200 dark:bg-slate-800 gap-px border-b border-slate-200 dark:border-slate-800">
                    {days.map((d) => {
                        const dayAppts = appointments.filter(a => isSameDay(parseISO(a.start_time), d));
                        const isCurrentMonth = d.getMonth() === currentDate.getMonth();

                        // Count by type
                        const openCount = dayAppts.filter(a => !a.member_id && !a.is_booked).length;
                        const bookedCount = dayAppts.filter(a => a.member_id).length;
                        const lunchCount = dayAppts.filter(a => !a.member_id && a.is_booked && (a.notes?.toLowerCase().includes('lunch') || false)).length;
                        const blockedCount = dayAppts.filter(a => !a.member_id && a.is_booked && !(a.notes?.toLowerCase().includes('lunch') || false)).length;

                        return (
                            <div
                                key={d.toISOString()}
                                className={cn(
                                    "bg-white dark:bg-slate-900 min-h-[100px] p-2 flex flex-col transition-colors relative group cursor-pointer hover:bg-slate-50",
                                    !isCurrentMonth && "bg-slate-50/50 dark:bg-slate-950/50",
                                    isToday(d) && "bg-indigo-50/20"
                                )}
                                onClick={() => { setCurrentDate(d); setViewMode('day'); }}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={cn(
                                        "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
                                        isToday(d) ? "bg-indigo-600 text-white" : (isCurrentMonth ? "text-slate-700 dark:text-slate-300" : "text-slate-300 dark:text-slate-600")
                                    )}>
                                        {format(d, 'd')}
                                    </span>
                                    {dayAppts.length > 0 && (
                                        <span className="text-[9px] font-black text-slate-300">{dayAppts.length}</span>
                                    )}
                                </div>

                                {/* Color-coded counts */}
                                {dayAppts.length > 0 && (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {openCount > 0 && (
                                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700" title={`${openCount} Open slots`}>
                                                {openCount} open
                                            </span>
                                        )}
                                        {bookedCount > 0 && (
                                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700" title={`${bookedCount} Booked appointments`}>
                                                {bookedCount} appt
                                            </span>
                                        )}
                                        {lunchCount > 0 && (
                                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-700" title={`${lunchCount} Lunch blocks`}>
                                                {lunchCount} lunch
                                            </span>
                                        )}
                                        {blockedCount > 0 && (
                                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-slate-200 text-slate-600" title={`${blockedCount} Blocked slots`}>
                                                {blockedCount} block
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Color bars - Scrollable Container */}
                                <div className="mt-1 space-y-0.5 overflow-y-auto flex-1 h-full min-h-0 custom-scrollbar pr-1">
                                    {dayAppts.map(apt => {
                                        const isLunch = !apt.member_id && apt.is_booked && (apt.notes?.toLowerCase().includes('lunch') || false);
                                        const isBlocked = !apt.member_id && apt.is_booked && !isLunch;
                                        const isBooked = !!apt.member_id;

                                        return (
                                            <div key={apt.id} className={cn(
                                                "h-1.5 rounded-full w-full hover:scale-105 transition-transform flex-shrink-0",
                                                isBooked ? "bg-indigo-500" :
                                                    isLunch ? "bg-amber-400" :
                                                        isBlocked ? "bg-slate-400" :
                                                            "bg-emerald-400"
                                            )}
                                                onMouseEnter={(e) => {
                                                    e.stopPropagation(); // Prevent triggering day click
                                                    setHoveredApt(apt);
                                                    setTooltipPos({ x: e.clientX, y: e.clientY });
                                                }}
                                                onMouseMove={(e) => {
                                                    e.stopPropagation();
                                                    handleMouseMove(e);
                                                }}
                                                onMouseLeave={() => setHoveredApt(null)}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-300 dark:border-slate-800 bg-slate-50/30 dark:bg-transparent">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none mb-1">
                            {viewMode === 'day' ? format(currentDate, 'MMMM d, yyyy') : format(currentDate, 'MMMM yyyy')}
                        </h3>
                        <p className="ent-muted font-bold text-slate-600 dark:text-slate-400">Appointment Overview</p>
                    </div>

                    <div className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-0.5">
                        <button onClick={() => navigate('prev')} className="p-1.5 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm rounded text-slate-500 dark:text-slate-400 transition-all">
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600 transition-colors"
                        >
                            Now
                        </button>
                        <button onClick={() => navigate('next')} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-slate-500 dark:text-slate-400 transition-all">
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                <div className="flex p-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
                    {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={cn(
                                "px-4 py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-all",
                                viewMode === mode
                                    ? "bg-white text-indigo-600 shadow-sm border border-slate-100"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                            )}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 p-6 overflow-hidden">
                {loading ? (
                    <div className="h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Loading Clinical Schedule...</span>
                        </div>
                    </div>
                ) : (
                    <div className="h-full animate-in fade-in duration-300">
                        {viewMode === 'week' && renderWeekView()}
                        {viewMode === 'day' && renderDayView()}
                        {viewMode === 'month' && renderMonthView()}
                    </div>
                )}
            </div>

            {/* Updates Notification Bell */}
            {updates.length > 0 && (
                <div className="fixed top-4 right-4 z-50">
                    <button
                        onClick={() => setShowUpdates(!showUpdates)}
                        className="relative p-2 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                            {updates.length}
                        </span>
                    </button>

                    {showUpdates && (
                        <div className="absolute top-12 right-0 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden animate-in slide-in-from-top-2">
                            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Schedule Updates</span>
                                <button onClick={() => { setUpdates([]); setShowUpdates(false); }} className="text-[9px] font-bold text-indigo-600">Clear All</button>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {updates.map(update => (
                                    <div key={update.id} className="p-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "text-[9px] font-black uppercase px-1.5 py-0.5 rounded",
                                                update.type === 'new' ? 'bg-emerald-100 text-emerald-700' :
                                                    update.type === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                        'bg-amber-100 text-amber-700'
                                            )}>
                                                {update.type === 'new' ? 'NEW BOOKING' :
                                                    update.type === 'cancelled' ? 'CANCELLED' : 'RESCHEDULED'}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">{update.patientName}</p>
                                        <p className="text-[10px] text-indigo-600 font-bold">{update.reason}</p>
                                        <p className="text-[9px] text-slate-400 mt-0.5">{update.time}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Appointment Detail Modal */}
            {selectedAppointment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-indigo-600 text-white">
                            <div className="flex items-center gap-3">
                                <User className="w-6 h-6" />
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-widest">
                                        {generatePatientCodename(selectedAppointment.member_id || '')}
                                    </h3>
                                    <p className="text-[10px] font-bold text-indigo-200">
                                        ID: {getShortPatientId(selectedAppointment.member_id || '')}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedAppointment(null)} className="p-1.5 hover:bg-white/10 rounded transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Appointment Details */}
                            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-indigo-600" />
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {format(parseISO(selectedAppointment.start_time), 'EEEE, MMMM d, yyyy @ HH:mm')}
                                    </span>
                                </div>
                                {selectedAppointment.notes && (
                                    <div className="flex items-start gap-2">
                                        <FileText className="w-4 h-4 text-indigo-600 mt-0.5" />
                                        <div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Reason for Visit</span>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedAppointment.notes}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Patient History */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <History className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Patient History</span>
                                </div>

                                {historyLoading ? (
                                    <div className="text-center py-4">
                                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    </div>
                                ) : patientHistory.length > 0 ? (
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {patientHistory.filter(h => h.id !== selectedAppointment.id).slice(0, 5).map(hist => (
                                            <div key={hist.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                                                <div>
                                                    <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                                        {format(parseISO(hist.start_time), 'MMM d, yyyy @ HH:mm')}
                                                    </div>
                                                    {hist.notes && <div className="text-[9px] text-slate-500">{hist.notes}</div>}
                                                </div>
                                                <span className={cn(
                                                    "text-[8px] font-black uppercase px-1.5 py-0.5 rounded",
                                                    hist.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                        hist.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                            'bg-slate-100 text-slate-600'
                                                )}>
                                                    {hist.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-slate-400 text-center py-4">No previous appointments found</p>
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                            {!isCancelling ? (
                                <>
                                    <button
                                        onClick={() => setIsCancelling(true)}
                                        className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded transition-colors"
                                    >
                                        Cancel Appointment
                                    </button>
                                    <Button size="sm" onClick={() => setSelectedAppointment(null)}>
                                        Close
                                    </Button>
                                </>
                            ) : (
                                <div className="w-full space-y-3">
                                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-3 rounded-lg">
                                        <p className="text-[10px] font-black uppercase text-red-600 dark:text-red-400 mb-2">Cancellation Reason (Required)</p>
                                        <textarea
                                            value={cancelReason}
                                            onChange={(e) => setCancelReason(e.target.value)}
                                            placeholder="e.g. Provider unavailable, Equipment failure..."
                                            className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-950 min-h-[60px] focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => { setIsCancelling(false); setCancelReason(''); }}
                                            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handleProviderCancel}
                                            disabled={!cancelReason.trim()}
                                            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest rounded disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                        >
                                            Confirm Cancellation
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Global Fixed Tooltip */}
            {hoveredApt && (
                <div
                    className="fixed z-[9999] pointer-events-none animate-in fade-in zoom-in-95 duration-75 bg-slate-900 border border-slate-700 shadow-2xl rounded-lg p-3 text-white max-w-[280px] flex flex-col gap-1 backdrop-blur-sm bg-slate-900/95"
                    style={{
                        left: Math.min(tooltipPos.x + 16, window.innerWidth - 300),
                        top: Math.min(tooltipPos.y + 16, window.innerHeight - 200)
                    }}
                >
                    <div className="font-bold text-sm border-b border-slate-700 pb-2 mb-1 flex justify-between items-center">
                        <span className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {format(parseISO(hoveredApt.start_time), 'HH:mm')} - {format(parseISO(hoveredApt.end_time), 'HH:mm')}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider ${hoveredApt.member_id ? 'bg-indigo-500 text-white' : (hoveredApt.is_booked ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white')}`}>
                            {hoveredApt.member_id ? 'PATIENT' : (hoveredApt.is_booked ? 'BLOCKED' : 'OPEN')}
                        </span>
                    </div>

                    <div className="py-1">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Details</div>
                        <div className="text-xs text-slate-200 leading-snug font-medium">
                            {hoveredApt.notes || (hoveredApt.is_booked ? 'No details provided' : 'Available for booking')}
                        </div>
                    </div>

                    {hoveredApt.member_id && (
                        <div className="mt-1 pt-2 border-t border-slate-800">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Patient</div>
                            <div className="text-xs text-indigo-300 font-bold flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" />
                                {generatePatientCodename(hoveredApt.member_id)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
