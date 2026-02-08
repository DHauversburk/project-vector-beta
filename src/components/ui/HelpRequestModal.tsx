/**
 * HelpRequestModal - Patient assistance request
 * 
 * @component
 * @description Allows patients to request help from providers without
 * physically hunting them down. Categories include questions, reschedule
 * requests, urgent issues, and technical problems.
 */

import { useState, useEffect } from 'react';
import { X, HelpCircle, MessageSquare, Calendar, AlertTriangle, Wrench, Send, Loader2, CheckCircle } from 'lucide-react';
import { Button } from './Button';
import { useOffline } from '../../contexts/OfflineContext';
// Force Refresh
import { type HelpRequest } from '../../lib/api';

interface HelpRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (request: HelpRequest) => void;
    patientName?: string;
}

const requestCategories: { value: HelpRequest['category']; label: string; description: string; icon: typeof HelpCircle; color: string }[] = [
    {
        value: 'question',
        label: 'Question',
        description: 'I have a question about my appointment or care',
        icon: MessageSquare,
        color: 'blue'
    },
    {
        value: 'reschedule',
        label: 'Reschedule',
        description: 'I need to change my appointment time',
        icon: Calendar,
        color: 'amber'
    },
    {
        value: 'urgent',
        label: 'Urgent',
        description: 'I need immediate assistance',
        icon: AlertTriangle,
        color: 'red'
    },
    {
        value: 'technical',
        label: 'Technical Issue',
        description: 'I\'m having trouble with the app or check-in',
        icon: Wrench,
        color: 'purple'
    },
    {
        value: 'other',
        label: 'Other',
        description: 'Something else I need help with',
        icon: HelpCircle,
        color: 'slate'
    },
];

export function HelpRequestModal({ isOpen, onClose, onSuccess, patientName }: HelpRequestModalProps) {
    const { executeMutation } = useOffline();
    const [category, setCategory] = useState<HelpRequest['category']>('question');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Reset success state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSuccess(false);
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!message.trim()) {
            setError('Please describe what you need help with');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Generate ID client-side for offline consistency
            const requestId = `help-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const requestData = {
                id: requestId,
                member_name: patientName,
                category,
                subject: subject.trim() || requestCategories.find(c => c.value === category)?.label || 'Help Request',
                message: message.trim(),
                status: 'pending' as const,
                created_at: new Date().toISOString()
            };

            await executeMutation('CREATE_HELP_REQUEST', requestData);

            setSuccess(true);
            onSuccess?.(requestData as HelpRequest);

            // Auto-close after success
            setTimeout(() => {
                setSuccess(false);
                setCategory('question');
                setSubject('');
                setMessage('');
                onClose();
            }, 2000);
        } catch (err) {
            setError('Failed to submit request. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getColorClasses = (color: string, isSelected: boolean) => {
        const colors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
            blue: {
                bg: isSelected ? 'bg-blue-900/50' : 'bg-slate-800/30',
                border: isSelected ? 'border-blue-500' : 'border-slate-700/50',
                text: isSelected ? 'text-blue-400' : 'text-slate-400',
                icon: isSelected ? 'text-blue-400' : 'text-slate-500'
            },
            amber: {
                bg: isSelected ? 'bg-amber-900/50' : 'bg-slate-800/30',
                border: isSelected ? 'border-amber-500' : 'border-slate-700/50',
                text: isSelected ? 'text-amber-400' : 'text-slate-400',
                icon: isSelected ? 'text-amber-400' : 'text-slate-500'
            },
            red: {
                bg: isSelected ? 'bg-red-900/50' : 'bg-slate-800/30',
                border: isSelected ? 'border-red-500' : 'border-slate-700/50',
                text: isSelected ? 'text-red-400' : 'text-slate-400',
                icon: isSelected ? 'text-red-400' : 'text-slate-500'
            },
            purple: {
                bg: isSelected ? 'bg-purple-900/50' : 'bg-slate-800/30',
                border: isSelected ? 'border-purple-500' : 'border-slate-700/50',
                text: isSelected ? 'text-purple-400' : 'text-slate-400',
                icon: isSelected ? 'text-purple-400' : 'text-slate-500'
            },
            slate: {
                bg: isSelected ? 'bg-slate-700/50' : 'bg-slate-800/30',
                border: isSelected ? 'border-slate-500' : 'border-slate-700/50',
                text: isSelected ? 'text-slate-300' : 'text-slate-400',
                icon: isSelected ? 'text-slate-300' : 'text-slate-500'
            },
        };
        return colors[color] || colors.blue;
    };

    // Success View
    if (success) {
        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" />
                <div
                    className="relative w-full max-w-sm bg-slate-900 border border-emerald-500/50 rounded-2xl shadow-2xl p-8 text-center animate-scale-in"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-900/50 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Request Submitted!</h3>
                    <p className="text-slate-400 text-sm">
                        A provider will respond to your request shortly.
                    </p>
                    {category === 'urgent' && (
                        <p className="mt-3 text-xs text-amber-400 font-medium">
                            For immediate emergencies, please contact the front desk directly.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl animate-scale-in overflow-hidden max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-slate-900 p-6 pb-4 border-b border-slate-800">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                            <HelpCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Request Help</h2>
                            <p className="text-xs text-slate-400">A provider will respond to your request</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Category Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                            What do you need help with?
                        </label>
                        <div className="space-y-2">
                            {requestCategories.map(cat => {
                                const isSelected = category === cat.value;
                                const colors = getColorClasses(cat.color, isSelected);
                                const Icon = cat.icon;

                                return (
                                    <button
                                        key={cat.value}
                                        onClick={() => setCategory(cat.value)}
                                        className={`w-full p-4 rounded-xl border transition-all flex items-center gap-4 text-left ${colors.bg} ${colors.border} ${isSelected ? 'scale-[1.02]' : 'hover:bg-slate-800/50'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg bg-slate-800/80 flex items-center justify-center flex-shrink-0`}>
                                            <Icon className={`w-5 h-5 ${colors.icon}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className={`text-sm font-bold block ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                                {cat.label}
                                            </span>
                                            <span className="text-xs text-slate-500 block truncate">
                                                {cat.description}
                                            </span>
                                        </div>
                                        {isSelected && (
                                            <div className="w-2 h-2 rounded-full bg-current flex-shrink-0" style={{ color: colors.icon.replace('text-', '') }} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Subject (optional) */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                            Subject <span className="text-slate-600">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            placeholder="Brief summary..."
                            className="w-full h-11 px-4 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    {/* Message Content */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                            Message <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="Please describe what you need help with..."
                            rows={4}
                            className="w-full p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                        />
                    </div>

                    {/* Urgent Warning */}
                    {category === 'urgent' && (
                        <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm text-red-300 font-medium">Urgent Request</p>
                                    <p className="text-xs text-red-400/80 mt-1">
                                        For life-threatening emergencies, please call 911 or go to the nearest emergency room.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-950/50 border border-red-500/50 text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-slate-900 p-6 pt-4 border-t border-slate-800">
                    <Button
                        onClick={handleSubmit}
                        variant="gradient"
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-2" />
                                Submit Request
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
