import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    Activity,
    FileText,
    Grid,
    LogOut,
    AlertCircle,
    Database,
    Sun,
    Moon,
    ChevronDown,
    Lock,
    Menu,
    X
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import TokenGenerator from '../components/admin/TokenGenerator';
import MasterSchedule from '../components/admin/MasterSchedule';
import { SystemMaintenance } from '../components/admin/SystemMaintenance';
import AuditLogViewer from '../components/admin/AuditLogViewer';
import { useTheme } from '../contexts/ThemeContext';

type ActionContext = 'view' | 'block' | 'unblock' | 'override';
type DashboardView = 'schedule' | 'tokens' | 'logs' | 'maintenance';

export default function AdminDashboard() {
    const { signOut } = useAuth(); // Keeping 'user' as it might be used later or for auth checks
    const { theme, setTheme } = useTheme();
    const [actionContext, setActionContext] = useState<ActionContext>('view');
    const [currentView, setCurrentView] = useState<DashboardView>('schedule');
    const [isContextOpen, setIsContextOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-100 pb-12 transition-colors">
            {/* Enterprise Header */}
            <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors">
                <div className="flex h-14 items-center px-4 md:px-6 gap-4">
                    {/* Brand / Logo */}
                    <div className="flex items-center gap-3 mr-4">
                        <img src="/pwa-192x192.png" alt="Vector" className="w-8 h-8 rounded shrink-0" />
                        <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">PROJECT VECTOR</span>
                    </div>

                    {/* Operational Breadcrumb */}
                    <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 font-medium flex-1">
                        <span>Command</span>
                        <span className="text-slate-300 dark:text-slate-600">/</span>
                        <span className="text-slate-900 dark:text-white font-bold capitalize">{currentView}</span>
                    </div>

                    {/* Modern Action Context Switcher */}
                    <div className="relative">
                        <button
                            onClick={() => setIsContextOpen(!isContextOpen)}
                            className={`flex items-center gap-3 px-3 py-1.5 rounded-md border text-[10px] font-black tracking-widest transition-all shadow-sm ${actionContext === 'block'
                                ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            <span className="uppercase">{actionContext} MODE</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${isContextOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Enterprise Dropdown */}
                        {isContextOpen && (
                            <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
                                <div className="p-1">
                                    <div className="px-3 py-1.5 text-[10px] text-slate-400 font-black uppercase tracking-widest">Control Context</div>
                                    <button
                                        onClick={() => { setActionContext('view'); setIsContextOpen(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md text-left transition-colors"
                                    >
                                        <Activity className="w-4 h-4 text-emerald-500" />
                                        <div>
                                            <div className="text-xs font-bold text-slate-900 dark:text-white">Monitor</div>
                                            <div className="text-[10px] text-slate-500 leading-tight">Observation & analytics only.</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => { setActionContext('block'); setIsContextOpen(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-left transition-colors"
                                    >
                                        <Lock className="w-4 h-4 text-red-500" />
                                        <div>
                                            <div className="text-xs font-bold text-slate-900 dark:text-white">Restricted</div>
                                            <div className="text-[10px] text-slate-500 leading-tight">Modify slots and access.</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2" />

                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                    >
                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>

                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2" />

                    <Button onClick={signOut} variant="ghost" size="sm" className="hidden md:flex text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-800">
                        <LogOut className="w-3.5 h-3.5 mr-2" />
                        <span className="hidden sm:inline">Logout</span>
                    </Button>

                    {/* Mobile Menu Toggle */}
                    <div className="flex md:hidden items-center gap-2">
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-900 dark:text-white">
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                {mobileMenuOpen && (
                    <div className="absolute top-14 left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xl md:hidden flex flex-col p-4 gap-2 animate-in slide-in-from-top-2 z-50">
                        <Button variant={currentView === 'schedule' ? 'secondary' : 'ghost'} size="sm" onClick={() => { setCurrentView('schedule'); setMobileMenuOpen(false); }} className="justify-start h-10 text-xs font-black uppercase tracking-wider"> <Grid className="w-4 h-4 mr-3" /> Master Schedule </Button>
                        <Button variant={currentView === 'tokens' ? 'secondary' : 'ghost'} size="sm" onClick={() => { setCurrentView('tokens'); setMobileMenuOpen(false); }} className="justify-start h-10 text-xs font-black uppercase tracking-wider"> <FileText className="w-4 h-4 mr-3" /> Token Station </Button>
                        <Button variant={currentView === 'logs' ? 'secondary' : 'ghost'} size="sm" onClick={() => { setCurrentView('logs'); setMobileMenuOpen(false); }} className="justify-start h-10 text-xs font-black uppercase tracking-wider"> <AlertCircle className="w-4 h-4 mr-3" /> Audit Logs </Button>
                        <Button variant={currentView === 'maintenance' ? 'secondary' : 'ghost'} size="sm" onClick={() => { setCurrentView('maintenance'); setMobileMenuOpen(false); }} className="justify-start h-10 text-xs font-black uppercase tracking-wider"> <Database className="w-4 h-4 mr-3" /> System Hygiene </Button>
                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                        <Button variant="ghost" size="sm" onClick={signOut} className="justify-start h-10 text-xs font-black uppercase tracking-wider text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"> <LogOut className="w-4 h-4 mr-3" /> Logout </Button>
                    </div>
                )}
            </header>

            {/* Dashboard Content Grid */}
            <main className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 max-w-[1600px] mx-auto">
                {/* Left Column: Enterprise Sidebar */}
                <div className="md:col-span-3 lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-1 shadow-sm transition-colors">
                        <div className="text-[10px] uppercase text-slate-400 font-black mb-3 px-2 tracking-widest">Console</div>
                        <button
                            onClick={() => setCurrentView('schedule')}
                            className={`w-full flex items-center px-3 py-2 text-xs font-bold rounded-md transition-colors ${currentView === 'schedule' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border-r-2 border-indigo-600 dark:border-indigo-400 rounded-r-none' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <Grid className="w-3.5 h-3.5 mr-2" />
                            Master Schedule
                        </button>
                        <button
                            onClick={() => setCurrentView('tokens')}
                            className={`w-full flex items-center px-3 py-2 text-xs font-bold rounded-md transition-colors ${currentView === 'tokens' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border-r-2 border-indigo-600 dark:border-indigo-400 rounded-r-none' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <FileText className="w-3.5 h-3.5 mr-2" />
                            Token Station
                        </button>
                        <button
                            onClick={() => setCurrentView('logs')}
                            className={`w-full flex items-center px-3 py-2 text-xs font-bold rounded-md transition-colors ${currentView === 'logs' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border-r-2 border-indigo-600 dark:border-indigo-400 rounded-r-none' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <AlertCircle className="w-3.5 h-3.5 mr-2" />
                            Audit Logs
                        </button>
                        <button
                            onClick={() => setCurrentView('maintenance')}
                            className={`w-full flex items-center px-3 py-2 text-xs font-bold rounded-md transition-colors ${currentView === 'maintenance' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border-r-2 border-indigo-600 dark:border-indigo-400 rounded-r-none' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <Database className="w-3.5 h-3.5 mr-2" />
                            System Hygiene
                        </button>
                    </div>

                    {/* Operational Awareness Widget */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-sm transition-colors">
                        <div className="text-[10px] uppercase text-slate-400 font-black mb-3 px-2 tracking-widest">System Health</div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-2">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">ACTIVE NODES</span>
                                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">12</span>
                            </div>
                            <div className="flex justify-between items-center px-2">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">IO LOAD</span>
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">4.2%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="md:col-span-9 lg:col-span-10 space-y-6">
                    {currentView === 'schedule' && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg min-h-[600px] flex flex-col animate-in fade-in duration-300 overflow-hidden shadow-sm transition-colors">
                            <MasterSchedule actionContext={actionContext} />
                        </div>
                    )}

                    {currentView === 'tokens' && <TokenGenerator />}

                    {currentView === 'logs' && (
                        <div className="animate-in fade-in duration-300">
                            <AuditLogViewer />
                        </div>
                    )}

                    {currentView === 'maintenance' && <SystemMaintenance />}
                </div>
            </main>
        </div>
    );
}
