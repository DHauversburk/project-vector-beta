import { useState } from 'react';
import { MessageSquarePlus, X, Send, CheckCircle, Bug, Lightbulb, Zap, ThumbsUp } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';
import { addFeedbackEntry, type FeedbackEntry } from '../../lib/feedback-store';

const RATING_EMOJIS = [
    { value: 1, emoji: '😟', label: 'Very Poor' },
    { value: 2, emoji: '😕', label: 'Poor' },
    { value: 3, emoji: '😐', label: 'Okay' },
    { value: 4, emoji: '🙂', label: 'Good' },
    { value: 5, emoji: '🤩', label: 'Excellent' },
];

const CATEGORIES = [
    { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-500' },
    { value: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-amber-500' },
    { value: 'perf', label: 'Performance', icon: Zap, color: 'text-yellow-500' },
    { value: 'ui', label: 'UI Polish', icon: ThumbsUp, color: 'text-emerald-500' },
    { value: 'general', label: 'General', icon: MessageSquarePlus, color: 'text-blue-500' },
] as const;

/**
 * Floating Feedback Widget for Beta Testing
 * 
 * Features:
 * - Floating action button (FAB) in bottom-right corner
 * - Emoji-based rating system
 * - Category selection with icons
 * - Optional message textarea
 * - Stores feedback in localStorage
 * - Success animation on submit
 */
export function FeedbackWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState<number | null>(null);
    const [category, setCategory] = useState<FeedbackEntry['category'] | null>(null);
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async () => {
        if (!rating || !category) return;

        setIsSubmitting(true);

        // Create feedback entry
        const entry: FeedbackEntry = {
            id: `fb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            rating,
            category,
            message: message.trim(),
            page: window.location.pathname,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
        };

        // Store using utility
        addFeedbackEntry(entry);

        // Simulate brief delay for UX
        await new Promise(resolve => setTimeout(resolve, 500));

        setIsSubmitting(false);
        setIsSuccess(true);

        // Reset after showing success
        setTimeout(() => {
            setIsOpen(false);
            setIsSuccess(false);
            setRating(null);
            setCategory(null);
            setMessage('');
        }, 1500);
    };

    const canSubmit = rating !== null && category !== null;

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={cn(
                    'fixed bottom-6 right-6 z-50',
                    'w-14 h-14 rounded-full',
                    'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500',
                    'text-white shadow-lg',
                    'flex items-center justify-center',
                    'transition-all duration-300 ease-out',
                    'hover:scale-110 hover:shadow-xl hover:shadow-purple-500/30',
                    'active:scale-95',
                    'btn-ripple',
                    isOpen && 'scale-0 opacity-0'
                )}
                title="Send Feedback"
                data-tour="feedback-button"
            >
                <MessageSquarePlus className="w-6 h-6" />
            </button>

            {/* Feedback Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                        onClick={() => !isSubmitting && setIsOpen(false)}
                    />

                    {/* Modal */}
                    <div className={cn(
                        'relative w-full max-w-md',
                        'bg-white dark:bg-slate-900',
                        'rounded-2xl shadow-2xl',
                        'border border-slate-200 dark:border-slate-800',
                        'animate-slide-up',
                        'overflow-hidden'
                    )}>
                        {/* Header with Gradient */}
                        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                        <MessageSquarePlus className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-white tracking-tight">
                                            Send Feedback
                                        </h2>
                                        <p className="text-xs text-white/80 font-medium">
                                            Help us improve Project Vector
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                    disabled={isSubmitting}
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        {isSuccess ? (
                            <div className="p-8 flex flex-col items-center justify-center gap-4 animate-scale-in">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                    <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                        Thank You!
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Your feedback helps us improve.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 space-y-5">
                                {/* Rating */}
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                        How was your experience?
                                    </label>
                                    <div className="flex justify-between gap-2">
                                        {RATING_EMOJIS.map(({ value, emoji, label }) => (
                                            <button
                                                key={value}
                                                onClick={() => setRating(value)}
                                                className={cn(
                                                    'flex-1 py-3 rounded-xl text-2xl transition-all duration-200',
                                                    'hover:scale-110 active:scale-95',
                                                    rating === value
                                                        ? 'bg-indigo-100 dark:bg-indigo-900/50 ring-2 ring-indigo-500 scale-110'
                                                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                )}
                                                title={label}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                        Category
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {CATEGORIES.map(({ value, label, icon: Icon, color }) => (
                                            <button
                                                key={value}
                                                onClick={() => setCategory(value)}
                                                className={cn(
                                                    'flex items-center gap-2 p-3 rounded-xl text-left transition-all duration-200',
                                                    'border',
                                                    category === value
                                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600'
                                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                )}
                                            >
                                                <Icon className={cn('w-4 h-4', color)} />
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    {label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                        Tell us more (optional)
                                    </label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="What's on your mind?"
                                        rows={3}
                                        className={cn(
                                            'w-full px-3 py-2 rounded-xl',
                                            'bg-slate-50 dark:bg-slate-800',
                                            'border border-slate-200 dark:border-slate-700',
                                            'text-sm text-slate-900 dark:text-white',
                                            'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                                            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                                            'resize-none transition-all duration-200'
                                        )}
                                    />
                                </div>

                                {/* Submit */}
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!canSubmit || isSubmitting}
                                    isLoading={isSubmitting}
                                    className={cn(
                                        'w-full h-12 text-sm font-black uppercase tracking-wider',
                                        'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500',
                                        'hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600',
                                        'disabled:opacity-50 disabled:cursor-not-allowed',
                                        'btn-ripple'
                                    )}
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Submit Feedback
                                </Button>

                                {/* Privacy Note */}
                                <p className="text-[10px] text-center text-slate-400 dark:text-slate-500">
                                    Feedback is stored locally and helps improve the Beta experience.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
