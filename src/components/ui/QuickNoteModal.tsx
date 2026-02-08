/**
 * QuickNoteModal - Provider encounter documentation
 * 
 * @component
 * @description Allows providers to quickly document brief patient interactions
 * without creating a full appointment. Categories include questions answered,
 * counseling provided, reschedule requests, and follow-up notes.
 * 
 * @features
 * - Device-adaptive layout (bottom-sheet on mobile, centered on desktop)
 * - Voice dictation via Web Speech API
 * - Timestamp-based Quick ID generation
 * - Follow-up appointment creation from notes
 * - Rapid-fire mode for back-to-back documentation
 */

import { useState, useEffect, useRef } from 'react';
import { X, FileText, MessageSquare, Calendar, CalendarPlus, UserCheck, Settings, HelpCircle, Loader2, Mic, CheckCircle, Zap, History, Hash, MicOff, AlertTriangle, Clock } from 'lucide-react';
import { Button } from './Button';
import { api, type EncounterNote, type EncounterNoteCategory, type EncounterNoteStatus } from '../../lib/api';
import { toast } from 'sonner';
import { useDevice } from '../../contexts/DeviceContext';
import { useAuth } from '../../contexts/AuthContext';
import { useOffline } from '../../contexts/OfflineContext';

interface QuickNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (note: EncounterNote) => void;
    preselectedMember?: {
        id: string;
        name: string;
    };
}

const noteCategories: { value: EncounterNoteCategory; label: string; icon: typeof FileText; color: string }[] = [
    { value: 'question', label: 'Question', icon: MessageSquare, color: 'blue' },
    { value: 'counseling', label: 'Counseling', icon: UserCheck, color: 'purple' },
    { value: 'routine', label: 'Routine', icon: Clock, color: 'cyan' },
    { value: 'follow_up', label: 'Follow-up', icon: FileText, color: 'emerald' },
    { value: 'urgent', label: 'Urgent', icon: AlertTriangle, color: 'red' },
    { value: 'reschedule', label: 'Reschedule', icon: Calendar, color: 'amber' },
    { value: 'administrative', label: 'Admin', icon: Settings, color: 'slate' },
    { value: 'other', label: 'Other', icon: HelpCircle, color: 'gray' },
];

// TODO: Sprint 8 - Add status selector UI using statusOptions
// const statusOptions: { value: EncounterNoteStatus; label: string; color: string }[] = [
//     { value: 'active', label: 'Active', color: 'blue' },
//     { value: 'requires_action', label: 'Needs Action', color: 'amber' },
//     { value: 'resolved', label: 'Resolved', color: 'emerald' },
// ];


export function QuickNoteModal({ isOpen, onClose, onSuccess, preselectedMember }: QuickNoteModalProps) {
    const { user } = useAuth();
    const { executeMutation } = useOffline();
    const { isMobile } = useDevice();
    const [category, setCategory] = useState<EncounterNoteCategory>('question');
    const [status] = useState<EncounterNoteStatus>('active');
    const [content, setContent] = useState('');
    const [memberName, setMemberName] = useState(preselectedMember?.name || '');
    const [memberId, setMemberId] = useState(preselectedMember?.id || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [keepOpen, setKeepOpen] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [recentMembers, setRecentMembers] = useState<{ id: string, name: string }[]>([]);
    const [isListening, setIsListening] = useState(false);

    // Swipe-to-dismiss state for mobile
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartY = useRef(0);
    const modalRef = useRef<HTMLDivElement>(null);
    // Web Speech API doesn't have built-in TypeScript types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);

    // Follow-up scheduling state
    const [scheduleFollowUp, setScheduleFollowUp] = useState(false);
    const [followUpDate, setFollowUpDate] = useState('');
    const [followUpTime, setFollowUpTime] = useState('09:00');

    // Initialise Speech Recognition
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognitionRef.current.onresult = (event: any) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        transcript += event.results[i][0].transcript;
                    }
                }
                if (transcript) {
                    setContent(prev => {
                        const newContent = prev + (prev.endsWith(' ') || !prev ? '' : ' ') + transcript;
                        return newContent;
                    });
                }
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
                toast.error(`Speech Error: ${event.error}`);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    // Load recent patients for quick select
    useEffect(() => {
        const loadRecent = async () => {
            try {
                const notes = await api.getProviderEncounterNotes(10);
                const unique = Array.from(new Set(notes.map(n => n.member_id)))
                    .map(id => ({
                        id,
                        name: notes.find(n => n.member_id === id)?.member_name || 'Patient'
                    }))
                    .slice(0, 4);
                setRecentMembers(unique);
            } catch (e) {
                console.error("Failed to load recents", e);
            }
        };
        if (isOpen) loadRecent();
    }, [isOpen]);

    // Reset form when closed - must be before conditional return
    useEffect(() => {
        if (!isOpen) {
            setDragY(0);
            setIsDragging(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const toggleVoice = () => {
        if (!recognitionRef.current) {
            toast.error("Speech recognition not supported in this browser");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
            toast.success("Voice documentation stopped");
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
                toast.info("Voice documentation active", {
                    description: "Speak clearly into your microphone."
                });
            } catch (e) {
                console.error("Speech start error", e);
                // Handle case where it's already started
                setIsListening(true);
            }
        }
    };

    // Handle touch events for mobile swipe-to-dismiss
    const handleTouchStart = (e: React.TouchEvent) => {
        if (!isMobile) return;
        dragStartY.current = e.touches[0].clientY;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || !isMobile) return;
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - dragStartY.current;
        // Only allow dragging down
        if (deltaY > 0) {
            setDragY(deltaY);
        }
    };

    const handleTouchEnd = () => {
        if (!isMobile) return;
        setIsDragging(false);
        // If dragged more than 100px, close the modal
        if (dragY > 100) {
            onClose();
        }
        setDragY(0);
    };

    const generateQuickId = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const id = `PT-${year}-${month}-${day}-${hours}${minutes}hrs`;
        setMemberName(id);
        setMemberId(`temp-${Date.now()}`);
        toast.success("Generated Timestamp ID");
    };

    const handleSubmit = async () => {
        if (!content.trim()) {
            setError('Please enter note content');
            return;
        }
        if (!memberName.trim()) {
            setError('Please enter patient identifier');
            return;
        }
        if (scheduleFollowUp && !followUpDate) {
            setError('Please select a follow-up date');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 1. Generate Client-Side ID for Offline Consistency
            const noteId = `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // 2. Queue Note Creation
            const noteData = {
                id: noteId,
                member_id: memberId || `manual-${Date.now()}`,
                member_name: memberName,
                provider_id: user?.id || 'unknown',
                category: scheduleFollowUp ? 'follow_up' : category,
                content: content.trim(),
                resolved: false,
                status,
                archived: false,
                created_at: new Date().toISOString() // Ensure created_at is present for offline display
            };

            await executeMutation('CREATE_NOTE', noteData);

            // 3. Queue Follow-up Link (if needed)
            if (scheduleFollowUp && followUpDate) {
                const followUpId = `followup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                await executeMutation('LINK_NOTE_FOLLOWUP', {
                    noteId: noteId,
                    appointmentId: followUpId
                });

                toast.success(`Note queued with follow-up for ${followUpDate}`);
            } else {
                onSuccess?.(noteData as EncounterNote);
            }

            if (keepOpen) {
                setShowSuccess(true);
                setContent('');
                setScheduleFollowUp(false);
                setFollowUpDate('');
                setTimeout(() => setShowSuccess(false), 2000);
                if (!scheduleFollowUp) {
                    toast.success('Note saved successfully');
                }
            } else {
                // Reset form
                setContent('');
                setCategory('question');
                setScheduleFollowUp(false);
                setFollowUpDate('');
                if (!preselectedMember) {
                    setMemberName('');
                    setMemberId('');
                }
                onClose();
            }
        } catch (err) {
            setError('Failed to save note');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getColorClasses = (color: string, isSelected: boolean) => {
        const colors: Record<string, { bg: string; border: string; text: string }> = {
            blue: {
                bg: isSelected ? 'bg-blue-900/50' : 'bg-slate-800/50',
                border: isSelected ? 'border-blue-500' : 'border-slate-700',
                text: isSelected ? 'text-blue-400' : 'text-slate-400'
            },
            purple: {
                bg: isSelected ? 'bg-purple-900/50' : 'bg-slate-800/50',
                border: isSelected ? 'border-purple-500' : 'border-slate-700',
                text: isSelected ? 'text-purple-400' : 'text-slate-400'
            },
            amber: {
                bg: isSelected ? 'bg-amber-900/50' : 'bg-slate-800/50',
                border: isSelected ? 'border-amber-500' : 'border-slate-700',
                text: isSelected ? 'text-amber-400' : 'text-slate-400'
            },
            emerald: {
                bg: isSelected ? 'bg-emerald-900/50' : 'bg-slate-800/50',
                border: isSelected ? 'border-emerald-500' : 'border-slate-700',
                text: isSelected ? 'text-emerald-400' : 'text-slate-400'
            },
            slate: {
                bg: isSelected ? 'bg-slate-700/50' : 'bg-slate-800/50',
                border: isSelected ? 'border-slate-500' : 'border-slate-700',
                text: isSelected ? 'text-slate-300' : 'text-slate-400'
            },
            gray: {
                bg: isSelected ? 'bg-gray-700/50' : 'bg-slate-800/50',
                border: isSelected ? 'border-gray-500' : 'border-slate-700',
                text: isSelected ? 'text-gray-300' : 'text-slate-400'
            },
        };
        return colors[color] || colors.blue;
    };

    return (
        <div
            className={`fixed inset-0 z-50 ${isMobile
                ? 'flex items-end'
                : 'flex items-center justify-center p-4'
                }`}
            onClick={onClose}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm transition-opacity"
                style={{ opacity: isMobile ? Math.max(0, 1 - dragY / 300) : 1 }}
            />

            {/* Modal */}
            <div
                ref={modalRef}
                className={`relative w-full bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden ${isMobile
                    ? 'max-h-[90vh] rounded-t-3xl animate-slide-in-from-bottom'
                    : 'max-w-lg rounded-2xl animate-scale-in'
                    }`}
                style={isMobile ? {
                    transform: `translateY(${dragY}px)`,
                    transition: isDragging ? 'none' : 'transform 0.3s ease-out'
                } : {}}
                onClick={e => e.stopPropagation()}
            >
                {/* Mobile Drag Handle */}
                {isMobile && (
                    <div
                        className="py-3 flex justify-center cursor-grab active:cursor-grabbing touch-none"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
                    </div>
                )}

                {/* Header */}
                <div className={`relative ${isMobile ? 'px-6 pb-4' : 'p-6 pb-4'} border-b border-slate-800`}>
                    <button
                        onClick={onClose}
                        className={`absolute ${isMobile ? 'top-0' : 'top-4'} right-4 p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-slate-800`}
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Quick Encounter Note</h2>
                            <p className="text-xs text-slate-400">Document a brief patient interaction</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Patient Selection */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                Patient Identifier
                            </label>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={generateQuickId}
                                    className="flex items-center gap-1.5 text-[10px] text-blue-400 font-black uppercase hover:text-blue-300 transition-colors"
                                >
                                    <Hash className="w-3 h-3" /> Quick ID
                                </button>
                                {recentMembers.length > 0 && (
                                    <span className="flex items-center gap-1 text-[10px] text-indigo-400 font-bold uppercase">
                                        <History className="w-3 h-3" /> Recent
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Quick Select Bar */}
                        {recentMembers.length > 0 && !preselectedMember && (
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {recentMembers.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => {
                                            setMemberId(m.id);
                                            setMemberName(m.name);
                                        }}
                                        className={`shrink-0 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase transition-all ${memberId === m.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                    >
                                        {m.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        <input
                            type="text"
                            value={memberName}
                            onChange={e => {
                                setMemberName(e.target.value);
                                setMemberId(''); // Clear manual ID if name is edited
                            }}
                            placeholder="Name or Token (e.g., M-8821-X4)"
                            disabled={!!preselectedMember}
                            className="w-full h-11 px-4 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 font-mono tracking-tight"
                        />
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                            Interaction Type
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {noteCategories.map(cat => {
                                const isSelected = category === cat.value;
                                const colors = getColorClasses(cat.color, isSelected);
                                const Icon = cat.icon;

                                return (
                                    <button
                                        key={cat.value}
                                        onClick={() => setCategory(cat.value)}
                                        className={`p-3 rounded-lg border transition-all ${colors.bg} ${colors.border} ${isSelected ? 'scale-105' : 'hover:scale-102'}`}
                                    >
                                        <Icon className={`w-5 h-5 mx-auto mb-1 ${colors.text}`} />
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>
                                            {cat.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Note Content */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                Note Content
                            </label>
                            <button
                                onClick={toggleVoice}
                                className={`p-1.5 rounded-lg border transition-all flex items-center gap-2 ${isListening ? 'bg-red-900 border-red-500 text-white animate-pulse' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
                            >
                                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                <span className="text-[10px] font-black uppercase">{isListening ? 'Stop' : 'Dictate'}</span>
                            </button>
                        </div>
                        <div className="relative">
                            <textarea
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder="Describe the interaction..."
                                rows={4}
                                className="w-full p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none font-medium text-sm leading-relaxed"
                            />
                            {showSuccess && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm rounded-lg animate-in fade-in zoom-in duration-300">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                            <CheckCircle className="w-8 h-8 text-white" />
                                        </div>
                                        <span className="text-xs font-black text-white uppercase tracking-widest">Note Logged</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Field Toggles */}
                    <div className="pt-2 space-y-3">
                        <button
                            onClick={() => setKeepOpen(!keepOpen)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${keepOpen ? 'bg-indigo-900/40 border-indigo-500 text-indigo-300' : 'bg-slate-800/40 border-slate-700 text-slate-500'}`}
                        >
                            <div className="flex items-center gap-3">
                                <Zap className={`w-4 h-4 ${keepOpen ? 'text-indigo-400' : ''}`} />
                                <div className="text-left">
                                    <div className="text-[10px] font-black uppercase tracking-widest">Rapid-Fire Mode</div>
                                    <div className="text-[9px] font-bold opacity-60">Keep modal open for back-to-back notes</div>
                                </div>
                            </div>
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${keepOpen ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${keepOpen ? 'left-4.5' : 'left-0.5'}`} />
                            </div>
                        </button>

                        {/* Schedule Follow-Up Toggle */}
                        <button
                            onClick={() => setScheduleFollowUp(!scheduleFollowUp)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${scheduleFollowUp ? 'bg-emerald-900/40 border-emerald-500 text-emerald-300' : 'bg-slate-800/40 border-slate-700 text-slate-500'}`}
                        >
                            <div className="flex items-center gap-3">
                                <CalendarPlus className={`w-4 h-4 ${scheduleFollowUp ? 'text-emerald-400' : ''}`} />
                                <div className="text-left">
                                    <div className="text-[10px] font-black uppercase tracking-widest">Schedule Follow-Up</div>
                                    <div className="text-[9px] font-bold opacity-60">Create an appointment from this note</div>
                                </div>
                            </div>
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${scheduleFollowUp ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${scheduleFollowUp ? 'left-4.5' : 'left-0.5'}`} />
                            </div>
                        </button>

                        {/* Follow-Up Date/Time Picker (shown when toggle is on) */}
                        {scheduleFollowUp && (
                            <div className="p-4 bg-emerald-950/30 border border-emerald-700/50 rounded-lg space-y-3 animate-slide-up">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                    Follow-Up Appointment Details
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[9px] font-bold uppercase text-slate-400 mb-1 block">Date</label>
                                        <input
                                            type="date"
                                            value={followUpDate}
                                            onChange={e => setFollowUpDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold uppercase text-slate-400 mb-1 block">Time</label>
                                        <select
                                            value={followUpTime}
                                            onChange={e => setFollowUpTime(e.target.value)}
                                            className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        >
                                            {['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'].map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-950/50 border border-red-500/50 text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 pt-0 flex gap-3">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="flex-1"
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="gradient"
                        className="flex-1"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Note'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
