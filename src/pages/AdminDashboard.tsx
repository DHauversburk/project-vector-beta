import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    Shield,
    Lock,
    Unlock,
    Activity,
    FileText,
    Grid,
    LogOut,
    Search,
    ChevronDown,
    Clock,
    AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';

type ActionContext = 'view' | 'block' | 'unblock' | 'override';

export default function AdminDashboard() {
    const { user, signOut } = useAuth();
    const [actionContext, setActionContext] = useState<ActionContext>('view');
    const [isContextOpen, setIsContextOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-cyan-500/30">
            {/* Header / Command Center HUD */}
            <header className="sticky top-0 z-50 border-b border-cyan-900/30 bg-[#020617]/80 backdrop-blur-md">
                <div className="flex h-16 items-center px-4 md:px-6 gap-4">
                    {/* Brand / Logo */}
                    <div className="flex items-center gap-2 mr-4">
                        <Shield className="w-6 h-6 text-cyan-500" />
                        <span className="text-lg font-bold tracking-wider text-cyan-50">VECTOR</span>
                    </div>

                    {/* Mission Control Widgets */}
                    <div className="hidden md:flex items-center gap-6 flex-1">
                        {/* Clearance Badge */}
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Clearance</span>
                            <div className="flex items-center gap-2">
                                <span className="bg-cyan-950 text-cyan-400 text-xs px-2 py-0.5 rounded border border-cyan-800 font-mono tracking-tight">
                                    COMMAND (FULL ACCESS)
                                </span>
                            </div>
                        </div>

                        {/* ID / User */}
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Operator</span>
                            <span className="text-sm font-medium text-slate-300 font-mono">{user?.email}</span>
                        </div>
                    </div>

                    {/* Action Context Switcher (The "Safety Toggle") */}
                    <div className="relative">
                        <button
                            onClick={() => setIsContextOpen(!isContextOpen)}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg border transition-all duration-200 ${actionContext === 'block'
                                ? 'bg-red-950/30 border-red-800 text-red-400 hover:bg-red-950/50'
                                : 'bg-slate-900 border-slate-700 hover:border-cyan-700/50'
                                }`}
                        >
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] uppercase tracking-widest opacity-60 font-bold">Action Context</span>
                                <div className="flex items-center gap-2 font-mono text-sm font-bold">
                                    {actionContext === 'view' && <Activity className="w-4 h-4" />}
                                    {actionContext === 'block' && <Lock className="w-4 h-4" />}
                                    {actionContext === 'unblock' && <Unlock className="w-4 h-4" />}
                                    <span className="uppercase">{actionContext}</span>
                                </div>
                            </div>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isContextOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown */}
                        {isContextOpen && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-[#0B1121] border border-cyan-900/50 rounded-lg shadow-2xl overflow-hidden z-50 ring-1 ring-cyan-500/20">
                                <div className="p-1">
                                    <div className="px-3 py-2 text-xs text-slate-500 uppercase tracking-wider font-bold bg-slate-950/50 border-b border-slate-800/50 mb-1">
                                        Select Operating Mode
                                    </div>
                                    <button
                                        onClick={() => { setActionContext('view'); setIsContextOpen(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-cyan-950/30 rounded-md text-left transition-colors group"
                                    >
                                        <Activity className="w-4 h-4 text-cyan-500" />
                                        <div>
                                            <div className="text-sm font-medium text-slate-200 group-hover:text-cyan-400">Monitor / View</div>
                                            <div className="text-xs text-slate-500">Standard observation mode.</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => { setActionContext('block'); setIsContextOpen(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-950/20 rounded-md text-left transition-colors group"
                                    >
                                        <Lock className="w-4 h-4 text-red-500" />
                                        <div>
                                            <div className="text-sm font-medium text-slate-200 group-hover:text-red-400">Block / Restricted</div>
                                            <div className="text-xs text-slate-500">Lock slots or suspend tokens.</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <Button onClick={signOut} variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            </header>

            {/* Dashboard Content Grid */}
            <main className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 max-w-[1600px] mx-auto">

                {/* Left Column: Navigation / Tools */}
                <div className="md:col-span-3 lg:col-span-2 space-y-4">
                    <div className="bg-[#0B1121] border border-slate-800 rounded-xl p-4 space-y-2">
                        <div className="text-xs uppercase text-slate-500 font-bold mb-4 tracking-wider">Console</div>
                        <Button variant="ghost" className="w-full justify-start text-cyan-400 bg-cyan-950/20 hover:bg-cyan-900/30">
                            <Grid className="w-4 h-4 mr-2" />
                            Master Schedule
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-slate-100">
                            <FileText className="w-4 h-4 mr-2" />
                            Token Station
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-slate-100">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Audit Logs
                        </Button>
                    </div>

                    {/* Quick Stats Widget */}
                    <div className="bg-[#0B1121] border border-slate-800 rounded-xl p-4">
                        <div className="text-xs uppercase text-slate-500 font-bold mb-3 tracking-wider">System Status</div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-400">Active Nodes</span>
                                <span className="text-sm font-mono text-cyan-400">12</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-400">Load</span>
                                <span className="text-sm font-mono text-emerald-400">4%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area: Master Schedule */}
                <div className="md:col-span-9 lg:col-span-10">
                    <div className="bg-[#0B1121] border border-slate-800 rounded-xl min-h-[600px] flex flex-col">

                        {/* Toolbar */}
                        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <h2 className="text-lg font-bold text-slate-100">Master Base Schedule</h2>
                                <div className="h-4 w-px bg-slate-800"></div>
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Clock className="w-4 h-4" />
                                    <span>December 2025</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="Find Token or Provider..."
                                        className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-sm focus:ring-1 focus:ring-cyan-500 outline-none text-slate-300 w-64 placeholder:text-slate-600"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Schedule Grid Placeholders */}
                        <div className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {/* Example Slot */}
                                <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-3 hover:border-cyan-500/50 transition-colors cursor-pointer group relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-mono text-lg font-bold text-slate-200">08:00</span>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">PT_BLUE</div>
                                    <div className="mt-2 text-sm text-emerald-400 font-medium">OPEN</div>
                                </div>

                                {/* Booked Slot */}
                                <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-3 hover:border-cyan-500/50 transition-colors cursor-pointer group relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-mono text-lg font-bold text-slate-200">08:30</span>
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">PT_BLUE</div>
                                    <div className="mt-2 text-sm text-cyan-400 font-mono">PT-4921</div>
                                </div>

                                {/* Blocked Slot */}
                                <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-3 opacity-60 hover:opacity-100 hover:border-red-900 transition-all cursor-not-allowed relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-red-900"></div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-mono text-lg font-bold text-slate-500">09:00</span>
                                        <Lock className="w-3 h-3 text-red-900" />
                                    </div>
                                    <div className="text-xs text-slate-600 font-medium uppercase tracking-wider">BLOCKED</div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
