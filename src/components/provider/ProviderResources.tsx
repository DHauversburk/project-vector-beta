import { useState, useEffect } from 'react';
import { api, type ProviderResource } from '../../lib/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Plus, Trash2, ExternalLink, Video, FileText, Dumbbell, BookOpen, Link2, ChevronDown, X } from 'lucide-react';

const categoryConfig = {
    video: { icon: Video, label: 'Video', color: 'text-red-500 bg-red-50 dark:bg-red-900/30' },
    article: { icon: FileText, label: 'Article', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' },
    worksheet: { icon: BookOpen, label: 'Worksheet', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' },
    exercise: { icon: Dumbbell, label: 'Exercise', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' },
    other: { icon: Link2, label: 'Other', color: 'text-slate-500 bg-slate-50 dark:bg-slate-900/30' }
};

export const ProviderResources: React.FC = () => {
    const [resources, setResources] = useState<ProviderResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [addOpen, setAddOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [category, setCategory] = useState<ProviderResource['category']>('video');
    const [description, setDescription] = useState('');

    const loadResources = async () => {
        setLoading(true);
        try {
            const data = await api.getMyResources();
            setResources(data);
        } catch (error) {
            console.error('Failed to load resources:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadResources();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !url.trim()) return;

        setSaving(true);
        try {
            await api.addResource({
                title: title.trim(),
                url: url.trim(),
                category,
                description: description.trim() || undefined
            });
            setTitle('');
            setUrl('');
            setDescription('');
            setCategory('video');
            setAddOpen(false);
            loadResources();
        } catch (error) {
            console.error('Failed to add resource:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this resource?')) return;
        try {
            await api.deleteResource(id);
            loadResources();
        } catch (error) {
            console.error('Failed to delete resource:', error);
        }
    };

    // Auto-detect category from URL
    const detectCategory = (inputUrl: string) => {
        const lower = inputUrl.toLowerCase();
        if (lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('vimeo')) {
            setCategory('video');
        } else if (lower.includes('.pdf')) {
            setCategory('worksheet');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Patient Resources</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Educational content for your patients</p>
                </div>
                <Button
                    onClick={() => setAddOpen(!addOpen)}
                    className={`h-8 px-4 text-[10px] font-black uppercase tracking-widest ${addOpen ? 'bg-slate-200 dark:bg-slate-800 text-slate-600' : 'bg-indigo-600 text-white'}`}
                >
                    {addOpen ? <><X className="w-3 h-3 mr-1.5" /> Close</> : <><Plus className="w-3 h-3 mr-1.5" /> Add Resource</>}
                </Button>
            </div>

            {/* Add Resource Form */}
            {addOpen && (
                <form onSubmit={handleAdd} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-lg animate-in slide-in-from-top-2 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Resource Title</label>
                            <Input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="e.g., Breathing Exercises for Anxiety"
                                className="h-10 text-sm"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">URL / Link</label>
                            <Input
                                type="url"
                                value={url}
                                onChange={e => { setUrl(e.target.value); detectCategory(e.target.value); }}
                                placeholder="https://youtube.com/watch?v=..."
                                className="h-10 text-sm"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Category</label>
                            <div className="relative">
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value as ProviderResource['category'])}
                                    className="w-full h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 pr-8 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none appearance-none"
                                >
                                    <option value="video">📹 Video (YouTube, Vimeo)</option>
                                    <option value="article">📄 Article / Blog Post</option>
                                    <option value="worksheet">📋 Worksheet / PDF</option>
                                    <option value="exercise">🏋️ Exercise / Activity</option>
                                    <option value="other">🔗 Other Link</option>
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Description (Optional)</label>
                            <Input
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Brief note about this resource..."
                                className="h-10 text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setAddOpen(false)} className="text-[10px] font-black uppercase">
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={saving} className="bg-indigo-600 text-white text-[10px] font-black uppercase">
                            Save Resource
                        </Button>
                    </div>
                </form>
            )}

            {/* Resources List */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Loading Resources...
                    </div>
                ) : resources.length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                        <BookOpen className="w-10 h-10 text-slate-200 dark:text-slate-800 mx-auto" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Resources Added Yet</p>
                        <p className="text-[9px] font-bold text-slate-400 max-w-xs mx-auto">
                            Add YouTube videos, articles, or worksheets that your patients can access.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {resources.map(resource => {
                            const config = categoryConfig[resource.category];
                            const Icon = config.icon;

                            return (
                                <div key={resource.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <div className={`p-2.5 rounded-lg ${config.color}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">{resource.title}</h4>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-[9px] font-black text-slate-400 uppercase">{config.label}</span>
                                            {resource.description && (
                                                <span className="text-[10px] font-bold text-slate-500 truncate">{resource.description}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                                            title="Open Link"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                        <button
                                            onClick={() => handleDelete(resource.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            title="Remove Resource"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Info Note */}
            <p className="text-[9px] font-bold text-slate-400 uppercase text-center">
                Resources you add here will be visible to patients who have appointments with you.
            </p>
        </div>
    );
};
