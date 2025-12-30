import { useState, useEffect } from 'react';
import { api, type ProviderResource } from '../../lib/api';
import { Video, FileText, Dumbbell, BookOpen, Link2, ExternalLink, Loader2 } from 'lucide-react';

const categoryConfig = {
    video: { icon: Video, label: 'Video', color: 'text-red-500 bg-red-50 dark:bg-red-900/30', bgHover: 'hover:bg-red-50 dark:hover:bg-red-900/20' },
    article: { icon: FileText, label: 'Article', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30', bgHover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20' },
    worksheet: { icon: BookOpen, label: 'Worksheet', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30', bgHover: 'hover:bg-amber-50 dark:hover:bg-amber-900/20' },
    exercise: { icon: Dumbbell, label: 'Exercise', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30', bgHover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20' },
    other: { icon: Link2, label: 'Other', color: 'text-slate-500 bg-slate-50 dark:bg-slate-900/30', bgHover: 'hover:bg-slate-50 dark:hover:bg-slate-900/20' }
};

type Props = {
    providerId?: string; // If provided, show resources from specific provider
};

export const PatientResourcesView: React.FC<Props> = ({ providerId }) => {
    const [resources, setResources] = useState<ProviderResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<ProviderResource['category'] | 'all'>('all');

    useEffect(() => {
        const loadResources = async () => {
            setLoading(true);
            try {
                if (providerId) {
                    const data = await api.getProviderResources(providerId);
                    setResources(data);
                } else {
                    // Get resources from all providers the patient has seen
                    const groups = await api.getAvailableResources();
                    const all = groups.flatMap(g => g.resources);
                    setResources(all);
                }
            } catch (error) {
                console.error('Failed to load resources:', error);
            } finally {
                setLoading(false);
            }
        };

        loadResources();
    }, [providerId]);

    const filteredResources = filter === 'all'
        ? resources
        : resources.filter(r => r.category === filter);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (resources.length === 0) {
        return (
            <div className="text-center py-12 px-4">
                <BookOpen className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">No Resources Available</h3>
                <p className="text-[10px] font-bold text-slate-400 max-w-xs mx-auto">
                    Your healthcare provider hasn't shared any resources yet. Check back later!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${filter === 'all'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    All ({resources.length})
                </button>
                {(['video', 'article', 'worksheet', 'exercise', 'other'] as const).map(cat => {
                    const count = resources.filter(r => r.category === cat).length;
                    if (count === 0) return null;
                    const config = categoryConfig[cat];
                    return (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${filter === cat
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {config.label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Resources Grid */}
            <div className="grid gap-3 md:grid-cols-2">
                {filteredResources.map(resource => {
                    const config = categoryConfig[resource.category];
                    const Icon = config.icon;

                    return (
                        <a
                            key={resource.id}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-start gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${config.bgHover} transition-all group`}
                        >
                            <div className={`p-3 rounded-lg ${config.color}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                                        {resource.title}
                                    </h4>
                                    <ExternalLink className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0 mt-0.5 group-hover:text-indigo-600 transition-colors" />
                                </div>
                                {resource.description && (
                                    <p className="text-[10px] font-bold text-slate-500 mt-1 line-clamp-2">{resource.description}</p>
                                )}
                                <span className="inline-block mt-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                    {config.label}
                                </span>
                            </div>
                        </a>
                    );
                })}
            </div>
        </div>
    );
};
