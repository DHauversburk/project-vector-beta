import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import TokenGenerator from '../components/admin/TokenGenerator';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loader2, CalendarRange, Users, RefreshCw, Zap, BarChart3, Check, ShieldAlert, Moon, Sun, Shield, Activity, LogOut, Calendar, Clock, ChevronDown, LayoutGrid } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { addDays } from 'date-fns';
import { ProviderSchedule } from '../components/provider/ProviderSchedule';
import { AnalyticsDashboard } from '../components/provider/AnalyticsDashboard';
import { SecuritySettings } from '../components/SecuritySettings';
import { ProviderResources } from '../components/provider/ProviderResources';
import { ProviderOverview } from '../components/provider/ProviderOverview';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { Toaster } from 'sonner';

type Member = {
    id: string;
    token_alias: string;
    status: 'active' | 'disabled';
    created_at: string;
    appointments?: { count: number }[];
};

export default function ProviderDashboard() {
    const { theme, setTheme } = useTheme();
    const { user, role, signOut } = useAuth();
    const [view, setView] = useState<'overview' | 'schedule' | 'tokens' | 'resources' | 'analytics' | 'security'>('overview');
    const [loading, setLoading] = useState(true);
    const [genLoading, setGenLoading] = useState(false);
    const [scheduleKey, setScheduleKey] = useState(0);

    // Availability Generator State
    const [generatorOpen, setGeneratorOpen] = useState(false);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(addDays(new Date(), 14).toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [blockStartTime, setBlockStartTime] = useState('12:00');
    const [blockEndTime, setBlockEndTime] = useState('13:00');
    const [duration, setDuration] = useState(45);
    const [breakTime, setBreakTime] = useState(15);
    const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
    const [isBlockMode, setIsBlockMode] = useState(false);
    const [blockReason, setBlockReason] = useState('');
    const [customLocation, setCustomLocation] = useState('');

    // Clear Schedule State
    const [clearOpen, setClearOpen] = useState(false);
    const [cleanBooked, setCleanBooked] = useState(false);
    const [clearStart, setClearStart] = useState(new Date().toISOString().split('T')[0]);
    const [clearEnd, setClearEnd] = useState(addDays(new Date(), 14).toISOString().split('T')[0]);

    // Token Manager State
    const [members, setMembers] = useState<Member[]>([]);
    const [memberSearch, setMemberSearch] = useState('');
    const [memberLoading, setMemberLoading] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [bookingMember, setBookingMember] = useState<Member | null>(null);
    const [openSlots, setOpenSlots] = useState<any[]>([]);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [newAlias, setNewAlias] = useState('');

    // Sort and Filter State
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'disabled'>('all');
    const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'appts_desc'>('created_desc');

    // Schedule Template State
    const [templateName, setTemplateName] = useState('');
    const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
    const [showTemplates, setShowTemplates] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('SCHEDULE_TEMPLATES');
        if (stored) setSavedTemplates(JSON.parse(stored));
    }, []);

    const loadMembers = async () => {
        setMemberLoading(true);
        try {
            const data = await api.getMembers(memberSearch);
            setMembers(data as Member[]);
        } catch (error) {
            console.error(error);
        } finally {
            setMemberLoading(false);
        }
    };

    useEffect(() => {
        setLoading(false);
    }, []);

    useEffect(() => {
        if (view === 'tokens') loadMembers();
    }, [view, memberSearch]);

    const handleClear = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cleanBooked && !confirm('DANGER: You are about to delete BOOKED appointments as well. This will cancel patients without notification. Are you sure?')) {
            return;
        }
        if (!confirm(`Clear schedule from ${clearStart} to ${clearEnd}?`)) return;

        setGenLoading(true);
        try {
            await api.clearSchedule(clearStart, clearEnd, cleanBooked);
            setClearOpen(false);
            setCleanBooked(false);
            setScheduleKey(prev => prev + 1);
            alert('Schedule cleared successfully.');
        } catch (error) {
            console.error(error);
            alert('Failed to clear schedule.');
        } finally {
            setGenLoading(false);
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        const startH = parseInt(startTime.split(':')[0]);
        const endH = parseInt(endTime.split(':')[0]);

        if (!isBlockMode) {
            if (startH < 7 || startH > 16 || endH > 17 || startH > endH) {
                if (!confirm(`Warning: You are generating slots outside of Standard Duty Hours (07:30 - 16:30). Selected: ${startTime} - ${endTime}. Continue?`)) {
                    return;
                }
            }
        }

        setGenLoading(true);
        try {
            const localStartTime = isBlockMode ? blockStartTime : startTime;
            const localEndTime = isBlockMode ? blockEndTime : endTime;
            const count = await api.generateSlots(startDate, endDate, localStartTime, localEndTime, duration, breakTime, days, isBlockMode, isBlockMode ? blockReason : (customLocation ? `Location: ${customLocation}` : null));
            console.log(`Complete: ${count} slots.`);
            setGeneratorOpen(false);
            setBlockReason('');
            setScheduleKey(prev => prev + 1);
        } catch (error) {
            console.error(error);
        } finally {
            setGenLoading(false);
        }
    };

    const toggleMemberStatus = async (member: Member) => {
        const newStatus = member.status === 'active' ? 'disabled' : 'active';
        if (!confirm(`Restrict system access for ${member.token_alias}?`)) return;
        try {
            await api.updateUser(member.id, { status: newStatus });
            loadMembers();
        } catch (error) { console.error(error); }
    };

    const handleRekey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMember) return;
        try {
            await api.updateUser(editingMember.id, { token_alias: newAlias });
            setEditingMember(null);
            setNewAlias('');
            loadMembers();
        } catch (error) { console.error(error); }
    };

    const handleDirectBook = async (member: Member) => {
        setBookingMember(member);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const slots = await api.getProviderOpenSlots(user.id);
            setOpenSlots(slots);
        }
    };

    const confirmBooking = async (slotId: string) => {
        if (!bookingMember) return;
        setBookingLoading(true);
        try {
            await supabase.from('appointments').update({ member_id: bookingMember.id, is_booked: true, status: 'confirmed' }).eq('id', slotId);
            setBookingMember(null);
            window.location.reload();
        } catch (error) { console.error(error); } finally { setBookingLoading(false); }
    };

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const saveTemplate = () => {
        if (!templateName.trim()) return;
        const template = { id: Date.now().toString(), name: templateName, startTime, endTime, duration, breakTime, days, createdAt: new Date().toISOString() };
        const updated = [...savedTemplates, template];
        setSavedTemplates(updated);
        localStorage.setItem('SCHEDULE_TEMPLATES', JSON.stringify(updated));
        setTemplateName('');
        setShowTemplates(false);
    };

    const loadTemplate = (template: any) => {
        setStartTime(template.startTime);
        setEndTime(template.endTime);
        setDuration(template.duration);
        setBreakTime(template.breakTime);
        setDays(template.days);
        setShowTemplates(false);
    };

    const deleteTemplate = (id: string) => {
        if (!confirm('Delete template?')) return;
        const updated = savedTemplates.filter(t => t.id !== id);
        setSavedTemplates(updated);
        localStorage.setItem('SCHEDULE_TEMPLATES', JSON.stringify(updated));
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 font-sans selection:bg-indigo-100 transition-colors flex flex-col">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 sticky top-0 z-40 shadow-sm transition-colors flex-shrink-0">
                <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Activity className="w-8 h-8 text-indigo-600 p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded" />
                        <div>
                            <h1 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">Clinical Portal</h1>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Clinical Care Unit</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1.5 gap-1 overflow-x-auto sm:overflow-visible">
                                <Button variant={view === 'overview' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('overview')} className={cn("text-xs font-black uppercase tracking-wider", view === 'overview' && "bg-white dark:bg-slate-800 shadow-sm")}> <LayoutGrid className="w-3.5 h-3.5 mr-2" /> Dashboard </Button>
                                <Button variant={view === 'schedule' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('schedule')} className={cn("text-xs font-black uppercase tracking-wider", view === 'schedule' && "bg-white dark:bg-slate-800 shadow-sm")}> <CalendarRange className="w-3.5 h-3.5 mr-2" /> Schedule </Button>
                                <Button variant={view === 'tokens' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('tokens')} className={cn("text-xs font-black uppercase tracking-wider", view === 'tokens' && "bg-white dark:bg-slate-800 shadow-sm")}> <Users className="w-3.5 h-3.5 mr-2" /> Patients </Button>
                                <Button variant={view === 'analytics' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('analytics')} className={cn("text-xs font-black uppercase tracking-wider", view === 'analytics' && "bg-white dark:bg-slate-800 shadow-sm")}> <BarChart3 className="w-3.5 h-3.5 mr-2" /> Analytics </Button>
                                <Button variant={view === 'resources' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('resources')} className={cn("text-xs font-black uppercase tracking-wider", view === 'resources' && "bg-white dark:bg-slate-800 shadow-sm")}> <Calendar className="w-3.5 h-3.5 mr-2" /> Resources </Button>
                                <Button variant={view === 'security' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('security')} className={cn("text-xs font-black uppercase tracking-wider", view === 'security' && "bg-white dark:bg-slate-800 shadow-sm")}> <Shield className="w-3.5 h-3.5 mr-2" /> Security </Button>
                            </div>
                            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-300 dark:border-slate-700"> {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} </button>
                            <button onClick={signOut} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-slate-300 dark:border-slate-700"> <LogOut className="w-4 h-4" /> </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-slate-50 dark:bg-slate-950/50">
                <ErrorBoundary fallbackTitle="Dashboard Module Failure">
                    {view === 'overview' && <ProviderOverview onNavigate={(v) => setView(v as any)} />}

                    {view === 'schedule' && (
                        <div className="h-full flex flex-col p-4 sm:p-6 max-w-[1600px] mx-auto w-full">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Schedule Management</h3>
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Care Provider Availability</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button onClick={() => setClearOpen(!clearOpen)} variant={clearOpen ? 'secondary' : 'outline'} size="sm" className="h-8 px-4 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm">Clear</Button>
                                    <Button onClick={() => setGeneratorOpen(!generatorOpen)} variant={generatorOpen ? 'secondary' : 'outline'} size="sm" className="h-8 px-4 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm">Generate</Button>
                                </div>
                            </div>
                            {/* Generator & Clear UI omitted for brevity, adding back the Schedule Component */}
                            {/* Clear UI */}
                            {clearOpen && (
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-xl mb-4 border border-red-200 dark:border-red-900/30">
                                    <h4 className="text-xs font-black uppercase text-red-600 mb-4 flex items-center gap-2">
                                        <ShieldAlert className="w-4 h-4" /> Clear Schedule
                                    </h4>
                                    <form onSubmit={handleClear} className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        <div className="md:col-span-4 space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-500">Date Range</label>
                                            <div className="flex gap-2">
                                                <Input type="date" value={clearStart} onChange={e => setClearStart(e.target.value)} className="h-9 text-xs" required />
                                                <Input type="date" value={clearEnd} onChange={e => setClearEnd(e.target.value)} className="h-9 text-xs" required />
                                            </div>
                                        </div>
                                        <div className="md:col-span-6 flex items-center gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950">
                                                <input
                                                    type="checkbox"
                                                    checked={cleanBooked}
                                                    onChange={e => setCleanBooked(e.target.checked)}
                                                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                                                />
                                                <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">
                                                    Include Booked Appointments
                                                </span>
                                            </label>
                                            {cleanBooked && (
                                                <span className="text-[10px] text-red-600 font-bold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded animate-pulse">
                                                    WARNING: PATIENTS WILL BE CANCELLED
                                                </span>
                                            )}
                                        </div>
                                        <div className="md:col-span-2 flex items-end">
                                            <Button type="submit" isLoading={genLoading} variant="secondary" className="w-full h-9 font-black text-[10px] uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white">
                                                Confirm Clear
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {generatorOpen && (
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-xl mb-4 border border-slate-200 dark:border-slate-800">
                                    <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        <div className="md:col-span-12 flex justify-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-2">
                                            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg">
                                                <button type="button" onClick={() => setIsBlockMode(false)} className={`px-6 py-2 rounded-md text-[10px] font-black uppercase tracking-widest ${!isBlockMode ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Add Availability</button>
                                                <button type="button" onClick={() => setIsBlockMode(true)} className={`px-6 py-2 rounded-md text-[10px] font-black uppercase tracking-widest ${isBlockMode ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Block Time</button>
                                            </div>
                                        </div>
                                        <div className="md:col-span-4 space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-500">Date Window</label>
                                            <div className="flex gap-2">
                                                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 text-xs" required />
                                                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 text-xs" required />
                                            </div>
                                        </div>
                                        {!isBlockMode ? (
                                            <div className="md:col-span-6 space-y-2">
                                                <label className="text-[10px] font-black uppercase text-slate-500">Hours</label>
                                                <div className="flex gap-2">
                                                    <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-9 text-xs" required />
                                                    <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-9 text-xs" required />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="md:col-span-6 space-y-2">
                                                <label className="text-[10px] font-black uppercase text-slate-500">Block Time</label>
                                                <div className="flex gap-2">
                                                    <Input type="time" value={blockStartTime} onChange={e => setBlockStartTime(e.target.value)} className="h-9 text-xs" required />
                                                    <Input type="time" value={blockEndTime} onChange={e => setBlockEndTime(e.target.value)} className="h-9 text-xs" required />
                                                </div>
                                                <Input value={blockReason} onChange={e => setBlockReason(e.target.value)} placeholder="Reason" className="h-9 text-xs mt-2" />
                                            </div>
                                        )}
                                        <div className="md:col-span-2 flex items-end">
                                            <Button type="submit" isLoading={genLoading} className="w-full h-9 font-black text-[10px] uppercase tracking-widest bg-indigo-600 text-white">Execute</Button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[600px] transition-colors flex-1">
                                <ProviderSchedule key={scheduleKey} />
                            </div>
                        </div>
                    )}

                    {view === 'analytics' && <AnalyticsDashboard />}
                    {view === 'resources' && <ProviderResources />}
                    {view === 'security' && <SecuritySettings />}

                    {view === 'tokens' && (
                        <div className="space-y-6 p-6">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm">
                                <TokenGenerator isProvider={true} />
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                                        <tr>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-600">Token</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-600">Status</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-600">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {members.map(m => (
                                            <tr key={m.id}>
                                                <td className="px-4 py-3 font-mono text-xs font-black text-indigo-600">{m.token_alias}</td>
                                                <td className="px-4 py-3 text-[10px] font-bold uppercase">{m.status}</td>
                                                <td className="px-4 py-3 flex gap-2">
                                                    <Button size="sm" variant="ghost" className="h-6 text-[9px] uppercase" onClick={() => toggleMemberStatus(m)}>{m.status === 'active' ? 'Revoke' : 'Unlock'}</Button>
                                                    <Button size="sm" variant="outline" className="h-6 text-[9px] uppercase" onClick={() => { setEditingMember(m); setNewAlias(m.token_alias); }}>Re-Key</Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </ErrorBoundary>
            </div>

            {editingMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg w-full max-w-sm">
                        <h3 className="text-xs font-black uppercase">Re-Key</h3>
                        <form onSubmit={handleRekey} className="mt-4 space-y-4">
                            <Input value={newAlias} onChange={e => setNewAlias(e.target.value.toUpperCase())} placeholder="NEW-ALIAS" className="font-mono" />
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={() => setEditingMember(null)}>Cancel</Button>
                                <Button type="submit">Save</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <Toaster richColors position="top-right" />
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
