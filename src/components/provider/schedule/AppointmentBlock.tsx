import React from 'react';
import { User, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '../../../lib/utils';
import { type Appointment } from '../../../lib/api';
import { generatePatientCodename } from '../../../lib/codenames';

interface AppointmentBlockProps {
    appointment: Appointment;
    isSelectionMode: boolean;
    isSelected: boolean;
    onToggleSelection: (id: string) => void;
    onSelect: (apt: Appointment) => void;
    onHover: (apt: Appointment | null, e?: React.MouseEvent) => void;
    onToggleBlock: (id: string, isBlocked: boolean) => void;
    onDelete: (id: string) => void;
    startHour: number;
    totalMinutes: number;
    compact?: boolean;
}

export const AppointmentBlock: React.FC<AppointmentBlockProps> = ({
    appointment: apt,
    isSelectionMode,
    isSelected,
    onToggleSelection,
    onSelect,
    onHover,
    onToggleBlock,
    onDelete,
    startHour,
    totalMinutes,
    compact = false
}) => {
    const start = parseISO(apt.start_time);
    const end = parseISO(apt.end_time);

    const startMins = (start.getHours() - startHour) * 60 + start.getMinutes();
    const validStart = Math.max(0, startMins);
    const duration = (end.getTime() - start.getTime()) / 60000;

    const top = (validStart / totalMinutes) * 100;
    const height = (duration / totalMinutes) * 100;

    if (validStart >= totalMinutes) return null;

    const getBlockStyle = (apt: Appointment) => {
        if (apt.member_id) return "bg-indigo-600 border-indigo-700 text-white shadow-indigo-200 dark:shadow-none";
        if (apt.status === 'blocked' || apt.is_booked) return "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 border-dashed";
        return "bg-emerald-50 content-emerald-600 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/50 dark:text-emerald-400";
    };

    return (
        <div
            className={cn(
                "absolute inset-x-1 rounded overflow-hidden p-1.5 border shadow-sm cursor-pointer hover:z-20 transition-all hover:scale-[1.02] hover:shadow-md flex flex-col group/apt uppercase tracking-tight",
                getBlockStyle(apt),
                height < 3 ? "flex-row items-center gap-1.5 px-2" : ""
            )}
            style={{ top: `${top}%`, height: `${height}%`, minHeight: '22px' }}
            onClick={(e) => {
                e.stopPropagation();
                if (isSelectionMode) {
                    onToggleSelection(apt.id);
                    return;
                }
                if (apt.member_id) onSelect(apt);
            }}
            onMouseEnter={(e) => onHover(apt, e)}
            onMouseMove={(e) => onHover(apt, e)}
            onMouseLeave={() => onHover(null)}
        >
            <div className="flex items-center justify-between leading-none w-full relative">
                {!compact && <span className="text-[10px] font-black text-current">{format(start, 'HH:mm')}</span>}

                {/* Selection Checkbox */}
                {isSelectionMode && (
                    <div className="absolute top-0 right-0 p-0.5">
                        {isSelected ? (
                            <div className="bg-indigo-600 text-white rounded text-[8px] p-0.5"><Check className="w-2.5 h-2.5" /></div>
                        ) : (
                            <div className="border border-slate-400 rounded w-3.5 h-3.5 bg-white/50"></div>
                        )}
                    </div>
                )}

                {/* Quick Actions (Hover) - Hide in Selection Mode */}
                {!apt.member_id && !isSelectionMode && (
                    <div className="opacity-0 group-hover/apt:opacity-100 transition-opacity flex gap-1 bg-black/10 rounded px-1 backdrop-blur-sm ml-auto">
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleBlock(apt.id, !apt.is_booked); }}
                            className="hover:text-indigo-800 text-[8px] font-black uppercase p-0.5"
                        >
                            {apt.is_booked ? 'Unlock' : 'Hold'}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(apt.id); }}
                            className="hover:text-red-700 text-[8px] font-black uppercase p-0.5 text-red-600"
                        >
                            X
                        </button>
                    </div>
                )}
            </div>

            <div className="truncate font-black mt-0.5 w-full tracking-tight">
                {apt.member_id ? (
                    <span className="flex items-center gap-1 text-[11px]">
                        <User className="w-3 h-3" /> {generatePatientCodename(apt.member_id)}
                    </span>
                ) : (
                    apt.is_booked ? (
                        <span className="block text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-100 leading-tight">
                            {apt.notes || 'BLOCKED'}
                        </span>
                    ) : <span className="flex items-center gap-1 text-[11px]"><Check className="w-3 h-3" /> OPEN</span>
                )}
            </div>

            {height > 5 && apt.member_id && (
                <div className="text-[10px] font-bold opacity-100 mt-0.5 overflow-hidden leading-tight truncate">
                    {apt.notes}
                </div>
            )}
        </div>
    );
};
