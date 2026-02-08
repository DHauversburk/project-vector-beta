/**
 * PendingRequests - Provider view of patient help requests
 * 
 * @component
 * @description Shows pending help requests from patients. Providers can
 * view details and resolve requests with notes.
 */

import { useState, useEffect, useCallback } from 'react';
// Force Refresh
import { api, type HelpRequest } from '../../lib/api';
import {
    MessageSquare,
    Calendar,
    AlertTriangle,
    Wrench,
    HelpCircle,
    Clock,
    CheckCircle,
    Loader2,
    X,
    ChevronRight,
    RefreshCw
} from 'lucide-react';
import { Button } from '../ui/Button';
import { format, formatDistanceToNow } from 'date-fns';

const categoryConfig: Record<HelpRequest['category'], { icon: typeof HelpCircle; color: string; label: string }> = {
    question: { icon: MessageSquare, color: 'blue', label: 'Question' },
    reschedule: { icon: Calendar, color: 'amber', label: 'Reschedule' },
    urgent: { icon: AlertTriangle, color: 'red', label: 'Urgent' },
    technical: { icon: Wrench, color: 'purple', label: 'Technical' },
    other: { icon: HelpCircle, color: 'slate', label: 'Other' }
};

export function PendingRequests() {
    const [requests, setRequests] = useState<HelpRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
    const [resolutionNote, setResolutionNote] = useState('');
    const [resolving, setResolving] = useState(false);

    const loadRequests = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getPendingHelpRequests();
            setRequests(data);
        } catch (err) {
            console.error('Failed to load requests:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRequests();
        const interval = setInterval(loadRequests, 30000);
        return () => clearInterval(interval);
    }, [loadRequests]);

    const handleResolve = async () => {
        if (!selectedRequest) return;

        setResolving(true);
        try {
            await api.resolveHelpRequest(selectedRequest.id, resolutionNote);
            setSelectedRequest(null);
            setResolutionNote('');
            loadRequests();
        } catch (err) {
            console.error('Failed to resolve:', err);
        } finally {
            setResolving(false);
        }
    };

    const getColorClasses = (color: string) => {
        const colors: Record<string, { bg: string; text: string; border: string }> = {
            blue: { bg: 'bg-blue-900/30', text: 'text-blue-400', border: 'border-blue-500/30' },
            amber: { bg: 'bg-amber-900/30', text: 'text-amber-400', border: 'border-amber-500/30' },
            red: { bg: 'bg-red-900/30', text: 'text-red-400', border: 'border-red-500/30' },
            purple: { bg: 'bg-purple-900/30', text: 'text-purple-400', border: 'border-purple-500/30' },
            slate: { bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700' }
        };
        return colors[color] || colors.slate;
    };

    if (loading && requests.length === 0) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                            Patient Help Requests
                        </h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">
                            {requests.length} pending • Auto-refreshes every 30s
                        </p>
                    </div>
                </div>
                <button
                    onClick={loadRequests}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Empty State */}
            {requests.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-bold text-slate-400">No pending requests</p>
                    <p className="text-xs text-slate-500 mt-1">All caught up!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {requests.map(request => {
                        const config = categoryConfig[request.category];
                        const colors = getColorClasses(config.color);
                        const Icon = config.icon;
                        const isUrgent = request.category === 'urgent';

                        return (
                            <button
                                key={request.id}
                                onClick={() => setSelectedRequest(request)}
                                className={`w-full text-left p-4 rounded-xl border transition-all hover:scale-[1.01] hover:shadow-md ${isUrgent
                                    ? 'bg-red-950/20 border-red-500/30 hover:border-red-500'
                                    : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-blue-500'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0 ${isUrgent ? 'animate-pulse' : ''}`}>
                                        <Icon className={`w-5 h-5 ${colors.text}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                                                {config.label}
                                            </span>
                                            {isUrgent && (
                                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-red-600 text-white animate-pulse">
                                                    Priority
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                            {request.subject}
                                        </h4>
                                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                                            {request.message}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                                            </span>
                                            {request.member_name && (
                                                <span className="font-mono font-bold text-slate-500">
                                                    {request.member_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Resolution Modal */}
            {selectedRequest && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedRequest(null)}
                >
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" />
                    <div
                        className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-800">
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3">
                                {(() => {
                                    const config = categoryConfig[selectedRequest.category];
                                    const colors = getColorClasses(config.color);
                                    const Icon = config.icon;
                                    return (
                                        <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                                            <Icon className={`w-6 h-6 ${colors.text}`} />
                                        </div>
                                    );
                                })()}
                                <div>
                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${getColorClasses(categoryConfig[selectedRequest.category].color).bg} ${getColorClasses(categoryConfig[selectedRequest.category].color).text}`}>
                                        {categoryConfig[selectedRequest.category].label}
                                    </span>
                                    <h3 className="text-lg font-bold text-white mt-1">{selectedRequest.subject}</h3>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-5">
                            {/* Patient Info */}
                            {selectedRequest.member_name && (
                                <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Patient:</span>
                                    <span className="text-sm font-bold text-white font-mono">{selectedRequest.member_name}</span>
                                </div>
                            )}

                            {/* Message */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Message</label>
                                <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{selectedRequest.message}</p>
                                </div>
                                <p className="text-[10px] text-slate-500">
                                    Submitted {format(new Date(selectedRequest.created_at), 'MMM d, yyyy @ HH:mm')}
                                </p>
                            </div>

                            {/* Resolution Note */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Resolution Note <span className="text-slate-600">(Optional)</span>
                                </label>
                                <textarea
                                    value={resolutionNote}
                                    onChange={e => setResolutionNote(e.target.value)}
                                    placeholder="Document how this was resolved..."
                                    rows={3}
                                    className="w-full p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 pt-0 flex gap-3">
                            <Button
                                onClick={() => setSelectedRequest(null)}
                                variant="outline"
                                className="flex-1"
                            >
                                Close
                            </Button>
                            <Button
                                onClick={handleResolve}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={resolving}
                            >
                                {resolving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Resolving...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Mark Resolved
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
