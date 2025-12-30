import { useEffect, useState, useMemo } from 'react';
import { api, type Appointment } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Loader2, Plus, Star, Calendar, Clock, MapPin, X, Shield, Activity, LogOut, Moon, Sun, Lock, CalendarPlus, Zap, Menu } from 'lucide-react';
import { SecuritySettings } from '../components/SecuritySettings';
import { PatientResourcesView } from '../components/member/PatientResourcesView';
import { ServiceTeamSelector } from '../components/member/ServiceTeamSelector';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { format, parseISO, isSameDay, differenceInMinutes } from 'date-fns';
import { generateICS } from '../lib/ics';

export default function MemberDashboard() {
    const { user, role, signOut } = useAuth();
    const { theme, setTheme } = useTheme();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookingOpen, setBookingOpen] = useState(false);
    const [providers, setProviders] = useState<{ id: string, token_alias: string, service_type: string }[]>([]);

    // Supply-First Booking State
    const [availableSlots, setAvailableSlots] = useState<Appointment[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);

    // Reschedule / Swap Mode State
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [apptToReschedule, setApptToReschedule] = useState<string | null>(null);

    // Feedback State
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [feedbackApptId, setFeedbackApptId] = useState<string | null>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [feedbackLoading, setFeedbackLoading] = useState(false);

    // Form State
    const [providerId, setProviderId] = useState('');
    const [notes, setNotes] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);

    // Navigation State
    const [activeTab, setActiveTab] = useState<'ops' | 'resources' | 'security'>('ops');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [appointView, setAppointView] = useState<'upcoming' | 'history'>('upcoming');

    // Toast Notification State (non-blocking)
    const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null);
    const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    const loadData = async () => {
        try {
            const [myAppointments, providerList] = await Promise.all([
                api.getMyAppointments(),
                api.getProviders()
            ]);
            setAppointments(myAppointments);

            // Deduplicate providers by alias + service type
            // Deduplicate providers by alias + service type
            const uniqueProviders = Array.from(new Map(providerList.map((item: any) =>
                [item.token_alias + item.service_type, item])).values());

            setProviders(uniqueProviders as any);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Auto-select provider if only one available (SIMPLICITY ENHANCEMENT)
    useEffect(() => {
        if (providers.length === 1 && !providerId) {
            setProviderId(providers[0].id);
        }
    }, [providers, providerId]);

    // Session Timeout Warning & Auto-Logout (SECURITY ENHANCEMENT)
    useEffect(() => {
        let warningTimeout: NodeJS.Timeout;
        let logoutTimeout: NodeJS.Timeout;
        const WARN_TIME = 14 * 60 * 1000; // 14 minutes
        const LOGOUT_TIME = 15 * 60 * 1000; // 15 minutes

        const resetTimers = () => {
            clearTimeout(warningTimeout);
            clearTimeout(logoutTimeout);
            warningTimeout = setTimeout(() => {
                showToast('warning', 'Session expires in 1 minute - interact to stay logged in.');
            }, WARN_TIME);
            logoutTimeout = setTimeout(() => {
                signOut();
            }, LOGOUT_TIME);
        };

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => window.addEventListener(event, resetTimers));
        resetTimers();

        return () => {
            events.forEach(event => window.removeEventListener(event, resetTimers));
            clearTimeout(warningTimeout);
            clearTimeout(logoutTimeout);
        };
    }, [signOut]);

    useEffect(() => {
        if (providerId) {
            setSlotsLoading(true);
            const today = new Date().toISOString();
            api.getProviderOpenSlots(providerId, today)
                .then(setAvailableSlots)
                .catch(console.error)
                .finally(() => setSlotsLoading(false));
        } else {
            setAvailableSlots([]);
        }
    }, [providerId]);

    const startReschedule = (apptId: string) => {
        setIsRescheduling(true);
        setApptToReschedule(apptId);
        setBookingOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelReschedule = () => {
        setIsRescheduling(false);
        setApptToReschedule(null);
        setBookingOpen(false);
    };

    const getServiceTypeColor = (type?: string) => {
        if (!type) return 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400';

        const t = type.toUpperCase();
        if (t.includes('GREEN') || t.includes('MH')) return 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400';
        if (t.includes('BLUE') || t.includes('PT')) return 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400';
        if (t.includes('RED') || t.includes('FH') || t.includes('MED')) return 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400';
        if (t.includes('YELLOW') || t.includes('ADMIN')) return 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400';

        return 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400';
    };

    const formatProviderDisplay = (type: string) => {
        const t = type.toUpperCase();
        if (t.includes('MH_GREEN')) return 'Mental Health — Green Team';
        if (t.includes('MH_BLUE')) return 'Mental Health — Blue Team';
        if (t.includes('PT') || t.includes('PHYSICAL')) return 'Physical Therapy';
        if (t.includes('PRIMARY') || t.includes('PCM')) return 'Primary Care';
        return type; // Fallback
    };

    const openFeedback = (apptId: string) => {
        setFeedbackApptId(apptId);
        setFeedbackOpen(true);
        setRating(5);
        setComment('');
    };

    const submitFeedback = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedbackApptId) return;

        setFeedbackLoading(true);
        try {
            await api.submitFeedback(feedbackApptId, rating, comment);
            alert('Feedback Submitted.');
            setFeedbackOpen(false);
            setFeedbackApptId(null);
        } catch (error) {
            console.error(error);
            alert('Failed to submit feedback.');
        } finally {
            setFeedbackLoading(false);
        }
    };

    // Helper to determine location based on team/service
    const getProviderLocation = (serviceType?: string) => {
        const t = (serviceType || '').toUpperCase();
        if (t.includes('GREEN') || t.includes('MH')) return 'Clinical Node B-4 (Bldg 210)'; // Mental Health
        if (t.includes('BLUE') || t.includes('PT')) return 'Rehab Center - Wing C'; // Physical Therapy
        if (t.includes('RED') || t.includes('MED') || t.includes('FAMILY')) return 'Primary Care - Bldg 1'; // Family Health
        return 'Main Clinic Front Desk';
    };

    const handleSlotBooking = async (slotId: string) => {
        if (!notes) {
            showToast('warning', 'Please select a Reason for Visit.');
            return;
        }

        // Double-check redundancy for safety
        const slot = availableSlots.find(s => s.id === slotId);
        if (slot) {
            const hasAppointmentToday = appointments.some(appt =>
                isSameDay(parseISO(appt.start_time), parseISO(slot.start_time)) && appt.status !== 'cancelled'
            );

            if (hasAppointmentToday && !(isRescheduling && apptToReschedule)) {
                showToast('error', 'Scheduling Limit: One appointment per day reached.');
                return;
            }
        }

        setBookingLoading(true);
        try {
            if (isRescheduling && apptToReschedule) {
                await api.rescheduleAppointmentSwap(apptToReschedule, slotId);
                showToast('success', 'Appointment Rescheduled Successfully.');
            } else {
                await api.bookSlot(slotId, notes);
                showToast('success', 'Appointment Confirmed.');
            }

            // Force data reload immediately to prevent duplicate bookings
            await loadData();

            // Reset state
            setBookingOpen(false);
            setIsRescheduling(false);
            setApptToReschedule(null);
            setProviderId('');
            setNotes('');

        } catch (error) {
            console.error(error);
            alert('Booking failed. Please try again.');
        } finally {
            setBookingLoading(false);
        }
    };


    // Group slots by date with Operational Filter (07:00 - 17:00)
    const groupedSlots = useMemo(() => {
        const groups: Record<string, Appointment[]> = {};
        availableSlots.forEach(slot => {
            const date = parseISO(slot.start_time);
            const hour = parseInt(format(date, 'H'));

            // FILTER: Only show slots between 07:00 and 17:00
            if (hour < 7 || hour >= 17) return;

            const dateKey = format(date, 'yyyy-MM-dd');
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(slot);
        });
        return groups;
    }, [availableSlots]);

    // Calculate the TRUE first available slot (skipping days where member already has an appointment)
    const firstAvailableSlot = useMemo(() => {
        const sortedDates = Object.keys(groupedSlots).sort();
        for (const date of sortedDates) {
            // Check if user already has an appointment on this day
            const hasApptToday = appointments.some(appt =>
                isSameDay(parseISO(appt.start_time), parseISO(date)) && appt.status !== 'cancelled'
            );

            // If day is free of appointments, return the first slot
            if (!hasApptToday && groupedSlots[date].length > 0) {
                return groupedSlots[date][0];
            }
        }
        return null;
    }, [groupedSlots, appointments]);

    const handleCancel = async (id: string) => {
        // Removed blocking confirm dialog to debug 'light mode' issue
        // if (!confirm('Are you sure you want to cancel this appointment?')) return;

        // Policy Check: 30 minutes
        const appt = appointments.find(a => a.id === id);
        if (appt) {
            const minutesUntil = differenceInMinutes(parseISO(appt.start_time), new Date());
            if (minutesUntil < 30) {
                showToast('error', 'Late Cancellation Forbidden: Cannot cancel within 30 minutes of appointment.');
                return;
            }
        }

        // Show immediate feedback
        showToast('warning', 'Processing cancellation...');
        setLoading(true);

        try {
            // Use the correct method (RPC)
            await api.cancelAppointment(id);
            showToast('success', 'Appointment Cancelled Successfully');

            // Refresh Data
            await loadData();
        } catch (error: any) {
            console.error('Cancellation error:', error);
            let msg = error.message || 'Unknown error';
            if (msg.includes('RLS') || msg.includes('policy')) {
                msg = 'Permission Error: Access Denied.';
            }
            showToast('error', `Cancellation Failed: ${msg}`);
        } finally {
            setLoading(false);
        }
    };



    if (loading) return (
        <div className="flex flex-col items-center justify-center p-24 space-y-4">
            <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing My Care Profile...</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-indigo-100 pb-12 transition-colors">
            {/* Nav Header Area */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 shadow-sm mb-6 transition-colors">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="h-14 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Activity className="w-8 h-8 text-indigo-600 p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded" />
                            <div>
                                <h1 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Project Vector</h1>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Secure Health Identity Verified</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end hidden md:flex">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Logged in as</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 font-mono">
                                        {user?.user_metadata?.token_alias || 'Unknown'}
                                    </span>
                                    <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-black uppercase tracking-wider">
                                        {role}
                                    </span>
                                </div>
                            </div>

                            {/* Desktop Nav */}
                            <div className="hidden md:flex items-center gap-3">
                                <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-300 dark:border-slate-800">
                                    <button
                                        onClick={() => setActiveTab('ops')}
                                        className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'ops' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm shadow-slate-200/50 dark:shadow-none' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <Calendar className="w-3.5 h-3.5 inline mr-1.5" /> Appointments
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('resources')}
                                        className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'resources' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm shadow-slate-200/50 dark:shadow-none' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <Plus className="w-3.5 h-3.5 inline mr-1.5" /> Resources
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('security')}
                                        className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'security' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm shadow-slate-200/50 dark:shadow-none' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <Shield className="w-3.5 h-3.5 inline mr-1.5" /> Security
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                        className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-300 dark:border-slate-700"
                                    >
                                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={signOut}
                                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-slate-300 dark:border-slate-700"
                                        title="Sign Out"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Mobile Nav Toggle */}
                            <div className="flex md:hidden items-center gap-2">
                                <button
                                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                    className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-300 dark:border-slate-700"
                                >
                                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                </button>
                                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-900 dark:text-white">
                                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Mobile Menu Overlay */}
                {mobileMenuOpen && (
                    <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl md:hidden flex flex-col p-4 gap-2 animate-in slide-in-from-top-2">
                        <Button variant={activeTab === 'ops' ? 'secondary' : 'ghost'} size="sm" onClick={() => { setActiveTab('ops'); setMobileMenuOpen(false); }} className="justify-start h-10 text-xs font-black uppercase tracking-wider"> <Calendar className="w-4 h-4 mr-3" /> Appointments </Button>
                        <Button variant={activeTab === 'resources' ? 'secondary' : 'ghost'} size="sm" onClick={() => { setActiveTab('resources'); setMobileMenuOpen(false); }} className="justify-start h-10 text-xs font-black uppercase tracking-wider"> <Plus className="w-4 h-4 mr-3" /> Resources </Button>
                        <Button variant={activeTab === 'security' ? 'secondary' : 'ghost'} size="sm" onClick={() => { setActiveTab('security'); setMobileMenuOpen(false); }} className="justify-start h-10 text-xs font-black uppercase tracking-wider"> <Shield className="w-4 h-4 mr-3" /> Security </Button>
                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                        <Button variant="ghost" size="sm" onClick={signOut} className="justify-start h-10 text-xs font-black uppercase tracking-wider text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"> <LogOut className="w-4 h-4 mr-3" /> Sign Out </Button>
                    </div>
                )}
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${toast.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/90 dark:border-emerald-800 dark:text-emerald-300'
                        : toast.type === 'error'
                            ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/90 dark:border-red-800 dark:text-red-300'
                            : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/90 dark:border-amber-800 dark:text-amber-300'
                        }`}>
                        <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
                        <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )}

            {/* Hero & Countdown Section */}
            {!loading && appointments.length > 0 && appointments.some(a => new Date(a.start_time) > new Date() && a.status !== 'cancelled') && (
                <div className="max-w-4xl mx-auto px-4 mb-8">
                    <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-xl p-6 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-1000"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 backdrop-blur-md rounded-lg border border-white/10">
                                    <Clock className="w-8 h-8 text-indigo-300" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-1">Next Scheduled Visit</p>
                                    {(() => {
                                        const nextAppt = appointments
                                            .filter(a => new Date(a.start_time) > new Date() && a.status !== 'cancelled')
                                            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];

                                        return (
                                            <>
                                                <h2 className="text-2xl font-black tracking-tight text-white mb-0.5">
                                                    {format(parseISO(nextAppt.start_time), 'EEEE, MMMM do')}
                                                </h2>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                                                    @ {format(parseISO(nextAppt.start_time), 'HH:mm')} — <span className="text-indigo-200">
                                                        {nextAppt.notes?.split('|').find((s: string) => s.trim().startsWith('Location:'))?.replace('Location:', '').trim() || getProviderLocation(nextAppt.provider?.service_type)}
                                                    </span>
                                                </p>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                {(() => {
                                    const nextAppt = appointments
                                        .filter(a => new Date(a.start_time) > new Date() && a.status !== 'cancelled')
                                        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];

                                    const diff = new Date(nextAppt.start_time).getTime() - new Date().getTime();
                                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                                    return (
                                        <>
                                            <div className="text-center">
                                                <div className="text-3xl font-black font-mono tracking-tighter text-white">{days}</div>
                                                <div className="text-[8px] font-bold uppercase tracking-widest text-indigo-300">Days</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-3xl font-black font-mono tracking-tighter text-white">{hours}</div>
                                                <div className="text-[8px] font-bold uppercase tracking-widest text-indigo-300">Hours</div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto px-4 space-y-8">
                {activeTab === 'security' ? (
                    <SecuritySettings />
                ) : activeTab === 'resources' ? (
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">Health Resources</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-6">Educational materials from your healthcare providers</p>
                        <PatientResourcesView />
                    </div>
                ) : (
                    <>
                        <div className="flex justify-end">
                            <Button onClick={() => { cancelReschedule(); setBookingOpen(!bookingOpen); }} className="h-8 text-[10px] font-black uppercase tracking-widest bg-indigo-600 shadow-md">
                                <Plus className="mr-2 h-3.5 w-3.5" /> Schedule a Visit
                            </Button>
                        </div>

                        {/* Feedback Modal */}
                        {feedbackOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                                <div className="w-full max-w-sm bg-white dark:bg-slate-900 p-6 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95">
                                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3 text-center">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Visit Feedback</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Secure confidential report</p>
                                    </div>

                                    <form onSubmit={submitFeedback} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 text-center block">Effectiveness Index</label>
                                            <div className="flex justify-center gap-2">
                                                {[1, 2, 3, 4, 5].map((r) => (
                                                    <button
                                                        key={r}
                                                        type="button"
                                                        onClick={() => setRating(r)}
                                                        className={`w-10 h-10 rounded border text-xs font-black transition-all
                                                            ${rating === r ? 'bg-indigo-600 text-white border-indigo-600 shadow-inner' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100'}`}
                                                    >
                                                        {r}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Subjective Observations</label>
                                            <textarea
                                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-3 text-xs font-bold text-slate-700 dark:text-slate-300 min-h-[100px] outline-none focus:ring-2 focus:ring-indigo-500/10"
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                placeholder="Add brief technical details or observations..."
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button type="button" variant="ghost" onClick={() => setFeedbackOpen(false)} className="text-[10px] font-black uppercase tracking-widest">Cancel</Button>
                                            <Button type="submit" isLoading={feedbackLoading} className="bg-indigo-600 text-[10px] font-black uppercase tracking-widest h-9 px-6 shadow-sm">Submit Feedback</Button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Booking Console */}
                        {bookingOpen && (
                            <div className={`p-6 bg-white dark:bg-slate-900 border rounded-lg shadow-xl space-y-6 animate-in slide-in-from-top-4 duration-300 ${isRescheduling ? 'border-amber-200 dark:border-amber-900 ring-1 ring-amber-100 dark:ring-amber-900/30' : 'border-slate-200 dark:border-slate-800'}`}>
                                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded ${isRescheduling ? 'bg-amber-50 dark:bg-amber-950 text-amber-600' : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600'}`}>
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{isRescheduling ? 'Reschedule Appointment' : 'Clinical Service Enrollment'}</h3>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Select an available time slot</p>
                                        </div>
                                    </div>
                                    {isRescheduling && (
                                        <button onClick={cancelReschedule} className="text-[9px] font-black uppercase text-amber-600 hover:text-amber-700 bg-amber-50 dark:bg-amber-950 px-3 py-1 rounded">
                                            Cancel Reschedule
                                        </button>
                                    )}
                                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="md:col-span-2">
                                        <ServiceTeamSelector
                                            providers={providers}
                                            onProviderSelect={setProviderId}
                                            selectedProviderId={providerId}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reason for Visit</label>
                                        <select
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded h-10 px-3 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer transition-all"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        >
                                            <option value="">Select Reason...</option>
                                            <option value="Follow-up Visit (Standard)">Follow-up Visit (Standard)</option>
                                            <option value="New Health Concern">New Health Concern</option>
                                            <option value="Medication Review / Renewal">Medication Review / Renewal</option>
                                            <option value="Administrative / Documentation Request">Administrative / Documentation Request</option>
                                            <option value="Wellness / Health Screening">Wellness / Health Screening</option>
                                            <option value="Acute Symptom / Urgent Question">Acute Symptom / Urgent Question</option>
                                        </select>
                                    </div>
                                </div>

                                {providerId && (
                                    <div className="space-y-6 pt-2">
                                        {/* First Available Quick-Book */}
                                        {!slotsLoading && firstAvailableSlot && notes && (
                                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4 text-white shadow-lg">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                                            <Zap className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-black uppercase tracking-widest">Quick Book</h4>
                                                            <p className="text-[10px] font-bold text-white/70 mt-0.5">
                                                                First available: {format(parseISO(firstAvailableSlot.start_time), 'EEE, MMM d @ HH:mm')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleSlotBooking(firstAvailableSlot.id)}
                                                        disabled={bookingLoading}
                                                        className="px-4 py-2 bg-white text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-md active:scale-95"
                                                    >
                                                        {bookingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Book Now'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {slotsLoading ? (
                                            <div className="flex items-center gap-2 py-8 justify-center">
                                                <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
                                                <span className="text-[10px] font-black uppercase text-slate-300">Syncing Availability Table...</span>
                                            </div>
                                        ) : Object.keys(groupedSlots).length === 0 ? (
                                            <div className="text-center border border-dashed border-slate-200 dark:border-slate-800 p-8 rounded-lg space-y-4">
                                                <div className="text-[10px] font-black uppercase text-slate-400">
                                                    No currently available slots for this provider.
                                                </div>
                                            </div>
                                        ) : (
                                            Object.entries(groupedSlots).map(([date, slots]) => {
                                                const hasApptToday = appointments.some(appt =>
                                                    isSameDay(parseISO(appt.start_time), parseISO(date)) && appt.status !== 'cancelled'
                                                );
                                                const isBlocked = hasApptToday && !(isRescheduling && apptToReschedule);

                                                return (
                                                    <div key={date} className="space-y-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`h-2 w-2 rounded-full ${isBlocked ? 'bg-red-400' : 'bg-emerald-400'}`}></div>
                                                            <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest">
                                                                {format(parseISO(date), 'EEEE, MMM do')}
                                                            </h4>
                                                            {isBlocked && (
                                                                <span className="text-[9px] font-bold text-red-500 uppercase tracking-tight flex items-center gap-1">
                                                                    <Lock className="w-3 h-3" /> Existing Appointment
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                                            {slots.map(slot => (
                                                                <button
                                                                    key={slot.id}
                                                                    onClick={() => handleSlotBooking(slot.id)}
                                                                    disabled={bookingLoading || isBlocked} // DISABLED IF Blocked
                                                                    className={`flex flex-col items-center justify-center p-3 border-2 border-dashed rounded transition-all group active:scale-95
                                                                        ${isBlocked
                                                                            ? 'opacity-40 bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                                                                            : 'border-emerald-300/50 dark:border-emerald-800/50 bg-emerald-50/10 dark:bg-emerald-900/10 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:shadow-md'
                                                                        }`}
                                                                >
                                                                    <span className={`text-xs font-black ${isBlocked ? 'text-slate-400' : 'text-emerald-700 dark:text-emerald-400 group-hover:text-emerald-600'}`}>
                                                                        {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                                    </span>
                                                                    {isBlocked ? (
                                                                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter mt-1">LOCKED</span>
                                                                    ) : (
                                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                                                                            AVAILABLE
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Schedule Timeline */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setAppointView('upcoming')}
                                        className={`text-xs font-black uppercase tracking-widest transition-colors ${appointView === 'upcoming' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 pb-2 -mb-2.5' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        My Schedule
                                    </button>
                                    <button
                                        onClick={() => setAppointView('history')}
                                        className={`text-xs font-black uppercase tracking-widest transition-colors ${appointView === 'history' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 pb-2 -mb-2.5' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        History / Past
                                    </button>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline-block">
                                    {appointView === 'upcoming' ? 'Active Visits' : 'Archived Records'}
                                </span>
                            </div>

                            <div className="grid gap-3">
                                {(() => {
                                    const filtered = appointView === 'upcoming'
                                        ? appointments.filter(a => a.status !== 'cancelled' && new Date(a.start_time) >= new Date()).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                                        : appointments.filter(a => a.status === 'cancelled' || new Date(a.start_time) < new Date()).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

                                    if (filtered.length === 0) return (
                                        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-lg shadow-sm">
                                            <Clock className="w-12 h-12 text-slate-100 dark:text-slate-800 mx-auto mb-4" />
                                            <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">
                                                {appointView === 'upcoming' ? 'No Upcoming Appointments' : 'No History Records Found'}
                                            </p>
                                        </div>
                                    );

                                    return filtered.map((apt) => {
                                        const cancelReason = apt.notes?.split('|').find((s: string) => s.trim().startsWith('CANCEL_REASON:'))?.replace('CANCEL_REASON:', '').trim();

                                        return (
                                            <div key={apt.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white dark:bg-slate-900 border rounded-lg shadow-sm transition-all hover:shadow-md group ${apt.status === 'cancelled' ? 'border-red-100 dark:border-red-900/30 opacity-75' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900'}`}>
                                                <div className="flex items-center gap-5">
                                                    <div className={`hidden sm:flex flex-col items-center justify-center w-14 h-14 border rounded-md shrink-0 ${apt.status === 'cancelled' ? 'bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/30 text-red-300' : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-300'}`}>
                                                        <span className="text-[9px] font-black uppercase opacity-50">{format(parseISO(apt.start_time), 'MMM').toUpperCase()}</span>
                                                        <span className="text-lg font-black tracking-tighter">{format(parseISO(apt.start_time), 'dd')}</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-3">
                                                            <h4 className={`text-sm font-black tracking-tight uppercase ${apt.status === 'cancelled' ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>
                                                                {format(parseISO(apt.start_time), 'MMM d')} • {format(parseISO(apt.start_time), 'HH:mm')}
                                                            </h4>
                                                            {apt.status === 'cancelled' ? (
                                                                <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[8px] font-black uppercase px-2 py-1 rounded border border-red-200 dark:border-red-800">
                                                                    CANCELLED
                                                                </span>
                                                            ) : (
                                                                <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${getServiceTypeColor(apt.provider?.service_type)}`}>
                                                                    {formatProviderDisplay(apt.provider?.service_type || 'MEDICAL SERVICE')}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3 opacity-50" /> Clinical Node B-4</span>
                                                                <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 opacity-50" /> ID: {apt.id.slice(0, 8)}</span>
                                                            </div>
                                                            {cancelReason && (
                                                                <div className="text-[10px] font-bold text-red-500 uppercase tracking-wide flex items-center gap-1 mt-1">
                                                                    <span>Reason:</span> {cancelReason}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 sm:mt-0 flex items-center justify-end gap-2 relative z-50">
                                                    {/* Rebook option for Cancelled/Past */}
                                                    {(apt.status === 'cancelled' || new Date(apt.start_time) < new Date()) && (
                                                        <button
                                                            onClick={() => { setProviderId(apt.provider_id); setBookingOpen(true); }}
                                                            className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded text-[9px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all"
                                                        >
                                                            Book Again
                                                        </button>
                                                    )}

                                                    {/* Add to Calendar Button (Active Only) */}
                                                    {(apt.status === 'pending' || apt.status === 'confirmed') && new Date(apt.start_time) >= new Date() && (
                                                        <button
                                                            onClick={() => generateICS({
                                                                title: `Medical Appointment - ${formatProviderDisplay(apt.provider?.service_type || 'Visit')}`,
                                                                description: apt.notes || 'Scheduled medical appointment',
                                                                location: 'Clinical Node B-4',
                                                                startTime: apt.start_time,
                                                                endTime: apt.end_time
                                                            })}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all"
                                                            title="Download .ics file"
                                                        >
                                                            <CalendarPlus className="w-3 h-3" /> Calendar
                                                        </button>
                                                    )}

                                                    {(apt.status === 'pending' || apt.status === 'confirmed') && new Date(apt.start_time) >= new Date() && (
                                                        <>
                                                            <button onClick={() => startReschedule(apt.id)} className="px-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                                                                Reschedule
                                                            </button>
                                                            <button onClick={() => handleCancel(apt.id)} className="flex items-center gap-1.5 px-4 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded text-[9px] font-black uppercase tracking-widest text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all">
                                                                <X className="w-3 h-3" /> Cancel
                                                            </button>
                                                        </>
                                                    )}

                                                    {apt.status === 'confirmed' && new Date(apt.start_time) < new Date() && (
                                                        <button onClick={() => openFeedback(apt.id)} className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded text-[9px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all">
                                                            <Star className="w-3 h-3" /> Feedback
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                })()}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
