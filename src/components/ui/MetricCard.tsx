import React from 'react';
import { cn } from '../../lib/utils';

export interface MetricCardProps {
    icon: React.ElementType;
    label: string;
    value: string;
    sub: string;
    color: 'indigo' | 'emerald' | 'amber' | 'slate' | 'rose';
}

export const MetricCard = ({ icon: Icon, label, value, sub, color }: MetricCardProps) => {
    const colors = {
        indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
        emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
        amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
        rose: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400",
        slate: "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-3 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] group">
            <div className="flex items-center gap-3 md:gap-4">
                <div className={cn("p-2 md:p-3 rounded-xl transition-colors group-hover:scale-110", colors[color])}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5 md:mb-1">{label}</p>
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-0.5 md:mb-1">{value}</h3>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">{sub}</p>
                </div>
            </div>
        </div>
    );
};
