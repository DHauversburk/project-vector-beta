import { useEffect, useState, useCallback } from 'react';
import { api, type Appointment, type EncounterNote } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { format, parseISO, isAfter, isBefore, isValid } from 'date-fns';
import {
    LayoutDashboard, Users, Clock, AlertCircle,
    ArrowRight, Bell, AlertTriangle
} from 'lucide-react';
import { generatePatientCodename } from '../../lib/codenames';
import { toast } from 'sonner';
import { PendingRequests } from './PendingRequests';
import { WaitlistManager } from './WaitlistManager';
import { ConfirmModal } from '../ui/ConfirmModal';
import { MetricCard } from '../ui/MetricCard';
import { TodayAgenda } from './TodayAgenda';

export const ProviderOverview = ({ onNavigate }: { onNavigate: (view: string) => void }) => {
    const { user } = useAuth();
    const [todayAppts, setTodayAppts] = useState<Appointment[]>([]);
    const [helpRequestCount, setHelpRequestCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmModal, setConfirmModal] = useState<{ open: boolean; apptId: string | null }>({ open: false, apptId: null });
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [actionNotes, setActionNotes] = useState<EncounterNote[]>([]);

    const load = useCallback(async () => {
        if (!user) return;
        const now = new Date();
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);

        try {
            const [schedule, requests, notes] = await Promise.all([
                api.getProviderSchedule(user.id, start.toISOString(), end.toISOString()),
                api.getPendingHelpRequests(),
                api.getProviderEncounterNotes(20, false)
            ]);
            setTodayAppts(schedule.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));
            setHelpRequestCount(requests.length);
            // Filter to only notes requiring action
            setActionNotes(notes.filter(n => n.status === 'requires_action').slice(0, 5));
        } catch (err) {
            console.error("Failed to load overview data", err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        load();
        const interval = setInterval(load, 30000); // 30s refresh
        return () => clearInterval(interval);
    }, [load]);

    const safeParse = (dateStr: string) => {
        try {
            const d = parseISO(dateStr);
            return isValid(d) ? d : new Date();
        } catch {
            return new Date();
        }
    };

    const handleNoShow = async () => {
        if (!confirmModal.apptId) return;
        setConfirmLoading(true);
        try {
            await api.providerCancelAppointment(confirmModal.apptId, 'Patient No-Show recorded by provider');
            toast.success('Patient marked as no-show');
            load();
            setConfirmModal({ open: false, apptId: null });
        } catch (err) {
            console.error(err);
            toast.error('Failed to update status');
        } finally {
            setConfirmLoading(false);
        }
    };

    const now = new Date();
    const booked = todayAppts.filter(a => a.member_id && a.is_booked);
    const remaining = booked.filter(a => isAfter(safeParse(a.end_time), now)).length;
    const nextAppt = booked.find(a => isAfter(safeParse(a.start_time), now));
    const currentAppt = booked.find(a => isBefore(safeParse(a.start_time), now) && isAfter(safeParse(a.end_time), now));

    const filteredAgenda = booked.filter(apt => {
        const codename = generatePatientCodename(apt.member_id!).toLowerCase();
        const notes = (apt.notes || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        return codename.includes(search) || notes.includes(search);
    });

    if (loading) return <div className="p-8 flex items-center justify-center h-full"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>;

    const shiftEnd = todayAppts.length > 0 ? format(safeParse(todayAppts[todayAppts.length - 1].end_time), 'HH:mm') : null;

    // ...

    return (
        <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto p-4 sm:p-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-row items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-3 md:pb-6 gap-2 md:gap-4">
                <div>
                    <h1 className="hidden md:flex text-3xl font-black text-slate-900 dark:text-white tracking-tight items-center gap-3" data-tour="dashboard-title">
                        <LayoutDashboard className="w-8 h-8 text-indigo-600" /> COMMAND CENTER
                    </h1>
                    {/* Mobile Title */}
                    <div className="md:hidden flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Today's Operations</span>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            {format(now, 'MMM do')} <span className="text-indigo-600">OpDay {format(now, 'dd')}</span>
                        </h2>
                    </div>

                    <p className="hidden md:block text-slate-600 dark:text-slate-300 font-medium mt-1 uppercase tracking-wide text-xs">
                        {format(now, 'EEEE, MMMM do')}
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold mx-2">OpDay {format(now, 'dd')}</span>
                        {shiftEnd && <span className="text-slate-400"> • Ends {shiftEnd}</span>}
                    </p>
                    {/* Mobile Subtext */}
                    <p className="md:hidden text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">
                        {format(now, 'EEEE')} {shiftEnd ? `• Ends ${shiftEnd}` : ''}
                    </p>
                </div>
                <div className={`px-2 md:px-4 py-1.5 md:py-2 rounded-lg border flex items-center gap-2 md:gap-3 ${currentAppt ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'}`}>
                    <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full animate-pulse ${currentAppt ? 'bg-indigo-600' : 'bg-emerald-500'}`}></div>
                    <div>
                        <div className="text-[9px] md:text-[10px] uppercase font-black tracking-widest text-slate-600 dark:text-slate-300">Status</div>
                        <div className="font-bold text-xs md:text-sm text-slate-900 dark:text-white">{currentAppt ? 'BUSY' : 'READY'}</div>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                <MetricCard icon={Users} label="Daily Census" value={booked.length.toString()} sub={`${remaining} remaining`} color="indigo" />
                <MetricCard icon={Clock} label="Next Patient" value={nextAppt ? format(safeParse(nextAppt.start_time), 'HH:mm') : '--:--'} sub={nextAppt ? generatePatientCodename(nextAppt.member_id!) : 'No more today'} color="emerald" />
                <div className="col-span-2 md:col-span-1">
                    <MetricCard icon={AlertCircle} label="Help Center" value={helpRequestCount.toString()} sub="Pending Requests" color="rose" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <TodayAgenda
                        appointments={filteredAgenda}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        onNavigate={onNavigate}
                        onNoShow={(id) => setConfirmModal({ open: true, apptId: id })}
                        safeParse={safeParse}
                        now={now}
                    />
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                        <h3 className="text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <button onClick={() => onNavigate('schedule')} className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-between group text-slate-900 dark:text-slate-300">
                                Manage Availability <ArrowRight className="w-4 h-4" />
                            </button>
                            <button onClick={() => onNavigate('tokens')} className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-between group text-slate-900 dark:text-slate-300">
                                Patient Directory <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                        <h3 className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Bell className="w-4 h-4" /> System Notices
                        </h3>
                        <div className="space-y-3">
                            <div className="text-[10px] p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded text-amber-800 dark:text-amber-200 uppercase font-bold tracking-tight">
                                <strong>Reminder:</strong> Please verify all PWA tokens before end of shift.
                            </div>
                        </div>
                    </div>

                    <WaitlistManager />

                    {/* Notes Requiring Action Widget */}
                    {actionNotes.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-800/50 p-5 shadow-sm">
                            <h3 className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> Notes Requiring Action
                            </h3>
                            <div className="space-y-2">
                                {actionNotes.map((note) => (
                                    <button
                                        key={note.id}
                                        onClick={() => onNavigate('logs')}
                                        className="w-full text-left p-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/10 dark:hover:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-lg group transition-all"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] uppercase font-black tracking-wider text-rose-600 dark:text-rose-400 mb-1">
                                                    {note.member_name || 'Patient'}
                                                </div>
                                                <div className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 font-medium">
                                                    {note.content}
                                                </div>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                            {actionNotes.length >= 5 && (
                                <button
                                    onClick={() => onNavigate('logs')}
                                    className="w-full mt-3 text-center text-[10px] uppercase font-black tracking-wider text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                                >
                                    View All ({actionNotes.length}+)
                                </button>
                            )}
                        </div>
                    )}

                    <PendingRequests />
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmModal.open}
                onClose={() => setConfirmModal({ open: false, apptId: null })}
                onConfirm={handleNoShow}
                loading={confirmLoading}
                variant="destructive"
                title="Mark as No-Show?"
                description="This will cancel the patient's appointment and update their clinical record. This action cannot be reversed."
                confirmLabel="Confirm No-Show"
            />
        </div>
    );
};
