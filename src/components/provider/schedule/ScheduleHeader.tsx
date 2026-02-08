import React from 'react';
import { ChevronLeft, ChevronRight, CheckSquare, Trash2, MousePointer2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/Button';
import { type ViewMode } from '../../../lib/api';

interface ScheduleHeaderProps {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
    navigate: (direction: 'prev' | 'next') => void;
    isSelectionMode: boolean;
    setIsSelectionMode: (val: boolean) => void;
    selectedSlotsCount: number;
    handleSelectAll: () => void;
    handleBulkDelete: () => void;
}

export const ScheduleHeader: React.FC<ScheduleHeaderProps> = ({
    viewMode, setViewMode,
    currentDate, setCurrentDate,
    navigate,
    isSelectionMode, setIsSelectionMode,
    selectedSlotsCount,
    handleSelectAll,
    handleBulkDelete
}) => {
    return (
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between px-4 md:px-6 py-4 border-b border-slate-300 dark:border-slate-800 bg-slate-50/30 dark:bg-transparent gap-4 md:gap-0">
            <div className="flex items-center justify-between md:justify-start gap-6">
                <div className="flex flex-col">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none mb-1">
                        {viewMode === 'day' ? format(currentDate, 'MMMM d, yyyy') : format(currentDate, 'MMMM yyyy')}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Appointment Overview</p>
                </div>

                <div className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-0.5">
                    <button onClick={() => navigate('prev')} className="p-1.5 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm rounded text-slate-500 dark:text-slate-400 transition-all">
                        <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600 transition-colors"
                    >
                        Now
                    </button>
                    <button onClick={() => navigate('next')} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-slate-500 dark:text-slate-400 transition-all">
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-4">
                {isSelectionMode ? (
                    <div className="flex items-center gap-2 animate-in slide-in-from-top-1 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded px-2 py-1 flex-1 md:flex-none justify-between md:justify-start">
                        <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest px-2">
                            {selectedSlotsCount} Selected
                        </span>
                        <div className="h-4 w-px bg-indigo-200 dark:bg-indigo-700 mx-1"></div>
                        <div className="flex gap-1">
                            <button onClick={handleSelectAll} className="p-1 hover:bg-white/50 rounded text-slate-600 dark:text-slate-300" title="Select All">
                                <CheckSquare className="w-4 h-4" />
                            </button>
                            <button onClick={handleBulkDelete} disabled={selectedSlotsCount === 0} className="p-1 hover:bg-red-100 text-red-600 rounded disabled:opacity-50" title="Delete Selected">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="h-4 w-px bg-indigo-200 dark:bg-indigo-700 mx-1"></div>
                        <Button size="sm" variant="ghost" onClick={() => setIsSelectionMode(false)} className="h-6 text-[9px] px-2 text-indigo-700">
                            Done
                        </Button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsSelectionMode(true)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5"
                    >
                        <MousePointer2 className="w-3 h-3" /> <span className="hidden md:inline">Select</span>
                    </button>
                )}

                <div className="flex p-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
                    {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={cn(
                                "px-4 py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-all",
                                viewMode === mode
                                    ? "bg-white text-indigo-600 shadow-sm border border-slate-100"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700",
                                mode !== 'day' && "hidden md:block" // Hide week/month on mobile
                            )}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
