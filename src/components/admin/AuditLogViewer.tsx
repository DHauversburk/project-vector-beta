import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { AlertCircle, AlertTriangle, Info, ShieldAlert, RefreshCw, Filter, Code } from 'lucide-react';
import { format } from 'date-fns';

type AuditLog = {
    id: string;
    user_id: string;
    token_alias: string;
    role: string;
    action_type: string;
    description: string;
    metadata: any;
    severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
    created_at: string;
};

export default function AuditLogViewer() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedType, setSelectedType] = useState<string>('');
    const [selectedSeverity, setSelectedSeverity] = useState<string>('');
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await api.getAuditLogs({
                type: selectedType || undefined,
                severity: selectedSeverity || undefined,
                limit: 50
            });
            setLogs(data);
        } catch (error) {
            console.error('Failed to load logs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, [selectedType, selectedSeverity]);

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return <ShieldAlert className="w-4 h-4 text-purple-600" />;
            case 'ERROR': return <AlertCircle className="w-4 h-4 text-red-600" />;
            case 'WARN': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            default: return <Info className="w-4 h-4 text-slate-400" />;
        }
    };

    const getSeverityStyle = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'bg-purple-50 border-purple-200 text-purple-700';
            case 'ERROR': return 'bg-red-50 border-red-200 text-red-700';
            case 'WARN': return 'bg-amber-50 border-amber-200 text-amber-700';
            default: return 'bg-slate-50 border-slate-200 text-slate-600';
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm flex flex-col h-[600px]">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Global Audit Terminal</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Immutable System Records</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={loadLogs} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors" title="Refresh">
                        <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex gap-3 text-xs">
                <div className="relative">
                    <Filter className="w-3 h-3 absolute left-2 top-2.5 text-slate-400" />
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="pl-7 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                        <option value="">All Types</option>
                        <option value="LOGIN">Auth / Login</option>
                        <option value="BOOKING">Booking</option>
                        <option value="CANCEL">Cancellation</option>
                        <option value="ERROR">System Errors</option>
                    </select>
                </div>
                <div className="relative">
                    <select
                        value={selectedSeverity}
                        onChange={(e) => setSelectedSeverity(e.target.value)}
                        className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                        <option value="">All Severities</option>
                        <option value="INFO">Info</option>
                        <option value="WARN">Warnings</option>
                        <option value="ERROR">Errors Only</option>
                    </select>
                </div>
            </div>

            {/* Logs Table */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-sm">
                        <tr>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Timestamp</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Level</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Action</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">User</th>
                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Description</th>
                        </tr>
                    </thead>
                    <tbody className="text-xs font-mono">
                        {loading && logs.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-400">Initializing Uplink...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-400">No records found matching criteria.</td></tr>
                        ) : (
                            logs.map(log => (
                                <>
                                    <tr
                                        key={log.id}
                                        className={`border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${expandedLogId === log.id ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                                        onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                                    >
                                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            {format(new Date(log.created_at), 'MM/dd HH:mm:ss')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider ${getSeverityStyle(log.severity)}`}>
                                                {getSeverityIcon(log.severity)}
                                                {log.severity}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">{log.action_type}</td>
                                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400" title={log.role}>
                                            {log.token_alias || 'SYSTEM'}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 truncate max-w-[300px]">
                                            {log.description}
                                        </td>
                                    </tr>
                                    {expandedLogId === log.id && (
                                        <tr className="bg-slate-50 dark:bg-slate-900/50">
                                            <td colSpan={5} className="px-4 py-4">
                                                <div className="bg-slate-900 rounded p-3 text-slate-300 text-[10px] font-mono overflow-x-auto">
                                                    <div className="flex items-center gap-2 mb-2 text-slate-500 uppercase font-black tracking-widest border-b border-slate-700 pb-1">
                                                        <Code className="w-3 h-3" /> Metadata Payload
                                                    </div>
                                                    <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
