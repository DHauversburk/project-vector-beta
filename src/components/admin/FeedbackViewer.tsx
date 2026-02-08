import { useState } from 'react';
import {
    MessageSquare, Trash2, Download, RefreshCw,
    Bug, Lightbulb, ThumbsUp,
    ChevronDown, ChevronUp, Clock, Globe
} from 'lucide-react';
import { Button } from '../ui/Button';
import { getFeedbackEntries, clearFeedbackEntries, type FeedbackEntry } from '../../lib/feedback-store';
import { cn } from '../../lib/utils';
import { Zap } from 'lucide-react';

const RATING_EMOJIS = ['', '😟', '😕', '😐', '🙂', '🤩'];

const CATEGORY_CONFIG = {
    bug: { label: 'Bug Report', icon: Bug, color: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
    feature: { label: 'Feature Request', icon: Lightbulb, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
    perf: { label: 'Performance', icon: Zap, color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' },
    ui: { label: 'UI Polish', icon: ThumbsUp, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
    general: { label: 'General', icon: MessageSquare, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
};

/**
 * Admin Feedback Viewer
 * 
 * Displays all collected feedback from the FeedbackWidget.
 * Features:
 * - View all feedback entries
 * - Filter by category
 * - Export to CSV
 * - Clear all feedback
 */
export function FeedbackViewer() {
    const [entries, setEntries] = useState<FeedbackEntry[]>(() => getFeedbackEntries());
    const [filter, setFilter] = useState<string>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const refreshEntries = () => {
        setEntries(getFeedbackEntries());
    };

    const handleClearAll = () => {
        if (window.confirm('Are you sure you want to delete all feedback entries? This cannot be undone.')) {
            clearFeedbackEntries();
            setEntries([]);
        }
    };

    const handleExportCSV = () => {
        const headers = ['ID', 'Timestamp', 'Rating', 'Category', 'Message', 'Page', 'User Agent'];
        const rows = entries.map(e => [
            e.id,
            e.timestamp,
            e.rating.toString(),
            e.category,
            e.message.replace(/"/g, '""'),
            e.page,
            e.userAgent.replace(/"/g, '""')
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `feedback_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredEntries = filter === 'all'
        ? entries
        : entries.filter(e => e.category === filter);

    const categoryStats = {
        bug: entries.filter(e => e.category === 'bug').length,
        feature: entries.filter(e => e.category === 'feature').length,
        perf: entries.filter(e => e.category === 'perf').length,
        ui: entries.filter(e => e.category === 'ui').length,
        general: entries.filter(e => e.category === 'general').length,
    };

    const avgRating = entries.length > 0
        ? (entries.reduce((sum, e) => sum + e.rating, 0) / entries.length).toFixed(1)
        : '0.0';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-indigo-500" />
                        Beta Feedback
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {entries.length} {entries.length === 1 ? 'entry' : 'entries'} collected
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={refreshEntries}
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs font-bold uppercase"
                    >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Refresh
                    </Button>
                    <Button
                        onClick={handleExportCSV}
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs font-bold uppercase"
                        disabled={entries.length === 0}
                    >
                        <Download className="w-4 h-4 mr-1" />
                        Export
                    </Button>
                    <Button
                        onClick={handleClearAll}
                        variant="destructive"
                        size="sm"
                        className="h-9 text-xs font-bold uppercase"
                        disabled={entries.length === 0}
                    >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Clear
                    </Button>
                </div>
            </div>

            {/* Stats Strip */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="ent-card p-4 text-center">
                    <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{avgRating}</div>
                    <div className="text-[10px] font-bold uppercase text-slate-500">Avg Rating</div>
                </div>
                {Object.entries(categoryStats).map(([category, count]) => {
                    const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
                    const Icon = config.icon;
                    return (
                        <div key={category} className="ent-card p-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                                <Icon className={cn('w-4 h-4', config.color.split(' ')[0])} />
                                <span className="text-2xl font-black text-slate-900 dark:text-white">{count}</span>
                            </div>
                            <div className="text-[10px] font-bold uppercase text-slate-500">{config.label}s</div>
                        </div>
                    );
                })}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                {['all', 'bug', 'feature', 'perf', 'ui', 'general'].map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={cn(
                            'px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all',
                            filter === cat
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        )}
                    >
                        {cat === 'all' ? 'All' : CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG].label}
                        {cat !== 'all' && ` (${categoryStats[cat as keyof typeof categoryStats]})`}
                    </button>
                ))}
            </div>

            {/* Entries List */}
            {filteredEntries.length === 0 ? (
                <div className="ent-card p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-black text-slate-400 dark:text-slate-500">No Feedback Yet</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-600">
                        Feedback submitted by testers will appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredEntries.map((entry) => {
                        const config = CATEGORY_CONFIG[entry.category];
                        const Icon = config.icon;
                        const isExpanded = expandedId === entry.id;

                        return (
                            <div
                                key={entry.id}
                                className={cn(
                                    'ent-card overflow-hidden transition-all duration-200',
                                    'card-hover-lift cursor-pointer'
                                )}
                                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                            >
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            {/* Rating Emoji */}
                                            <div className="text-2xl">{RATING_EMOJIS[entry.rating]}</div>

                                            {/* Category Badge */}
                                            <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold', config.color)}>
                                                <Icon className="w-3 h-3" />
                                                {config.label}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Clock className="w-3 h-3" />
                                            <span className="text-[10px] font-medium">
                                                {new Date(entry.timestamp).toLocaleString()}
                                            </span>
                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </div>
                                    </div>

                                    {entry.message && (
                                        <p className={cn(
                                            'mt-2 text-sm text-slate-700 dark:text-slate-300',
                                            !isExpanded && 'line-clamp-2'
                                        )}>
                                            {entry.message}
                                        </p>
                                    )}
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2 animate-slide-down">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Globe className="w-3 h-3" />
                                            <span className="font-mono">{entry.page}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono line-clamp-1">
                                            {entry.userAgent}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono">
                                            ID: {entry.id}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
