import React, { useMemo } from 'react';
import type { Appointment } from '../../lib/api';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';

interface HeatmapProps {
    appointments: Appointment[];
}

export const AnalyticsHeatmap: React.FC<HeatmapProps> = ({ appointments }) => {
    const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 07:00 to 20:00
    const days = useMemo(() => {
        const start = startOfWeek(new Date(), { weekStartsOn: 1 });
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }, []);

    const getIntensity = (day: Date, hour: number) => {
        const slotsInHour = appointments.filter(a => {
            const date = parseISO(a.start_time);
            return isSameDay(date, day) && date.getHours() === hour;
        });

        if (slotsInHour.length === 0) return 0;
        const booked = slotsInHour.filter(s => s.member_id).length;
        return (booked / slotsInHour.length) * 100;
    };

    const getColor = (intensity: number) => {
        if (intensity === 0) return 'bg-slate-50 dark:bg-slate-800/20';
        if (intensity < 30) return 'bg-indigo-100 dark:bg-indigo-900/30';
        if (intensity < 60) return 'bg-indigo-300 dark:bg-indigo-600/50';
        if (intensity < 90) return 'bg-indigo-500 dark:bg-indigo-500/80';
        return 'bg-indigo-700 dark:bg-indigo-400';
    };

    // Dynamic Stats Calculation
    const stats = useMemo(() => {
        let maxHourlyLoad = 0;
        let peakHour = 9;
        let totalLoad = 0;
        let activeSlotCount = 0;

        hours.forEach(h => {
            let hourSum = 0;
            days.forEach(d => {
                const intensity = getIntensity(d, h);
                hourSum += intensity;
                if (intensity > 0) {
                    totalLoad += intensity;
                    activeSlotCount++;
                }
            });
            // Avg load for this hour across the week
            if (hourSum > maxHourlyLoad) {
                maxHourlyLoad = hourSum;
                peakHour = h;
            }
        });

        const overallLoad = activeSlotCount > 0 ? (totalLoad / activeSlotCount) : 0;

        return {
            peakWindow: `${peakHour.toString().padStart(2, '0')}:00 — ${(peakHour + 1).toString().padStart(2, '0')}:00`,
            avgLoad: overallLoad.toFixed(1) + '%'
        };
    }, [appointments, days, hours]);

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Strategic Distribution Matrix</h3>
                    <p className="ent-muted">Capacity vs Utilization Heatmap</p>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-1 rounded-md border border-slate-100 dark:border-slate-700">
                    <span className="w-2 h-2 rounded-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-200 dark:bg-indigo-900/50"></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-400 dark:bg-indigo-600"></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-700 dark:bg-indigo-400"></span>
                    <span className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 ml-1">Intensity Index</span>
                </div>
            </div>

            <div className="relative overflow-x-auto custom-scrollbar pb-2">
                <div className="min-w-[700px]">
                    {/* Header: Days */}
                    <div className="flex border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
                        <div className="w-16"></div>
                        {days.map(day => (
                            <div key={day.toISOString()} className="flex-1 text-center">
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{format(day, 'EEE')}</span>
                            </div>
                        ))}
                    </div>

                    {/* Matrix Rows: Hours */}
                    <div className="space-y-1">
                        {hours.map(hour => (
                            <div key={hour} className="flex items-center">
                                <div className="w-16">
                                    <span className="text-[10px] font-black text-slate-900 dark:text-slate-200 uppercase tracking-tighter">{hour}:00</span>
                                </div>
                                <div className="flex flex-1 gap-1">
                                    {days.map(day => {
                                        const intensity = getIntensity(day, hour);
                                        return (
                                            <div
                                                key={`${day.toISOString()}-${hour}`}
                                                className={`flex-1 h-8 rounded-sm transition-all hover:scale-105 hover:z-10 cursor-help border border-transparent hover:border-white dark:hover:border-slate-400 ${getColor(intensity)}`}
                                                title={`Utilization: ${Math.round(intensity)}%`}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-4">
                <div className="flex gap-4">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Peak Window</span>
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100">{stats.peakWindow}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Avg Load</span>
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100">{stats.avgLoad}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-subtle-pulse"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time telemetry stream active</span>
                </div>
            </div>
        </div>
    );
};
