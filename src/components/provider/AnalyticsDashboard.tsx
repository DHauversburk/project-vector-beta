import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import {
    TrendingUp,
    CheckCircle2,
    Star,
    Users,
    Clock,
    Calendar,
    AlertTriangle,
    XCircle,
    ChevronRight,
    ArrowUp,
    ArrowDown,
    X
} from 'lucide-react';
import { AnalyticsHeatmap } from './AnalyticsHeatmap';
import { format, isAfter, parseISO, isBefore, differenceInDays, startOfWeek, endOfWeek, subWeeks } from 'date-fns';

type MetricCardProps = {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: { value: number; direction: 'up' | 'down'; isGood?: boolean };
    isFavorite: boolean;
    onToggleFavorite: () => void;
    onClick?: () => void;
    colorClass?: string;
};

const MetricCard: React.FC<MetricCardProps> = ({
    title, value, subtitle, icon, trend, isFavorite, onToggleFavorite, onClick, colorClass = 'text-indigo-600'
}) => (
    <div
        className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-all cursor-pointer hover:border-indigo-400/30"
        onClick={onClick}
    >
        <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className={`absolute top-2 right-2 z-20 transition-all ${isFavorite
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-slate-400 dark:text-slate-500 hover:text-amber-400 opacity-0 group-hover:opacity-100'
                }`}
        >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        <div className="flex items-start justify-between">
            <div className="flex flex-col">
                <div className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest leading-none mb-1.5">
                    {title}
                </div>
                <div className={`text-2xl font-black tracking-tighter leading-none ${colorClass}`}>
                    {value}
                </div>
            </div>

            <div className="p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-100 dark:border-slate-700/50">
                {icon}
            </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between min-h-[16px]">
            <div className="flex items-center gap-2">
                {trend && (
                    <span className={`text-[9px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5 leading-none ${trend.isGood !== false // Default to Good if undefined
                        ? (trend.direction === 'up' ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400')
                        : (trend.direction === 'down' ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400')
                        }`}>
                        {trend.direction === 'up' ? <ArrowUp className="w-2 h-2" /> : <ArrowDown className="w-2 h-2" />}
                        {Math.abs(trend.value)}%
                    </span>
                )}
                {subtitle && (
                    <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-none">{subtitle}</span>
                )}
            </div>
            {onClick && (
                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 transition-colors" />
            )}
        </div>
    </div>
);

type DetailModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    data: any[];
    renderItem: (item: any, index: number) => React.ReactNode;
};

const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, title, data, renderItem }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[80vh] overflow-hidden animate-in zoom-in-95">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                        <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto max-h-[60vh] space-y-3">
                    {data.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">No data available</div>
                    ) : (
                        data.map((item, idx) => renderItem(item, idx))
                    )}
                </div>
            </div>
        </div>
    );
};

export const AnalyticsDashboard: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState<string[]>(() => {
        const stored = localStorage.getItem('ANALYTICS_FAVORITES');
        return stored ? JSON.parse(stored) : [];
    });
    const [activeModal, setActiveModal] = useState<string | null>(null);

    useEffect(() => {
        api.getAnalytics()
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const toggleFavorite = (id: string) => {
        const newFavorites = favorites.includes(id)
            ? favorites.filter(f => f !== id)
            : [...favorites, id];
        setFavorites(newFavorites);
        localStorage.setItem('ANALYTICS_FAVORITES', JSON.stringify(newFavorites));
    };

    if (loading) return (
        <div className="h-64 flex flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Loading Analytics...</span>
        </div>
    );

    const appointments = data?.appointments || [];
    const feedback = data?.feedback || [];
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    // Comparison: Last Week
    const lastWeekStart = subWeeks(weekStart, 1);
    const lastWeekEnd = subWeeks(weekEnd, 1);

    const thisWeekAppts = appointments.filter((a: any) => {
        const date = parseISO(a.start_time);
        return isAfter(date, weekStart) && isBefore(date, weekEnd);
    });

    const lastWeekAppts = appointments.filter((a: any) => {
        const date = parseISO(a.start_time);
        return isAfter(date, lastWeekStart) && isBefore(date, lastWeekEnd);
    });

    const calculateCompletionRate = (list: any[]) => {
        const completed = list.filter((a: any) => a.status === 'completed').length;
        const total = list.filter((a: any) => a.member_id).length;
        return total > 0 ? (completed / total * 100) : 0;
    };

    const completionRate = calculateCompletionRate(thisWeekAppts);
    const lastWeekCompletionRate = calculateCompletionRate(lastWeekAppts);
    const completionTrend = lastWeekCompletionRate > 0 ? (completionRate - lastWeekCompletionRate) : 0;

    const noShows = thisWeekAppts.filter((a: any) => a.status === 'cancelled').length;
    const lastWeekNoShows = lastWeekAppts.filter((a: any) => a.status === 'cancelled').length;
    const noShowTrend = (noShows - lastWeekNoShows);

    const stats = {
        weeklyTotal: thisWeekAppts.length,
        completed: thisWeekAppts.filter((a: any) => a.status === 'completed').length,
        completionRate: completionRate,
        noShows: noShows,
        upcoming: thisWeekAppts.filter((a: any) => isAfter(parseISO(a.start_time), now) && a.status !== 'cancelled' && a.member_id).length,
        openSlots: thisWeekAppts.filter((a: any) => !a.member_id && !a.is_booked && isAfter(parseISO(a.start_time), now)).length,
        avgRating: feedback.length > 0 ? (feedback.reduce((acc: number, f: any) => acc + f.rating, 0) / feedback.length) : 0,
        utilization: thisWeekAppts.length > 0 ? (thisWeekAppts.filter((a: any) => a.member_id).length / thisWeekAppts.length * 100) : 0,
        uniquePatients: new Set(appointments.filter((a: any) => a.member_id && a.status === 'completed').map((a: any) => a.member_id)).size
    };

    const warnings: string[] = [];
    if (stats.noShows > 5) warnings.push(`High cancellation rate: ${stats.noShows} cancelled appointments`);
    if (stats.openSlots === 0) warnings.push('No open slots remaining this week');
    if (stats.avgRating > 0 && stats.avgRating < 4) warnings.push(`Patient satisfaction below target: ${stats.avgRating.toFixed(1)}/5`);
    if (stats.utilization > 90) warnings.push('Schedule nearing capacity');

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {favorites.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Star className="w-4 h-4 text-amber-500 fill-current" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">
                            Watched Metrics
                        </span>
                    </div>
                    <div className="text-xs text-amber-600 dark:text-amber-400">
                        {favorites.length} metric{favorites.length > 1 ? 's' : ''} being tracked
                    </div>
                </div>
            )}

            {warnings.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-700 dark:text-red-300">
                            Attention Required
                        </span>
                    </div>
                    <ul className="space-y-1">
                        {warnings.map((w, i) => (
                            <li key={i} className="text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                {w}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <MetricCard
                    title="Completed Appointments"
                    value={stats.completed}
                    subtitle="This Week"
                    icon={<CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />}
                    isFavorite={favorites.includes('completed')}
                    onToggleFavorite={() => toggleFavorite('completed')}
                    onClick={() => setActiveModal('completed')}
                    colorClass="text-emerald-600 dark:text-emerald-400"
                />

                <MetricCard
                    title="Completion Rate"
                    value={`${stats.completionRate.toFixed(0)}%`}
                    subtitle="Booked → Completed"
                    icon={<TrendingUp className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />}
                    trend={completionTrend !== 0 ? { value: Math.round(Math.abs(completionTrend)), direction: completionTrend > 0 ? 'up' : 'down', isGood: true } : undefined}
                    isFavorite={favorites.includes('completionRate')}
                    onToggleFavorite={() => toggleFavorite('completionRate')}
                    colorClass="text-indigo-600 dark:text-indigo-400"
                />

                <MetricCard
                    title="Cancellations"
                    value={stats.noShows}
                    subtitle="This Week"
                    icon={<XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />}
                    trend={noShowTrend !== 0 ? { value: Math.round(Math.abs(noShowTrend * 100)), direction: noShowTrend > 0 ? 'up' : 'down', isGood: false } : undefined}
                    isFavorite={favorites.includes('noShows')}
                    onToggleFavorite={() => toggleFavorite('noShows')}
                    onClick={() => setActiveModal('noShows')}
                    colorClass={stats.noShows > 5 ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-slate-300"}
                />

                <MetricCard
                    title="Avg Patient Rating"
                    value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'N/A'}
                    subtitle="out of 5.0"
                    icon={<Star className="w-4 h-4 text-amber-500" />}
                    isFavorite={favorites.includes('avgRating')}
                    onToggleFavorite={() => toggleFavorite('avgRating')}
                    onClick={() => setActiveModal('feedback')}
                    colorClass={stats.avgRating >= 4 ? "text-amber-500" : "text-slate-700 dark:text-slate-300"}
                />

                <MetricCard
                    title="Upcoming This Week"
                    value={stats.upcoming}
                    subtitle="Confirmed appointments"
                    icon={<Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />}
                    isFavorite={favorites.includes('upcoming')}
                    onToggleFavorite={() => toggleFavorite('upcoming')}
                    onClick={() => setActiveModal('upcoming')}
                    colorClass="text-blue-600 dark:text-blue-400"
                />

                <MetricCard
                    title="Open Slots"
                    value={stats.openSlots}
                    subtitle="Available this week"
                    icon={<Clock className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />}
                    isFavorite={favorites.includes('openSlots')}
                    onToggleFavorite={() => toggleFavorite('openSlots')}
                    colorClass={stats.openSlots === 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}
                />

                <MetricCard
                    title="Unique Patients"
                    value={stats.uniquePatients}
                    subtitle="Distinct patients seen"
                    icon={<Users className="w-4 h-4 text-purple-500 dark:text-purple-400" />}
                    isFavorite={favorites.includes('uniquePatients')}
                    onToggleFavorite={() => toggleFavorite('uniquePatients')}
                    colorClass="text-purple-600 dark:text-purple-400"
                />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4">
                    Appointment Volume by Day/Time
                </h3>
                <AnalyticsHeatmap appointments={appointments} />
            </div>

            <DetailModal
                isOpen={activeModal === 'completed'}
                onClose={() => setActiveModal(null)}
                title="Completed Appointments"
                data={appointments.filter((a: any) => a.status === 'completed').slice(-20)}
                renderItem={(item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div>
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {format(parseISO(item.start_time), 'MMM d, yyyy @ HH:mm')}
                            </div>
                            <div className="text-[10px] text-slate-600 dark:text-slate-400">Patient: {item.member_id?.substring(0, 8)}...</div>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                )}
            />

            <DetailModal
                isOpen={activeModal === 'noShows'}
                onClose={() => setActiveModal(null)}
                title="Cancelled Appointments"
                data={appointments.filter((a: any) => a.status === 'cancelled').slice(-20)}
                renderItem={(item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950/50 rounded-lg">
                        <div>
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {format(parseISO(item.start_time), 'MMM d, yyyy @ HH:mm')}
                            </div>
                            <div className="text-[10px] text-slate-600 dark:text-slate-400">Status: Cancelled</div>
                        </div>
                        <XCircle className="w-4 h-4 text-red-500" />
                    </div>
                )}
            />

            <DetailModal
                isOpen={activeModal === 'upcoming'}
                onClose={() => setActiveModal(null)}
                title="Upcoming Appointments"
                data={appointments.filter((a: any) => isAfter(parseISO(a.start_time), now) && a.member_id).slice(0, 20)}
                renderItem={(item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                        <div>
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {format(parseISO(item.start_time), 'EEEE, MMM d @ HH:mm')}
                            </div>
                            <div className="text-[10px] text-slate-600 dark:text-slate-400">
                                {differenceInDays(parseISO(item.start_time), now)} days away
                            </div>
                        </div>
                        <Calendar className="w-4 h-4 text-blue-500" />
                    </div>
                )}
            />

            <DetailModal
                isOpen={activeModal === 'feedback'}
                onClose={() => setActiveModal(null)}
                title="Patient Feedback"
                data={feedback.slice(-20)}
                renderItem={(item, idx) => (
                    <div key={idx} className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            {[1, 2, 3, 4, 5].map(r => (
                                <Star key={r} className={`w-3 h-3 ${r <= item.rating ? 'text-amber-500 fill-current' : 'text-slate-300'}`} />
                            ))}
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-2">
                                {item.rating}/5
                            </span>
                        </div>
                        {item.comment && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2">"{item.comment}"</p>
                        )}
                    </div>
                )}
            />
        </div>
    );
};
