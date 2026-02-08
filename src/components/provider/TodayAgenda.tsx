import React from 'react';
import { Coffee, ArrowRight, Calendar, Search } from 'lucide-react';
import { format, isAfter, isBefore, addMinutes } from 'date-fns';
import { Input } from '../ui/Input';
import { generatePatientCodename } from '../../lib/codenames';
import { type Appointment } from '../../lib/api';

interface TodayAgendaProps {
    appointments: Appointment[];
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    onNavigate: (view: string) => void;
    onNoShow: (id: string) => void;
    safeParse: (date: string) => Date;
    now: Date;
}

export const TodayAgenda: React.FC<TodayAgendaProps> = ({
    appointments: filteredAgenda,
    searchTerm,
    setSearchTerm,
    onNavigate,
    onNoShow,
    safeParse,
    now
}) => {
    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" /> Today's Agenda
                </h2>
                <div className="flex items-center gap-3">
                    <div className="relative group flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <Input
                            placeholder="Search agenda..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs"
                        />
                    </div>
                    <button onClick={() => onNavigate('schedule')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors shrink-0">
                        View Full <ArrowRight className="w-3 h-3" />
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                {filteredAgenda.length === 0 ? (
                    <div className="p-6 text-center text-slate-500">
                        <Coffee className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="font-bold text-[10px] uppercase tracking-widest">
                            {searchTerm ? 'No results for search' : 'No patients scheduled for today'}
                        </p>
                    </div>
                ) : (
                    filteredAgenda.map(apt => {
                        const isPast = isAfter(now, safeParse(apt.end_time));
                        const isCurrent = isBefore(now, safeParse(apt.end_time)) && isAfter(now, safeParse(apt.start_time));
                        const isLate = isAfter(now, addMinutes(safeParse(apt.start_time), 15)) && !isPast && !isCurrent;

                        return (
                            <div key={apt.id} className={`p-3 md:p-4 flex items-center gap-3 md:gap-4 transition-colors ${isCurrent ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'} ${isPast ? 'opacity-50 grayscale' : ''}`}>
                                <div className={`text-sm font-black w-16 text-right ${isCurrent ? 'text-indigo-600' : 'text-slate-500'}`}>
                                    {format(safeParse(apt.start_time), 'HH:mm')}
                                </div>
                                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isCurrent ? 'bg-indigo-600 shadow-lg ring-4 ring-indigo-50 dark:ring-indigo-900/50' : (isPast ? 'bg-slate-300' : 'bg-emerald-400')}`}></div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                                        {generatePatientCodename(apt.member_id!)}
                                        {apt.notes && <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wide truncate max-w-[150px]">{apt.notes}</span>}
                                        {isLate && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-black uppercase tracking-wide animate-pulse">Late Arrival</span>}
                                    </div>
                                    <div className="text-[10px] text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider mt-0.5">
                                        Standard Visit • 45m
                                    </div>
                                </div>
                                <div className="flex-shrink-0 flex items-center gap-2">
                                    {isLate && (
                                        <button
                                            onClick={() => onNoShow(apt.id)}
                                            className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded text-[9px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors"
                                        >
                                            No-Show
                                        </button>
                                    )}
                                    {isCurrent && <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-1 rounded dark:bg-indigo-900 dark:text-indigo-300 animate-pulse">active</span>}
                                </div>
                            </div>
                        );
                    })
                )}
                {filteredAgenda.length > 0 && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 text-center border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">End of Agenda</p>
                    </div>
                )}
            </div>
        </div>
    );
};
