import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CalendarRange, Users, BarChart3, ShieldAlert, Shield, LayoutGrid, X, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { addDays } from 'date-fns';
import { ProviderSchedule } from '../components/provider/ProviderSchedule';
import { ProviderOverview } from '../components/provider/ProviderOverview';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { Toaster } from 'sonner';
import { QuickNoteModal } from '../components/ui/QuickNoteModal';
import { DashboardLayout, type NavItem } from '../components/layout/DashboardLayout';
import { WelcomeModal } from '../components/onboarding/WelcomeModal';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

import { LoadingState } from '../components/ui/LoadingState';

// --- LAZY-LOADED COMPONENTS ---
const TokenGenerator = lazy(() => import('../components/admin/TokenGenerator'));
const AnalyticsDashboard = lazy(() => import('../components/provider/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const SecuritySettings = lazy(() => import('../components/SecuritySettings').then(m => ({ default: m.SecuritySettings })));
const ProviderResources = lazy(() => import('../components/provider/ProviderResources').then(m => ({ default: m.ProviderResources })));
const EncounterLogs = lazy(() => import('../components/provider/EncounterLogs').then(m => ({ default: m.EncounterLogs })));

/**
 * Feature-level loading fallback
 */
const FeatureLoading = () => (
    <div className="w-full flex justify-center py-12">
        <LoadingState message="INITIALIZING CLINICAL NODE..." />
    </div>
);

type Member = {
    id: string;
    token_alias: string;
    status: 'active' | 'disabled';
    created_at: string;
    appointments?: { count: number }[];
};

export default function ProviderDashboard() {
    const { user, signOut } = useAuth();
    const [view, setView] = useState<'overview' | 'schedule' | 'tokens' | 'logs' | 'resources' | 'analytics' | 'security'>('overview');
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
    const [duration] = useState(45);
    const [breakTime] = useState(15);
    const [days] = useState<number[]>([1, 2, 3, 4, 5]);
    const [isBlockMode, setIsBlockMode] = useState(false);
    const [blockReason, setBlockReason] = useState('');

    // Clear Schedule State
    const [clearOpen, setClearOpen] = useState(false);
    const [cleanBooked, setCleanBooked] = useState(false);
    const [clearStart, setClearStart] = useState(new Date().toISOString().split('T')[0]);
    const [clearEnd, setClearEnd] = useState(addDays(new Date(), 14).toISOString().split('T')[0]);

    const [members, setMembers] = useState<Member[]>([]);
    const [memberSearch] = useState('');

    // Quick Note State
    const [quickNoteOpen, setQuickNoteOpen] = useState(false);

    const loadMembers = useCallback(async () => {
        try {
            const data = await api.getMembers(memberSearch);
            setMembers(data as Member[]);
        } catch (error) {
            console.error(error);
        }
    }, [memberSearch]);

    useEffect(() => {
        setLoading(false);
    }, []);

    useEffect(() => {
        if (view === 'tokens') loadMembers();
    }, [view, memberSearch, loadMembers]);

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
            alert('Failed to clear schedule');
        } finally {
            setGenLoading(false);
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setGenLoading(true);
        try {
            await api.generateSlots(
                startDate,
                endDate,
                isBlockMode ? blockStartTime : startTime,
                isBlockMode ? blockEndTime : endTime,
                isBlockMode ? 0 : duration,
                isBlockMode ? 0 : breakTime,
                days,
                isBlockMode,
                isBlockMode ? blockReason : null
            );
            setGeneratorOpen(false);
            setScheduleKey(prev => prev + 1);
            alert(isBlockMode ? 'Block-out time added.' : 'Slots generated successfully.');
        } catch (error: unknown) {
            const err = error as Error;
            console.error(err);
            alert('Generation Failed: ' + err.message);
        } finally {
            setGenLoading(false);
        }
    };

    const navItems: NavItem[] = [
        { id: 'overview', label: 'Overview', icon: LayoutGrid, onClick: () => setView('overview'), dataTour: 'nav-overview' },
        { id: 'schedule', label: 'Schedule', icon: CalendarRange, onClick: () => setView('schedule'), dataTour: 'nav-schedule' },
        { id: 'tokens', label: 'Patient List', icon: Users, onClick: () => setView('tokens'), dataTour: 'nav-patients' },
        { id: 'logs', label: 'Clinical Logs', icon: FileText, onClick: () => setView('logs'), dataTour: 'nav-logs' },
        { id: 'resources', label: 'Resources', icon: FileText, onClick: () => setView('resources') },
        { id: 'analytics', label: 'Analytics', icon: BarChart3, onClick: () => setView('analytics'), dataTour: 'nav-analytics' },
        { id: 'security', label: 'Security', icon: Shield, onClick: () => setView('security'), dataTour: 'nav-security' }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <img src="/pwa-192x192.png" alt="Vector" className="w-12 h-12 rounded opacity-50 grayscale" />
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Loading Provider Portal...</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout
            navItems={navItems}
            activeTab={view}
            user={{ ...user, user_metadata: { token_alias: 'PROVIDER' } }}
            role="Provider"
            onSignOut={signOut}
            title="Provider Portal"
            headerActions={
                <Button
                    onClick={() => setQuickNoteOpen(true)}
                    size="sm"
                    variant="gradient"
                    className="h-9 px-3 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20"
                    data-tour="quick-note"
                >
                    <FileText className="w-4 h-4 mr-2" />
                    Quick Note
                </Button>
            }
        >
            <WelcomeModal role="provider" userName="Provider Console" />
            <div className="max-w-[1600px] mx-auto px-4 md:px-6 pt-2 pb-4 md:pt-4 md:pb-6 space-y-4 md:space-y-6">
                <ErrorBoundary fallbackTitle="Dashboard Module Failure">
                    {view === 'overview' && <ProviderOverview onNavigate={(v) => setView(v as typeof view)} />}

                    {view === 'schedule' && (
                        <Card variant="default" className="border-none shadow-md animate-in fade-in duration-500">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                                <div>
                                    <CardTitle className="text-2xl font-black">Schedule Management</CardTitle>
                                    <CardDescription>Manage your availability and view upcoming appointments.</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={() => setGeneratorOpen(true)} size="sm" variant="outline" className="h-9 text-xs font-bold uppercase tracking-wider">
                                        <CalendarRange className="w-4 h-4 mr-2" />
                                        Auto-Generate
                                    </Button>
                                    <Button onClick={() => setClearOpen(true)} size="sm" variant="destructive" className="h-9 text-xs font-bold uppercase tracking-wider">
                                        <X className="w-4 h-4 mr-2" />
                                        Clear
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ProviderSchedule key={scheduleKey} />
                            </CardContent>
                        </Card>
                    )}

                    {view === 'tokens' && (
                        <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
                            <Card variant="default" className="border-none shadow-md">
                                <CardHeader>
                                    <CardTitle>IDENTITY MANAGEMENT</CardTitle>
                                    <CardDescription>View and manage patient tokens and account statuses.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Suspense fallback={<FeatureLoading />}>
                                        <TokenGenerator isProvider={true} />
                                    </Suspense>
                                </CardContent>
                            </Card>

                            <Card variant="default" className="border-none shadow-md overflow-hidden bg-slate-50 dark:bg-slate-950/50 md:bg-white md:dark:bg-slate-900">
                                <CardHeader className="bg-slate-50 dark:bg-slate-950/50 hidden md:block">
                                    <CardTitle className="text-xs">Active Patient Directory</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {/* Mobile Card View */}
                                    <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
                                        {members.slice(0, 10).map(member => (
                                            <div key={member.id} className="p-4 bg-white dark:bg-slate-900 flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-black font-mono text-slate-900 dark:text-white">{member.token_alias}</span>
                                                        <Badge variant={member.status === 'active' ? 'success' : 'secondary'} size="sm" className="h-5 text-[9px] px-1.5">
                                                            {member.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">
                                                        Joined: {new Date(member.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <Button size="sm" variant="ghost" onClick={() => console.log('Edit:', member.id)}>
                                                    <span className="sr-only">Edit</span>
                                                    <FileText className="w-4 h-4 text-slate-400" />
                                                </Button>
                                            </div>
                                        ))}
                                        {members.length === 0 && (
                                            <div className="p-8 text-center text-xs text-slate-400 font-black uppercase tracking-widest italic">
                                                No patients found.
                                            </div>
                                        )}
                                    </div>

                                    {/* Desktop Table View */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                                                <tr>
                                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Alias</th>
                                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined</th>
                                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {members.slice(0, 10).map(member => (
                                                    <tr key={member.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                        <td className="p-4 text-xs font-bold font-mono text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                                            {member.token_alias}
                                                        </td>
                                                        <td className="p-4">
                                                            <Badge variant={member.status === 'active' ? 'success' : 'secondary'} size="sm">
                                                                {member.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-4 text-xs text-slate-500 font-bold uppercase">
                                                            {new Date(member.created_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <Button size="sm" variant="ghost" onClick={() => console.log('Edit:', member.id)} className="h-8 text-[10px] font-black uppercase">
                                                                Edit
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {members.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="p-12 text-center text-xs text-slate-400 font-black uppercase tracking-widest italic">
                                                            No patients found. Use "Generate Identities" above to add some.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {view === 'resources' && (
                        <Card variant="default" className="border-none shadow-md animate-in fade-in duration-500">
                            <CardHeader>
                                <CardTitle>Resource Library</CardTitle>
                                <CardDescription>Manage educational content for your patients.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Suspense fallback={<FeatureLoading />}>
                                    <ProviderResources />
                                </Suspense>
                            </CardContent>
                        </Card>
                    )}

                    {view === 'logs' && (
                        <Card variant="default" className="border-none shadow-md animate-in fade-in duration-500">
                            <CardHeader>
                                <CardTitle>Clinical Encounter Logs</CardTitle>
                                <CardDescription>Historical record of all quick notes and brief interactions.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Suspense fallback={<FeatureLoading />}>
                                    <EncounterLogs />
                                </Suspense>
                            </CardContent>
                        </Card>
                    )}

                    {view === 'analytics' && (
                        <Suspense fallback={<FeatureLoading />}>
                            <AnalyticsDashboard />
                        </Suspense>
                    )}
                    {view === 'security' && (
                        <Suspense fallback={<FeatureLoading />}>
                            <SecuritySettings />
                        </Suspense>
                    )}
                </ErrorBoundary>
            </div>

            {/* Availability Generator Modal */}
            {generatorOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Availability Generator</h3>
                                <p className="text-xs text-slate-500 font-medium">Bulk create slots for your schedule</p>
                            </div>
                            <button onClick={() => setGeneratorOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            <form id="gen-form" onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Date Range</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-white dark:bg-slate-950" required />
                                        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-white dark:bg-slate-950" required />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <input
                                            type="checkbox"
                                            id="blockMode"
                                            checked={isBlockMode}
                                            onChange={(e) => setIsBlockMode(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="blockMode" className="text-xs font-bold text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                                            Block Out Time (Unavailable)
                                        </label>
                                    </div>

                                    {!isBlockMode ? (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Daily Hours</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="bg-white dark:bg-slate-950" required />
                                                <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="bg-white dark:bg-slate-950" required />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Block Time</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input type="time" value={blockStartTime} onChange={e => setBlockStartTime(e.target.value)} className="bg-white dark:bg-slate-950" required />
                                                <Input type="time" value={blockEndTime} onChange={e => setBlockEndTime(e.target.value)} className="bg-white dark:bg-slate-950" required />
                                            </div>
                                            <Input
                                                placeholder="Reason (e.g. Lunch, Admin)"
                                                value={blockReason}
                                                onChange={e => setBlockReason(e.target.value)}
                                                className="bg-white dark:bg-slate-950"
                                            />
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>
                        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end gap-3">
                            <Button type="button" variant="ghost" onClick={() => setGeneratorOpen(false)}>Cancel</Button>
                            <Button form="gen-form" type="submit" isLoading={genLoading}>
                                {isBlockMode ? 'Add Block' : 'Generate Slots'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Clear Modal */}
            {clearOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="text-lg font-black text-red-600 uppercase tracking-tight flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5" />
                                Clear Schedule
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                                Define the range to clear. By default, this only removes <span className="text-indigo-600 font-bold">OPEN</span> slots.
                            </p>
                            <form id="clear-form" onSubmit={handleClear} className="space-y-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-lg">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-black text-slate-500">From</label>
                                        <Input type="date" value={clearStart} onChange={e => setClearStart(e.target.value)} required />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-black text-slate-500">To</label>
                                        <Input type="date" value={clearEnd} onChange={e => setClearEnd(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <input
                                        type="checkbox"
                                        id="cleanBooked"
                                        checked={cleanBooked}
                                        onChange={e => setCleanBooked(e.target.checked)}
                                        className="w-4 h-4 rounded border-red-300 text-red-600 focus:ring-red-500"
                                    />
                                    <label htmlFor="cleanBooked" className="text-xs font-bold text-red-600 select-none cursor-pointer">
                                        ALSO CANCEL BOOKED APPOINTMENTS
                                    </label>
                                </div>
                            </form>
                        </div>
                        <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setClearOpen(false)}>Cancel</Button>
                            <Button form="clear-form" type="submit" variant="destructive" isLoading={genLoading}>
                                Confirm Clear
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <QuickNoteModal isOpen={quickNoteOpen} onClose={() => setQuickNoteOpen(false)} />
            <Toaster position="top-right" />
        </DashboardLayout>
    );
}
