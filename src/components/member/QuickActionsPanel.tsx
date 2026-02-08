/**
 * QuickActionsPanel - Dashboard shortcuts
 * 
 * @component
 * @description Provides clear, big-target buttons for the most common user actions:
 * booking, rescheduling, and getting help.
 */

import { Zap, Calendar, MessageSquare, ArrowRight } from 'lucide-react';

interface QuickActionsPanelProps {
    onBook: () => void;
    onViewSchedule: () => void;
    onRequestHelp: () => void;
}

export function QuickActionsPanel({ onBook, onViewSchedule, onRequestHelp }: QuickActionsPanelProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <button
                onClick={onBook}
                className="group relative overflow-hidden bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all text-left"
            >
                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                <div className="relative z-10">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-colors text-indigo-600">
                        <Zap className="w-4 h-4" />
                    </div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight mb-0.5">Book Visit</h3>
                    <p className="text-[10px] text-slate-500 font-medium mb-2 leading-tight">Find next available</p>
                    <div className="flex items-center text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                        Start <ArrowRight className="w-2.5 h-2.5 ml-1" />
                    </div>
                </div>
            </button>

            <button
                onClick={onViewSchedule}
                className="group relative overflow-hidden bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all text-left"
            >
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                <div className="relative z-10">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center mb-2 group-hover:bg-emerald-600 group-hover:text-white transition-colors text-emerald-600">
                        <Calendar className="w-4 h-4" />
                    </div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight mb-0.5">My Schedule</h3>
                    <p className="text-[10px] text-slate-500 font-medium mb-2 leading-tight">View upcoming</p>
                    <div className="flex items-center text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                        View <ArrowRight className="w-2.5 h-2.5 ml-1" />
                    </div>
                </div>
            </button>

            <button
                onClick={onRequestHelp}
                className="col-span-2 md:col-span-1 group relative overflow-hidden bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all text-left"
            >
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                <div className="relative z-10 flex md:block items-center justify-between">
                    <div>
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:text-white transition-colors text-blue-600">
                            <MessageSquare className="w-4 h-4" />
                        </div>
                        <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight mb-0.5">Request Help</h3>
                        <p className="text-[10px] text-slate-500 font-medium mb-2 leading-tight">Message your provider</p>
                    </div>
                    <div className="hidden md:flex items-center text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                        Contact <ArrowRight className="w-2.5 h-2.5 ml-1" />
                    </div>
                    {/* Mobile-only Action Button appearance for the 3rd item */}
                    <div className="md:hidden bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-wide">
                        Contact
                    </div>
                </div>
            </button>
        </div>
    );
}
