import { useEffect, useState, useCallback } from 'react';
import { api, type EncounterNote, type EncounterNoteCategory, type EncounterNoteStatus } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import type { LucideIcon } from 'lucide-react';
import {
    FileText, Search, Filter, Clock, User,
    MessageSquare, UserCheck, Calendar, Settings,
    HelpCircle, Download, ChevronRight, Archive, ArchiveRestore,
    AlertTriangle, CheckCircle
} from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { toast } from 'sonner';

const categoryIcons: Record<string, LucideIcon> = {
    question: MessageSquare,
    counseling: UserCheck,
    reschedule: Calendar,
    follow_up: FileText,
    routine: Clock,
    urgent: AlertTriangle,
    administrative: Settings,
    other: HelpCircle,
};

const categoryColors: Record<string, string> = {
    question: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    counseling: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    reschedule: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    follow_up: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    routine: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    urgent: 'text-red-500 bg-red-500/10 border-red-500/20',
    administrative: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
    other: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
};

const statusIcons: Record<string, LucideIcon> = {
    active: Clock,
    requires_action: AlertTriangle,
    resolved: CheckCircle,
};

export function EncounterLogs() {
    const { user } = useAuth();
    const [notes, setNotes] = useState<EncounterNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<EncounterNoteCategory | 'all'>('all');
    const [showArchived, setShowArchived] = useState(false);

    const loadNotes = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await api.getProviderEncounterNotes(100, showArchived);
            setNotes(data);
        } catch (err) {
            console.error('Failed to load encounter logs', err);
            toast.error('Failed to load clinical logs');
        } finally {
            setLoading(false);
        }
    }, [user, showArchived]);

    useEffect(() => {
        loadNotes();
    }, [loadNotes]);

    const handleArchive = async (noteId: string) => {
        try {
            await api.archiveNote(noteId);
            toast.success('Note archived');
            loadNotes();
        } catch (err) {
            console.error('Failed to archive note', err);
            toast.error('Failed to archive note');
        }
    };

    const handleUnarchive = async (noteId: string) => {
        try {
            await api.unarchiveNote(noteId);
            toast.success('Note restored');
            loadNotes();
        } catch (err) {
            console.error('Failed to restore note', err);
            toast.error('Failed to restore note');
        }
    };

    const handleStatusChange = async (noteId: string, currentStatus: EncounterNoteStatus) => {
        // Cycle through: active → requires_action → resolved → active
        const statusCycle: EncounterNoteStatus[] = ['active', 'requires_action', 'resolved'];
        const currentIndex = statusCycle.indexOf(currentStatus);
        const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];

        try {
            await api.updateNoteStatus(noteId, nextStatus);
            const statusLabels = {
                active: 'Active',
                requires_action: 'Needs Action',
                resolved: 'Resolved'
            };
            toast.success(`Status updated to ${statusLabels[nextStatus]}`);
            loadNotes();
        } catch (err) {
            console.error('Failed to update status', err);
            toast.error('Failed to update status');
        }
    };

    // Bulk Archive State
    const [showBulkArchiveModal, setShowBulkArchiveModal] = useState(false);
    const [bulkArchiveDate, setBulkArchiveDate] = useState('');
    const [bulkArchiveLoading, setBulkArchiveLoading] = useState(false);

    const handleBulkArchive = async () => {
        if (!bulkArchiveDate) {
            toast.error('Please select a cutoff date');
            return;
        }

        setBulkArchiveLoading(true);
        try {
            const result = await api.bulkArchiveNotes(bulkArchiveDate, user?.id);
            if (result.archivedCount > 0) {
                toast.success(`Archived ${result.archivedCount} note${result.archivedCount > 1 ? 's' : ''}`);
                loadNotes();
            } else {
                toast.info('No notes found before the selected date');
            }
            setShowBulkArchiveModal(false);
            setBulkArchiveDate('');
        } catch (err) {
            console.error('Failed to bulk archive', err);
            toast.error('Failed to archive notes');
        } finally {
            setBulkArchiveLoading(false);
        }
    };

    const filteredNotes = notes.filter(note => {
        const matchesSearch =
            note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (note.member_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || note.category === filter;
        return matchesSearch && matchesFilter;
    });

    // Stats for header
    const activeCount = notes.filter(n => !n.archived).length;
    const archivedCount = notes.filter(n => n.archived).length;
    const actionRequiredCount = notes.filter(n => n.status === 'requires_action' && !n.archived).length;

    const exportLogs = () => {
        const data = JSON.stringify(filteredNotes, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `encounter-logs-${format(new Date(), 'yyyy-MM-dd')}.json`;
        a.click();
        toast.success('Logs exported successfully');
    };

    if (loading) {
        return (
            <div className="p-12 flex flex-col items-center justify-center space-y-4">
                <Clock className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Retrieving Clinical Records...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Active Notes</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{activeCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Needs Action</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{actionRequiredCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-500/10 flex items-center justify-center">
                            <Archive className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Archived</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{archivedCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex-1 relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                        placeholder="Search logs by patient or content..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10 h-11 bg-white dark:bg-slate-950"
                    />
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Show Archived Toggle */}
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={`flex items-center gap-2 px-3 h-11 rounded-lg border transition-all ${showArchived
                            ? 'bg-slate-800 border-slate-600 text-white'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
                            }`}
                    >
                        <Archive className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                            {showArchived ? 'Showing All' : 'Show Archived'}
                        </span>
                    </button>

                    <div className="flex items-center gap-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 h-11">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <select
                            value={filter}
                            onChange={e => setFilter(e.target.value as EncounterNoteCategory | 'all')}
                            className="bg-transparent border-none text-xs font-bold uppercase tracking-wider focus:ring-0 text-slate-700 dark:text-slate-300 outline-none"
                        >
                            <option value="all">All Categories</option>
                            <option value="question">Questions</option>
                            <option value="counseling">Counseling</option>
                            <option value="routine">Routine</option>
                            <option value="urgent">Urgent</option>
                            <option value="reschedule">Reschedules</option>
                            <option value="follow_up">Follow-ups</option>
                            <option value="administrative">Admin</option>
                        </select>
                    </div>

                    <Button onClick={exportLogs} variant="outline" size="sm" className="h-11 px-4">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>

                    <Button
                        onClick={() => setShowBulkArchiveModal(true)}
                        variant="outline"
                        size="sm"
                        className="h-11 px-4 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                    >
                        <Archive className="w-4 h-4 mr-2" />
                        Bulk Archive
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredNotes.length === 0 ? (
                    <div className="p-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white mb-1">No Clinical Records Found</h3>
                        <p className="text-xs text-slate-500 font-medium">
                            {showArchived
                                ? 'No notes match your current filters.'
                                : 'Any quick notes you save will appear here in the history.'
                            }
                        </p>
                    </div>
                ) : (
                    filteredNotes.map(note => {
                        const Icon = categoryIcons[note.category] || FileText;
                        const colors = categoryColors[note.category] || categoryColors.other;
                        const StatusIcon = statusIcons[note.status] || Clock;
                        const isArchived = note.archived;

                        return (
                            <div
                                key={note.id}
                                className={`group relative bg-white dark:bg-slate-900 rounded-xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${isArchived
                                    ? 'border-slate-300 dark:border-slate-700 opacity-60'
                                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/30'
                                    }`}
                            >
                                <div className="p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                                    <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center border ${colors}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                    {note.member_name || 'Anonymous Patient'}
                                                </h4>
                                                {isArchived && (
                                                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-slate-400/30 bg-slate-400/10">
                                                        Archived
                                                    </Badge>
                                                )}
                                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                    <Clock className="w-3 h-3" />
                                                    {format(parseISO(note.created_at), 'MMM dd, HH:mm')}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest ${colors}`}>
                                                    {note.category.replace('_', ' ')}
                                                </Badge>
                                                {!isArchived && (
                                                    <button
                                                        onClick={() => handleStatusChange(note.id, note.status)}
                                                        className={`flex items-center gap-1 px-2 py-1 rounded-md border transition-all hover:scale-105 active:scale-95 ${note.status === 'requires_action'
                                                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                                                            : note.status === 'resolved'
                                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                                                                : 'bg-blue-500/10 border-blue-500/30 text-blue-500'
                                                            }`}
                                                        title="Click to cycle status"
                                                    >
                                                        <StatusIcon className="w-3 h-3" />
                                                        <span className="text-[9px] font-bold uppercase">
                                                            {note.status === 'requires_action' ? 'Action' : note.status}
                                                        </span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <p className={`text-xs leading-relaxed font-medium ${isArchived ? 'text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                            {note.content}
                                        </p>

                                        <div className="pt-2 flex items-center gap-4">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                <User className="w-3 h-3" />
                                                ID: {note.member_id.split('-')[0]}...
                                            </div>
                                            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2">
                                                {isArchived ? (
                                                    <button
                                                        onClick={() => handleUnarchive(note.id)}
                                                        className="text-[10px] font-black uppercase text-emerald-500 hover:text-emerald-600 flex items-center gap-1 transition-colors"
                                                    >
                                                        <ArchiveRestore className="w-3 h-3" />
                                                        Restore
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleArchive(note.id)}
                                                        className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
                                                    >
                                                        <Archive className="w-3 h-3" />
                                                        Archive
                                                    </button>
                                                )}
                                                <span className="w-px h-3 bg-slate-200 dark:bg-slate-700"></span>
                                                <button className="text-[10px] font-black uppercase text-indigo-500 hover:text-indigo-600 flex items-center gap-1 transition-colors">
                                                    Details <ChevronRight className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Status stripe */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${isArchived ? 'bg-slate-400' : colors.split(' ')[0].replace('text-', 'bg-')}`}></div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Bulk Archive Modal */}
            {showBulkArchiveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                                <Archive className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bulk Archive Notes</h3>
                                <p className="text-sm text-slate-500">Archive all notes created before a date</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                Archive Notes Created Before
                            </label>
                            <input
                                type="date"
                                value={bulkArchiveDate}
                                onChange={(e) => setBulkArchiveDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                            />
                            <p className="text-xs text-slate-400 mt-2">
                                Notes created before this date will be moved to the archive.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => {
                                    setShowBulkArchiveModal(false);
                                    setBulkArchiveDate('');
                                }}
                                variant="outline"
                                className="flex-1"
                                disabled={bulkArchiveLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleBulkArchive}
                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                                disabled={bulkArchiveLoading || !bulkArchiveDate}
                            >
                                {bulkArchiveLoading ? 'Archiving...' : 'Archive Notes'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
