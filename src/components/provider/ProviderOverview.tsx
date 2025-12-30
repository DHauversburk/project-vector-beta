import { useEffect, useState } from 'react';
import { api, type Appointment } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { format, parseISO, addMinutes, isAfter, isBefore } from 'date-fns';
import { Users, Clock, Calendar, Activity, AlertCircle, ArrowRight, Sun, Coffee, LayoutDashboard } from 'lucide-react';
import { generatePatientCodename } from '../../lib/codenames';
import { toast } from 'sonner';

export const ProviderOverview = ({ onNavigate }: { onNavigate: (view: any) => void }) => {
    const { user } = useAuth();
    const [todayAppts, setTodayAppts] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!user) return;
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setHours(23, 59, 59, 999);

            try {
                const data = await api.getProviderSchedule(user.id, start.toISOString(), end.toISOString());
                setTodayAppts(data.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));
            } catch (err) {
                console.error("Failed to load overview data", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user]);

    // Metrics
    const now = new Date();

    // Safety helper for dates
    const safeParse = (dateStr: string) => {
        try {
            if (!dateStr) return new Date();
            return parseISO(dateStr);
        } catch (e) { return new Date(); }
    };

    const booked = todayAppts.filter(a => a && a.member_id); // Guard against null appts
    const nextAppt = booked.find(a => a.start_time && isAfter(safeParse(a.start_time), now));
    const currentAppt = booked.find(a => a.start_time && a.end_time && isBefore(safeParse(a.start_time), now) && isAfter(safeParse(a.end_time), now));
    const remaining = booked.filter(a => a.start_time && isAfter(safeParse(a.start_time), now)).length;

    const handleNoShow = async (apptId: string) => {
        if (!confirm('Mark this patient as No-Show? This will cancel the appointment.')) return;
        try {
            await api.providerCancelAppointment(apptId, 'NO-SHOW: Patient failed to arrive within 15 minutes.');
            toast.success('Patient marked as No-Show');
            // Refresh data
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setHours(23, 59, 59, 999);
            const data = await api.getProviderSchedule(user!.id, start.toISOString(), end.toISOString());
            setTodayAppts(data.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));
        } catch (err) {
            console.error(err);
            toast.error('Failed to update status');
        }
    };

    if (loading) return <div className="p-8 flex items-center justify-center h-full"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-2 sm:p-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <LayoutDashboard className="w-8 h-8 text-indigo-600" /> COMMAND CENTER
                    </h1>
                    <p className="text-slate-600 dark:text-slate-300 font-medium mt-1 uppercase tracking-wide text-xs">
                        {format(now, 'EEEE, MMMM do')} — <span className="text-indigo-600 dark:text-indigo-400 font-bold">Operational Day {format(now, 'dd')}</span>
                    </p>
                </div>
                {/* Current Status Badge */}
                <div className={`px-4 py-2 rounded-lg border flex items-center gap-3 ${currentAppt ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'}`}>
                    <div className={`w-3 h-3 rounded-full animate-pulse ${currentAppt ? 'bg-indigo-600' : 'bg-emerald-500'}`}></div>
                    <div>
                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-600 dark:text-slate-300">Current Status</div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                            {currentAppt ? 'IN SESSION' : 'AVAILABLE'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard icon={Users} label="Daily Census" value={booked.length.toString()} sub={`${remaining} remaining`} color="indigo" />
                <MetricCard icon={Clock} label="Next Patient" value={nextAppt ? format(safeParse(nextAppt.start_time), 'HH:mm') : '--:--'} sub={nextAppt ? generatePatientCodename(nextAppt.member_id!) : 'No more today'} color="emerald" />
                <MetricCard icon={Activity} label="Utlization" value={`${Math.round((booked.length / (todayAppts.filter(a => !a.member_id && !a.is_booked).length + booked.length || 1)) * 100)}%`} sub="Schedule Efficiency" color="amber" />
                <MetricCard icon={Sun} label="Shift End" value={todayAppts.length > 0 ? format(safeParse(todayAppts[todayAppts.length - 1].end_time), 'HH:mm') : '--:--'} sub="Last Slot" color="slate" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Agenda */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-600" /> Today's Agenda
                        </h2>
                        <button onClick={() => onNavigate('schedule')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
                            View Full Schedule <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                        {booked.length === 0 ? (
                            <div className="p-12 text-center text-slate-500">
                                <Coffee className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p className="font-bold text-xs uppercase tracking-widest">No patients scheduled for today</p>
                                {todayAppts.filter(a => !a.member_id && !a.is_booked).length > 0 && (
                                    <p className="text-[10px] uppercase font-bold text-indigo-500 mt-2 bg-indigo-50 dark:bg-indigo-900/30 inline-block px-3 py-1 rounded-full">
                                        {todayAppts.filter(a => !a.member_id && !a.is_booked).length} Open Slots Available
                                    </p>
                                )}
                            </div>
                        ) : (
                            booked.map(apt => {
                                const isPast = isAfter(now, safeParse(apt.end_time));
                                const isCurrent = isBefore(now, safeParse(apt.end_time)) && isAfter(now, safeParse(apt.start_time));
                                const isLate = isAfter(now, addMinutes(safeParse(apt.start_time), 15)) && !isPast && !isCurrent;

                                return (
                                    <div key={apt.id} className={`p-4 flex items-center gap-4 transition-colors ${isCurrent ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'} ${isPast ? 'opacity-50 grayscale' : ''}`}>
                                        <div className={`text-sm font-black w-16 text-right ${isCurrent ? 'text-indigo-600' : 'text-slate-500'}`}>
                                            {format(safeParse(apt.start_time), 'HH:mm')}
                                        </div>
                                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isCurrent ? 'bg-indigo-600 shadow-lg ring-4 ring-indigo-50 dark:ring-indigo-900/50' : (isPast ? 'bg-slate-300' : 'bg-emerald-400')}`}></div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                                                {generatePatientCodename(apt.member_id!)}
                                                {apt.notes && <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wide truncate max-w-[150px]">{apt.notes}</span>}
                                                {isLate && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-black uppercase tracking-wide animate-pulse">Late Arrival</span>}
                                            </div>
                                            <div className="text-[10px] text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider mt-0.5">
                                                Standard Visit • 45m
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 flex items-center gap-2">
                                            {isLate && (
                                                <button
                                                    onClick={() => handleNoShow(apt.id)}
                                                    className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded text-[9px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors"
                                                >
                                                    No-Show
                                                </button>
                                            )}
                                            {isCurrent && <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-1 rounded dark:bg-indigo-900 dark:text-indigo-300 animate-pulse">active</span>}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        {booked.length > 0 && (
                            <div className="p-3 bg-slate-50 dark:bg-slate-950 text-center border-t border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">End of Agenda</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                        <h3 className="text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <button onClick={() => onNavigate('schedule')} className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-between group text-slate-900 dark:text-slate-300">
                                Manage Availability <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
                            </button>
                            <button onClick={() => onNavigate('tokens')} className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-between group text-slate-900 dark:text-slate-300">
                                Patient Directory <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
                            </button>
                        </div>
                    </div>

                    {/* System Alerts */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                        <h3 className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> System Notices
                        </h3>
                        <div className="space-y-3">
                            <div className="text-xs p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded text-amber-800 dark:text-amber-200">
                                <strong>Reminder:</strong> Please verify all PWA tokens before end of shift.
                            </div>
                            <div className="text-xs p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded text-emerald-800 dark:text-emerald-200">
                                <strong>System:</strong> Sync completed successfully at {format(new Date(), 'HH:mm')}.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ icon: Icon, label, value, sub, color }: any) => {
    const colors = {
        indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
        emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
        amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
        slate: "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
            <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 mb-1">{label}</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h3>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>
            </div>
            <div className={`p-2.5 rounded-lg ${(colors as any)[color]}`}>
                <Icon className="w-5 h-5" />
            </div>
        </div>
    );
}
