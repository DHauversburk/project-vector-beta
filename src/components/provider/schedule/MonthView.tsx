import React from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { cn } from '../../../lib/utils';
import { type Appointment } from '../../../lib/api';

interface MonthViewProps {
    currentDate: Date;
    appointments: Appointment[];
    setSelectedAppointment: (apt: Appointment) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
    currentDate,
    appointments,
    setSelectedAppointment
}) => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            const currentDay = day;
            const dayAppts = appointments.filter(a => isSameDay(parseISO(a.start_time), currentDay));
            const bookedCount = dayAppts.filter(a => a.member_id).length;

            days.push(
                <div
                    key={day.toISOString()}
                    className={cn(
                        "min-h-[100px] p-2 border-r border-b border-slate-200 dark:border-slate-800 transition-colors bg-white dark:bg-slate-900",
                        !isSameMonth(day, monthStart) && "opacity-30 bg-slate-50 dark:bg-slate-950",
                        isSameDay(day, new Date()) && "bg-indigo-50/30 dark:bg-indigo-900/10"
                    )}
                >
                    <div className="flex justify-between items-start mb-1">
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-tighter",
                            isSameDay(day, new Date()) ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500"
                        )}>
                            {format(day, 'd')}
                        </span>
                        {bookedCount > 0 && (
                            <span className="bg-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-white dark:ring-slate-900">
                                {bookedCount}
                            </span>
                        )}
                    </div>
                    <div className="space-y-1 overflow-y-auto max-h-[70px] no-scrollbar">
                        {dayAppts.slice(0, 4).map(apt => (
                            <div
                                key={apt.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (apt.member_id) setSelectedAppointment(apt);
                                }}
                                className={cn(
                                    "text-[8px] font-black uppercase p-1 rounded truncate border cursor-pointer transition-all hover:scale-105",
                                    apt.member_id
                                        ? "bg-indigo-600 border-indigo-700 text-white shadow-sm"
                                        : (apt.is_booked ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-100")
                                )}
                            >
                                {format(parseISO(apt.start_time), 'HH:mm')} {apt.member_id ? 'PATIENT' : (apt.is_booked ? 'HELD' : 'OPEN')}
                            </div>
                        ))}
                        {dayAppts.length > 4 && (
                            <div className="text-[7px] font-black text-slate-400 text-center uppercase tracking-widest mt-1">
                                +{dayAppts.length - 4} More
                            </div>
                        )}
                    </div>
                </div>
            );
            day = addDays(day, 1);
        }
        rows.push(<div key={day.toISOString()} className="grid grid-cols-7">{days}</div>);
        days = [];
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-800 shadow-sm select-none">
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                {weekDays.map(d => (
                    <div key={d} className="p-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {d}
                    </div>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {rows}
            </div>
        </div>
    );
};
