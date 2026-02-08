import React from 'react';
import { Bell } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { type ScheduleUpdate } from '../../../lib/api';

interface RecentActivityProps {
    updates: ScheduleUpdate[];
    showUpdates: boolean;
    setShowUpdates: (val: boolean) => void;
    clearUpdates: () => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
    updates,
    showUpdates,
    setShowUpdates,
    clearUpdates
}) => {
    if (updates.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50">
            <button
                onClick={() => setShowUpdates(!showUpdates)}
                className="relative p-2 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
            >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                    {updates.length}
                </span>
            </button>

            {showUpdates && (
                <div className="absolute top-12 right-0 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden animate-in slide-in-from-top-2">
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Schedule Updates</span>
                        <button onClick={clearUpdates} className="text-[9px] font-bold text-indigo-600">Clear All</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        {updates.map(update => (
                            <div key={update.id} className="p-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "text-[9px] font-black uppercase px-1.5 py-0.5 rounded",
                                        update.type === 'new' ? 'bg-emerald-100 text-emerald-700' :
                                            update.type === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                'bg-amber-100 text-amber-700'
                                    )}>
                                        {update.type === 'new' ? 'NEW BOOKING' :
                                            update.type === 'cancelled' ? 'CANCELLED' : 'RESCHEDULED'}
                                    </span>
                                </div>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">{update.patientName}</p>
                                <p className="text-[10px] text-indigo-600 font-bold">{update.reason}</p>
                                <p className="text-[9px] text-slate-400 mt-0.5">{update.time}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
