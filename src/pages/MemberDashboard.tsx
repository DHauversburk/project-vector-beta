import { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { api, type Appointment, type WaitlistEntry } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Loader2, Calendar, Clock, X, Shield, Activity, Lock, Zap, Video, FileText, ChevronDown, Download, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { format, parseISO, isSameDay, differenceInMinutes } from 'date-fns';
import { generateICS } from '../lib/ics';
import { DashboardLayout, type NavItem } from '../components/layout/DashboardLayout';
import { WelcomeModal } from '../components/onboarding/WelcomeModal';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';

// --- LAZY-LOADED COMPONENTS ---
const SecuritySettings = lazy(() => import('../components/SecuritySettings').then(m => ({ default: m.SecuritySettings })));
const PatientResourcesView = lazy(() => import('../components/member/PatientResourcesView').then(m => ({ default: m.PatientResourcesView })));
const HelpRequestModal = lazy(() => import('../components/ui/HelpRequestModal').then(m => ({ default: m.HelpRequestModal })));
const WaitlistModal = lazy(() => import('../components/ui/WaitlistModal').then(m => ({ default: m.WaitlistModal })));

// --- FEATURE COMPONENTS (Direct) ---
import { ServiceTeamSelector } from '../components/member/ServiceTeamSelector';
import { QuickActionsPanel } from '../components/member/QuickActionsPanel';
import { LoadingState } from '../components/ui/LoadingState';

/**
 * Feature-level loading fallback
 */
const FeatureLoading = () => (
    <div className="w-full flex justify-center py-12">
        <LoadingState message="ACCESSING MEDICAL DATA..." />
    </div>
);

/**
 * Live countdown to the next appointment
 */
function AppointmentCountdown({ startTime }: { startTime: string }) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const calculate = () => {
            const diff = new Date(startTime).getTime() - new Date().getTime();
            if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

            return {
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((diff % (1000 * 60)) / 1000)
            };
        };

        const timer = setInterval(() => setTimeLeft(calculate()), 1000);
        return () => clearInterval(timer);
    }, [startTime]);

    return (
        <div className="flex gap-4">
            <div className="text-center">
                <div className="text-3xl font-black font-mono tracking-tighter text-white">{timeLeft.days}</div>
                <div className="text-[8px] font-bold uppercase tracking-widest text-indigo-300">Days</div>
            </div>
            <div className="text-center">
                <div className="text-3xl font-black font-mono tracking-tighter text-white">{timeLeft.hours}</div>
                <div className="text-[8px] font-bold uppercase tracking-widest text-indigo-300">Hours</div>
            </div>
            <div className="text-center">
                <div className="text-3xl font-black font-mono tracking-tighter text-white">{timeLeft.minutes}</div>
                <div className="text-[8px] font-bold uppercase tracking-widest text-indigo-300">Mins</div>
            </div>
        </div>
    );
}

/**
 * Individual Appointment Row with Expandable Details
 */
function AppointmentRow({
    appt,
    onReschedule,
    onCancel,
    onFeedback,
    getProviderLocation
}: {
    appt: Appointment;
    onReschedule: (id: string) => void;
    onCancel: (id: string) => void;
    onFeedback: (id: string) => void;
    getProviderLocation: (type?: string) => string;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const cancelReason = appt.notes?.split('|').find((s: string) => s.trim().startsWith('CANCEL_REASON:'))?.replace('CANCEL_REASON:', '').trim();
    const diff = differenceInMinutes(parseISO(appt.start_time), new Date());
    const isPast = new Date(appt.start_time) < new Date();

    return (
        <Card
            variant={isExpanded ? 'elevated' : 'default'}
            className={cn(
                'overflow-hidden transition-all duration-300 transform',
                isExpanded ? 'scale-[1.01] border-indigo-500/30' : 'hover:scale-[1.005] hover:border-indigo-500/10',
                appt.status === 'cancelled' && 'opacity-70 grayscale-[0.5]'
            )}
        >
            <div
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-5">
                    {/* Date Badge */}
                    <div className={cn(
                        "flex flex-col items-center justify-center w-14 h-14 border rounded-xl shrink-0 transition-colors",
                        appt.status === 'cancelled'
                            ? "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 text-red-400"
                            : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-300"
                    )}>
                        <span className="text-[9px] font-black uppercase opacity-60 tracking-tighter">
                            {format(parseISO(appt.start_time), 'MMM')}
                        </span>
                        <span className="text-xl font-black tracking-tight leading-none">
                            {format(parseISO(appt.start_time), 'dd')}
                        </span>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h4 className={cn(
                                "text-sm font-black tracking-tight uppercase",
                                appt.status === 'cancelled' ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'
                            )}>
                                {format(parseISO(appt.start_time), 'HH:mm')} — {appt.provider?.token_alias || 'Staff Member'}
                            </h4>
                            {appt.status === 'cancelled' && (
                                <Badge variant="danger">Cancelled</Badge>
                            )}
                            {!isPast && appt.status !== 'cancelled' && diff < 1440 && (
                                <Badge variant="outline" className="animate-pulse border-amber-500/50 text-amber-500">Upcoming</Badge>
                            )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 tracking-wide">
                            <Activity className="w-3 h-3 text-indigo-400" />
                            <span>{getProviderLocation(appt.provider?.service_type)}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 pl-20 sm:pl-0">
                    <ChevronDown className={cn("w-5 h-5 text-slate-300 transition-transform duration-300", isExpanded && "rotate-180")} />
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-50 dark:border-slate-800 animate-in slide-in-from-top-2 duration-300">
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-4">
                            <div>
                                <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Clinical Details</h5>
                                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                                        {appt.notes?.split('|')[0] || 'No visit notes provided.'}
                                    </p>
                                </div>
                            </div>

                            {cancelReason && (
                                <div>
                                    <h5 className="text-[9px] font-black text-red-400 uppercase tracking-[0.2em] mb-2">Cancellation Protocol</h5>
                                    <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/20">
                                        <p className="text-xs font-bold text-red-600 dark:text-red-400 italic">
                                            "{cancelReason}"
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Operational Metadata</h5>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                                        <span className="text-slate-500">Service Area</span>
                                        <span className="text-slate-700 dark:text-slate-300">{appt.provider?.service_type}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                                        <span className="text-slate-500">Visit Type</span>
                                        <span className="text-indigo-500">{appt.is_video ? 'Telehealth (Encrypted)' : 'In-Clinic (Secure)'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                                        <span className="text-slate-500">Appointment ID</span>
                                        <span className="text-slate-400 font-mono tracking-tighter">{appt.id}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                        {appt.status !== 'cancelled' && (
                            <>
                                {!isPast ? (
                                    <>
                                        <Button
                                            onClick={(e) => { e.stopPropagation(); generateICS({ title: `Appointment with ${appt.provider?.token_alias || 'Provider'}`, description: appt.notes?.split('|')[0] || 'Medical Appointment', location: getProviderLocation(appt.provider?.service_type), startTime: appt.start_time, endTime: appt.end_time }); }}
                                            size="sm"
                                            variant="outline"
                                            className="h-8 text-[10px] font-black"
                                        >
                                            <Download className="mr-1.5 h-3.5 w-3.5" /> Export .ICS
                                        </Button>
                                        <Button
                                            onClick={(e) => { e.stopPropagation(); onReschedule(appt.id); }}
                                            size="sm"
                                            variant="outline"
                                            className="h-8 text-[10px] font-black"
                                        >
                                            <Clock className="mr-1.5 h-3.5 w-3.5" /> Reschedule
                                        </Button>
                                        <Button
                                            onClick={(e) => { e.stopPropagation(); onCancel(appt.id); }}
                                            size="sm"
                                            variant="destructive"
                                            className="h-8 text-[10px] font-black"
                                        >
                                            <X className="mr-1.5 h-3.5 w-3.5" /> Terminate Session
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        onClick={(e) => { e.stopPropagation(); onFeedback(appt.id); }}
                                        size="sm"
                                        variant="gradient"
                                        className="h-8 text-[10px] font-black"
                                    >
                                        <Star className="mr-1.5 h-3.5 w-3.5" /> Review Visit
                                    </Button>
                                )}
                            </>
                        )}
                        {appt.status === 'cancelled' && (
                            <p className="text-[10px] font-bold text-slate-400 italic">This record is archived and cannot be modified.</p>
                        )}
                    </div>
                </div>
            )}
        </Card>
    );
}

export default function MemberDashboard() {
    const { user, signOut } = useAuth();
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
    const [appointView, setAppointView] = useState<'upcoming' | 'history'>('upcoming');

    // Help Request State
    const [helpModalOpen, setHelpModalOpen] = useState(false);

    // Waitlist State
    const [waitlistOpen, setWaitlistOpen] = useState(false);
    const [myWaitlist, setMyWaitlist] = useState<WaitlistEntry[]>([]);

    // Toast Notification State (non-blocking)
    const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null);
    const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    const loadData = async () => {
        try {
            const [myAppointments, providerList, waitlistData] = await Promise.all([
                api.getMyAppointments(),
                api.getProviders(),
                api.getMyWaitlist()
            ]);
            setAppointments(myAppointments);
            setMyWaitlist(waitlistData);

            const uniqueProviders = Array.from(new Map(providerList.map((item: { token_alias: string, service_type: string, id: string }) =>
                [item.token_alias + item.service_type, item])).values());

            setProviders(uniqueProviders as { id: string, token_alias: string, service_type: string }[]);
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

    // Session Timeout Warning & Auto-Logout
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

    // Helper to determine location based on team/service
    const getProviderLocation = (serviceType?: string) => {
        const t = (serviceType || '').toUpperCase();
        if (t.includes('GREEN') || t.includes('MH')) return 'Clinical Node B-4 (Bldg 210)'; // Mental Health
        if (t.includes('BLUE') || t.includes('PT')) return 'Rehab Center - Wing C'; // Physical Therapy
        if (t.includes('RED') || t.includes('MED') || t.includes('FAMILY')) return 'Primary Care - Bldg 1'; // Family Health
        return 'Main Clinic Front Desk';
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

            await loadData();
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

    // Calculate the TRUE first available slot
    const firstAvailableSlot = useMemo(() => {
        const sortedDates = Object.keys(groupedSlots).sort();
        for (const date of sortedDates) {
            const hasApptToday = appointments.some(appt =>
                isSameDay(parseISO(appt.start_time), parseISO(date)) && appt.status !== 'cancelled'
            );
            if (!hasApptToday && groupedSlots[date].length > 0) {
                return groupedSlots[date][0];
            }
        }
        return null;
    }, [groupedSlots, appointments]);

    const handleCancel = async (id: string) => {
        // Policy Check: 30 minutes
        const appt = appointments.find(a => a.id === id);
        if (appt) {
            const minutesUntil = differenceInMinutes(parseISO(appt.start_time), new Date());
            if (minutesUntil < 30) {
                showToast('error', 'Late Cancellation Forbidden: Cannot cancel within 30 minutes of appointment.');
                return;
            }
        }

        showToast('warning', 'Processing cancellation...');
        setLoading(true);

        try {
            await api.cancelAppointment(id);
            showToast('success', 'Appointment Cancelled Successfully');
            await loadData();
        } catch (error: unknown) {
            const err = error as Error;
            console.error('Cancellation error:', err);
            let msg = err.message || 'Unknown error';
            if (msg.includes('RLS') || msg.includes('policy')) {
                msg = 'Permission Error: Access Denied.';
            }
            showToast('error', `Cancellation Failed: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const navItems: NavItem[] = [
        { id: 'ops', label: 'My Care', icon: Activity, onClick: () => setActiveTab('ops'), dataTour: 'nav-overview' },
        { id: 'resources', label: 'Resources', icon: FileText, onClick: () => setActiveTab('resources') },
        { id: 'security', label: 'Security', icon: Shield, onClick: () => setActiveTab('security') },
    ];

    if (loading) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <div className="flex flex-col items-center gap-4 animate-pulse">
                <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing My Care Profile...</span>
            </div>
        </div>
    );

    return (
        <DashboardLayout
            navItems={navItems}
            activeTab={activeTab}
            user={user}
            role="Member"
            onSignOut={signOut}
            title="Project Vector"
        >
            <WelcomeModal role="member" userName={user?.user_metadata?.token_alias || user?.email} />
            <div className="max-w-4xl mx-auto px-4 py-4 md:py-8 space-y-4 md:space-y-8 pb-20">
                {activeTab === 'ops' && (
                    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500">
                        <header data-tour="dashboard-title">
                            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Member Dashboard</h2>
                            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">Manage your care and appointments securely</p>
                        </header>

                        {/* Hero & Countdown Section - Premium Design */}
                        {appointments.length > 0 && appointments.some(a => new Date(a.start_time) > new Date() && a.status !== 'cancelled') && (
                            <Card variant="glass" withGradientBorder className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-none shadow-2xl overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-1000"></div>

                                <CardContent className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 p-6 md:p-8">
                                    <div className="flex items-center gap-6">
                                        <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                            <Clock className="w-10 h-10 text-indigo-300" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">Upcoming Mission</p>
                                            {(() => {
                                                const nextAppt = appointments
                                                    .filter(a => new Date(a.start_time) > new Date() && a.status !== 'cancelled')
                                                    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];

                                                return (
                                                    <>
                                                        <h2 className="text-3xl font-black tracking-tight text-white leading-tight">
                                                            {format(parseISO(nextAppt.start_time), 'EEEE, MMMM do')}
                                                        </h2>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <div className="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 text-[10px] font-black uppercase text-indigo-200">
                                                                {format(parseISO(nextAppt.start_time), 'HH:mm')}
                                                            </div>
                                                            <span className="text-slate-500 text-xs">•</span>
                                                            <CardDescription className="text-slate-400 font-bold uppercase tracking-tight">
                                                                {nextAppt.notes?.split('|').find((s: string) => s.trim().startsWith('Location:'))?.replace('Location:', '').trim() || getProviderLocation(nextAppt.provider?.service_type)}
                                                            </CardDescription>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {(() => {
                                        const nextAppt = appointments
                                            .filter(a => new Date(a.start_time) > new Date() && a.status !== 'cancelled')
                                            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];

                                        return <AppointmentCountdown startTime={nextAppt.start_time} />;
                                    })()}
                                </CardContent>
                            </Card>
                        )}

                        <QuickActionsPanel
                            onBook={() => {
                                setBookingOpen(true);
                            }}
                            onViewSchedule={() => {
                                const el = document.getElementById('schedule-section');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                                setAppointView('upcoming');
                            }}
                            onRequestHelp={() => setHelpModalOpen(true)}
                        />

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
                                                {/* Waitlist Call to Action */}
                                                {myWaitlist.some(w => w.provider_id === providerId && w.status === 'active') ? (
                                                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg inline-flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-amber-600" />
                                                        <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                                                            You are on the waitlist
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        onClick={() => setWaitlistOpen(true)}
                                                        variant="outline"
                                                        className="text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-900 dark:hover:bg-amber-900/20"
                                                    >
                                                        <Clock className="w-4 h-4 mr-2" />
                                                        Join Waitlist
                                                    </Button>
                                                )}
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
                                                                    disabled={bookingLoading || isBlocked}
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
                                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1 flex items-center justify-center gap-1">
                                                                            {slot.is_video && <Video className="w-3 h-3 text-indigo-500" />}
                                                                            {slot.is_video ? 'VIDEO' : 'CLINIC'}
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
                        <Card variant="default" id="schedule-section" data-tour="nav-appointments" className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center gap-6">
                                    <button
                                        onClick={() => setAppointView('upcoming')}
                                        className={`text-xs font-black uppercase tracking-widest transition-all ${appointView === 'upcoming' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 pb-2 -mb-[17px]' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        My Schedule
                                    </button>
                                    <button
                                        onClick={() => setAppointView('history')}
                                        className={`text-xs font-black uppercase tracking-widest transition-all ${appointView === 'history' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 pb-2 -mb-[17px]' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        History / Past
                                    </button>
                                </div>
                                <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
                                    {appointView === 'upcoming' ? 'Active' : 'Archived'}
                                </Badge>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid gap-3">
                                    {(() => {
                                        const filtered = appointView === 'upcoming'
                                            ? appointments.filter(a => a.status !== 'cancelled' && new Date(a.start_time) >= new Date()).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                                            : appointments.filter(a => a.status === 'cancelled' || new Date(a.start_time) < new Date()).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

                                        if (filtered.length === 0) return (
                                            <div className="text-center py-20 bg-slate-50/10 dark:bg-slate-900/10 border border-dashed border-slate-300 dark:border-slate-800 rounded-lg">
                                                <Clock className="w-12 h-12 text-slate-100 dark:text-slate-800 mx-auto mb-4" />
                                                <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">
                                                    {appointView === 'upcoming' ? 'No Upcoming Appointments' : 'No History Records Found'}
                                                </p>
                                            </div>
                                        );

                                        return filtered.map((apt) => (
                                            <AppointmentRow
                                                key={apt.id}
                                                appt={apt}
                                                onReschedule={startReschedule}
                                                onCancel={handleCancel}
                                                onFeedback={(id) => {
                                                    setFeedbackOpen(true);
                                                    setFeedbackApptId(id);
                                                }}
                                                getProviderLocation={getProviderLocation}
                                            />
                                        ));
                                    })()}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'resources' && (
                    <Card variant="default" className="shadow-sm animate-in fade-in duration-500">
                        <CardHeader>
                            <CardTitle className="uppercase tracking-widest">Health Resources</CardTitle>
                            <CardDescription className="uppercase text-[10px] font-bold">Educational materials from your healthcare providers</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Suspense fallback={<FeatureLoading />}>
                                <PatientResourcesView />
                            </Suspense>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'security' && (
                    <Suspense fallback={<FeatureLoading />}>
                        <SecuritySettings />
                    </Suspense>
                )}
            </div>

            {/* Modals */}
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

            {feedbackOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="w-full max-w-sm bg-white dark:bg-slate-900 p-6 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
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

            <Suspense fallback={null}>
                <HelpRequestModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
                <WaitlistModal isOpen={waitlistOpen} onClose={() => setWaitlistOpen(false)} providerId={providerId} serviceType={providers.find(p => p.id === providerId)?.service_type || ''} />
            </Suspense>

        </DashboardLayout>
    );
}
