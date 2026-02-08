import React from 'react';
import { format, startOfWeek, addDays, isToday, isSameDay, parseISO } from 'date-fns';
import { cn } from '../../../lib/utils';
import { type Appointment } from '../../../lib/api';
import { AppointmentBlock } from './AppointmentBlock';

interface WeekViewProps {
    currentDate: Date;
    appointments: Appointment[];
    isSelectionMode: boolean;
    selectedSlots: Set<string>;
    toggleSelection: (id: string) => void;
    setSelectedAppointment: (apt: Appointment) => void;
    setHoveredApt: (apt: Appointment | null, e?: React.MouseEvent) => void;
    handleToggleBlock: (id: string, isBlocked: boolean) => void;
    handleDeleteSlot: (id: string) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
    currentDate,
    appointments,
    isSelectionMode,
    selectedSlots,
    toggleSelection,
    setSelectedAppointment,
    setHoveredApt,
    handleToggleBlock,
    handleDeleteSlot
}) => {
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(currentDate, { weekStartsOn: 0 }), i));
    const START_HOUR = 6;
    const END_HOUR = 20;
    const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;
    const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-800 shadow-sm selec-none">
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-20 shadow-sm">
                <div className="w-12 flex-shrink-0 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800"></div>
                <div className="flex-1 grid grid-cols-7 divide-x divide-slate-200 dark:divide-slate-800">
                    {weekDays.map((day) => (
                        <div key={day.toISOString()} className={cn(
                            "p-2 text-center transition-colors",
                            isToday(day) && "bg-indigo-50/50 dark:bg-indigo-900/20"
                        )}>
                            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{format(day, 'EEE')}</div>
                            <div className={cn(
                                "text-sm font-black",
                                isToday(day) ? "text-indigo-600 dark:text-indigo-400" : "text-slate-900 dark:text-white"
                            )}>{format(day, 'd')}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto relative no-scrollbar bg-slate-100/50 dark:bg-slate-950/50">
                <div className="flex min-h-[540px] relative">
                    <div className="w-12 flex-shrink-0 flex flex-col bg-slate-50 dark:bg-slate-900/80 border-r border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-300 select-none z-10 sticky left-0">
                        {HOURS.map(h => (
                            <div key={h} className="flex-1 relative border-b border-slate-200/50 dark:border-slate-800/50">
                                <span className="absolute -top-2 right-1.5 bg-slate-50 dark:bg-slate-900 px-1 rounded">{h}:00</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 grid grid-cols-7 divide-x divide-slate-200 dark:divide-slate-800 relative bg-white dark:bg-slate-950/30">
                        <div className="absolute inset-0 flex flex-col pointer-events-none z-0">
                            {HOURS.map(h => (
                                <div key={h} className="flex-1 border-b border-slate-100 dark:border-slate-800/30 border-dashed"></div>
                            ))}
                        </div>

                        {weekDays.map(day => (
                            <div key={day.toISOString()} className={cn(
                                "relative h-full z-10 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group/col",
                                isToday(day) && "bg-indigo-50/10"
                            )}>
                                {appointments
                                    .filter(a => isSameDay(parseISO(a.start_time), day))
                                    .map(apt => (
                                        <AppointmentBlock
                                            key={apt.id}
                                            appointment={apt}
                                            isSelectionMode={isSelectionMode}
                                            isSelected={selectedSlots.has(apt.id)}
                                            onToggleSelection={toggleSelection}
                                            onSelect={setSelectedAppointment}
                                            onHover={setHoveredApt}
                                            onToggleBlock={handleToggleBlock}
                                            onDelete={handleDeleteSlot}
                                            startHour={START_HOUR}
                                            totalMinutes={TOTAL_MINUTES}
                                        />
                                    ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
