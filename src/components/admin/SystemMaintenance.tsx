import { useState } from 'react';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { Trash2, RefreshCw, AlertTriangle, CheckCircle, Database } from 'lucide-react';

export const SystemMaintenance = () => {
    const [loading, setLoading] = useState(false);
    const [scanResults, setScanResults] = useState<{
        total_users: number,
        active_appointments: number,
        available_slots: number,
        errors_today: number,
        duplicates: number
    } | null>(null);

    const scanDatabase = async () => {
        setLoading(true);
        try {
            const stats = await api.getSystemStats();
            setScanResults(stats);
        } catch (error) {
            console.error(error);
            alert("Scan failed");
        } finally {
            setLoading(false);
        }
    };

    const fixDuplicates = async () => {
        if (!confirm("WARNING: This will delete duplicate user records, keeping the oldest creation. Appointments linked to deleted users may be lost or orphaned. Continue?")) return;
        setLoading(true);
        try {
            await api.fixDuplicateUsers();
            alert("Cleanup Complete. Duplicates removed.");
            // Re-scan
            scanDatabase();
        } catch (error) {
            console.error(error);
            alert("Cleanup Failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleWipeMockData = async () => {
        if (!confirm("EXTREME DANGER: This will wipe ALL mock appointments, settings, and local changes. \n\nThis is irreversible. Are you sure?")) return;
        try {
            await api.resetMockData();
            alert("Mock Data Wiped Successfully.");
            scanDatabase();
        } catch (error) {
            console.error(error);
            alert("Wipe failed.");
        }
    };

    return (
        <div className="p-6 space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                <div className="p-3 bg-red-50 rounded-lg">
                    <Database className="w-6 h-6 text-red-600" />
                </div>
                <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Database Hygiene</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">System Maintenance & cleanup</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">User Deduplication</h3>
                            <p className="text-xs text-slate-500 mt-1">Scan for users with identical Token Aliases.</p>
                        </div>
                        <RefreshCw className="w-4 h-4 text-slate-400" />
                    </div>

                    {scanResults && scanResults.duplicates !== undefined ? (
                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded p-4 space-y-3">
                            {scanResults.duplicates > 0 ? (
                                <>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                        <span>Issues Detected: {scanResults.duplicates} Duplicates</span>
                                    </div>
                                    <Button
                                        onClick={fixDuplicates}
                                        isLoading={loading}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white border-none text-[10px] font-black uppercase tracking-widest"
                                    >
                                        <Trash2 className="w-3 h-3 mr-2" />
                                        Remove Duplicates (Nuclear)
                                    </Button>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-4 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle className="w-8 h-8 mb-2" />
                                    <span className="text-xs font-black uppercase tracking-widest">Database Clean</span>
                                    <span className="text-[10px] text-slate-400 font-bold mt-1">No duplicates found.</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded p-4 text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase">System Status Unknown</p>
                        </div>
                    )}

                    <Button
                        onClick={scanDatabase}
                        isLoading={loading}
                        variant="outline"
                        className="w-full text-[10px] font-black uppercase tracking-widest"
                    >
                        Start Integrity Scan
                    </Button>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                        <Button
                            onClick={handleWipeMockData}
                            className="w-full bg-slate-900 dark:bg-slate-950 text-white hover:bg-slate-800 border border-slate-700 text-[10px] font-black uppercase tracking-widest"
                        >
                            <Trash2 className="w-3 h-3 mr-2 text-red-500" />
                            Erase All Mock Data
                        </Button>
                    </div>
                </div>

                {/* Account Lifecycle Management */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Data Lifecycle</h3>
                            <p className="text-xs text-slate-500 mt-1">Prune stale accounts & tokens.</p>
                        </div>
                        <Database className="w-4 h-4 text-slate-400" />
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                            <span>Inactive Threshold</span>
                            <select
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1"
                                defaultValue={60}
                                onChange={(e) => {
                                    // Simple local var approach since strict state binding is verbose for this snippet
                                    (window as any)._pruneDays = parseInt(e.target.value);
                                }}
                            >
                                <option value="30">30 Days</option>
                                <option value="60">60 Days (Standard)</option>
                                <option value="90">90 Days</option>
                                <option value="180">180 Days</option>
                            </select>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                            Removes members who haven't logged in within the timeframe. Preserves data integrity.
                        </p>
                        <Button
                            onClick={async () => {
                                const days = (window as any)._pruneDays || 60;
                                if (!confirm(`CONFIRM: Delete inactive MEMBER accounts older than ${days} days?`)) return;
                                try {
                                    setLoading(true);
                                    const count = await api.pruneInactiveUsers(days);
                                    alert(`Pruning Successful. Removed ${count} accounts.`);
                                    scanDatabase();
                                } catch (e) {
                                    alert('Pruning failed. Check Console / RPC.');
                                    console.error(e);
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            isLoading={loading}
                            variant="outline"
                            className="w-full text-[10px] font-black uppercase tracking-widest border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        >
                            <Trash2 className="w-3 h-3 mr-2" />
                            Prune Stale Identities
                        </Button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">System Health</h3>
                            <p className="text-xs text-slate-500 mt-1">Live metrics from DB.</p>
                        </div>
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                    </div>

                    {scanResults ? (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-100 dark:border-slate-700">
                                <div className="text-[10px] uppercase text-slate-500 font-black">Users</div>
                                <div className="text-xl font-black text-slate-900 dark:text-white">{scanResults.total_users}</div>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-100 dark:border-slate-700">
                                <div className="text-[10px] uppercase text-slate-500 font-black">Active Appts</div>
                                <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">{scanResults.active_appointments}</div>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-100 dark:border-slate-700">
                                <div className="text-[10px] uppercase text-slate-500 font-black">Open Slots</div>
                                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{scanResults.available_slots}</div>
                            </div>
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-100 dark:border-red-900/50">
                                <div className="text-[10px] uppercase text-red-500 font-black">Errors Today</div>
                                <div className="text-xl font-black text-red-700 dark:text-red-400">{scanResults.errors_today}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-24 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded border border-dashed border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Waiting for Scan...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
