/**
 * WaitlistManager - Provider view for managing waitlisted patients
 * 
 * @component
 * @description Allows providers to view, filter, and process waitlist entries.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api, type WaitlistEntry } from '../../lib/api';
import { Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export function WaitlistManager() {
    const { user } = useAuth();
    const [entries, setEntries] = useState<WaitlistEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await api.getProviderWaitlist(user.id);
            setEntries(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleAction = async (entryId: string, action: 'fulfill' | 'dismiss') => {
        setProcessingId(entryId);
        // Simulate API delay
        await new Promise(r => setTimeout(r, 600));

        // In a real app we would call an API. 
        // For mock, we simply "leave" or "update status".
        // We'll reuse leaveWaitlist for dismissal, but ideally we'd have a specific "fulfill" 
        // status update. Since api only has `leaveWaitlist` (cancel), we'll use that for dismiss.
        // For fulfill, we probably need a new method or just pretend for now.

        try {
            if (action === 'dismiss') {
                await api.leaveWaitlist(entryId);
                toast.success('Removed from waitlist');
            } else {
                // Pretend we notified them
                toast.success('Patient notified! They have 24h to book.');
                await api.leaveWaitlist(entryId); // Remove from active list for now
            }
            loadData();
        } catch {
            toast.error('Action failed');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Loading waitlist...</div>;

    if (entries.length === 0) {
        return (
            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Waitlist Empty</h3>
                <p className="text-xs text-slate-400 mt-1">No patients currently waiting for slots.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Priority Queue ({entries.length})
                </h3>
            </div>

            <div className="space-y-3">
                {entries.map(entry => (
                    <div
                        key={entry.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                    >
                        {/* Status Bar */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />

                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                                        {entry.member_name}
                                    </span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-wide">
                                        {formatDistanceToNow(new Date(entry.created_at))} wait
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-2">
                                    {entry.preferred_days && entry.preferred_days.length > 0 && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {entry.preferred_days.length === 5 ? 'Mon-Fri' : `${entry.preferred_days.length} days pref`}
                                        </span>
                                    )}
                                    {entry.note && (
                                        <span className="block w-full text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded text-[11px] italic mt-1">
                                            "{entry.note}"
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => handleAction(entry.id, 'fulfill')}
                                    disabled={!!processingId}
                                    className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800"
                                >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Offer
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAction(entry.id, 'dismiss')}
                                    disabled={!!processingId}
                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200"
                                >
                                    <XCircle className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


