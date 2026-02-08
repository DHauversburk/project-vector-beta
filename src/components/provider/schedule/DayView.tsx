import React from 'react';
import { format, isToday, isSameDay, parseISO } from 'date-fns';
import { cn } from '../../../lib/utils';
import { type Appointment } from '../../../lib/api';
import { AppointmentBlock } from './AppointmentBlock';

interface DayViewProps {
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

export const DayView: React.FC<DayViewProps> = ({
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
    const START_HOUR = 6;
    const END_HOUR = 20;
    const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;
    const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

    const dayAppointments = appointments.filter(a => isSameDay(parseISO(a.start_time), currentDate));

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-800 shadow-sm select-none">
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-20 shadow-sm p-4 items-center justify-between">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Selected Logistics Day</div>
                    <div className={cn(
                        "text-xl font-black",
                        isToday(currentDate) ? "text-indigo-600 dark:text-indigo-400" : "text-slate-900 dark:text-white"
                    )}>
                        {format(currentDate, 'EEEE, MMMM do')}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Operational Density</div>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {dayAppointments.filter(a => a.member_id).length} Patients / {dayAppointments.length} Slots
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto relative no-scrollbar bg-white dark:bg-slate-950/30">
                <div className="flex min-h-[600px] relative">
                    <div className="w-16 flex-shrink-0 flex flex-col bg-slate-50 dark:bg-slate-900/80 border-r border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-300 select-none z-10 sticky left-0">
                        {HOURS.map(h => (
                            <div key={h} className="flex-1 relative border-b border-slate-200/50 dark:border-slate-800/50">
                                <span className="absolute -top-2 right-2 bg-slate-50 dark:bg-slate-900 px-1 rounded">{h}:00</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 relative">
                        <div className="absolute inset-0 flex flex-col pointer-events-none z-0">
                            {HOURS.map(h => (
                                <div key={h} className="flex-1 border-b border-slate-100 dark:border-slate-800/20 border-dashed"></div>
                            ))}
                        </div>

                        <div className="relative h-full z-10 w-full max-w-2xl mx-auto">
                            {dayAppointments.map(apt => (
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
                    </div>
                </div>
            </div>
        </div>
    );
};
