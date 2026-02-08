import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { cn } from '../../lib/utils';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useAnnouncer } from '../ui/ScreenReaderAnnouncer';

interface WelcomeModalProps {
    role: 'member' | 'provider' | 'admin';
    userName?: string;
}

/**
 * WelcomeModal - First-login welcome screen with tour option
 * 
 * Shows on first visit for each role. Offers:
 * - Start guided tour
 * - Skip and explore manually
 */
export function WelcomeModal({ role, userName }: WelcomeModalProps) {
    const { hasCompletedTour, startTour } = useOnboarding();
    const [isVisible, setIsVisible] = useState(false);
    const { announce } = useAnnouncer();
    const containerRef = useFocusTrap(isVisible, { onEscape: () => setIsVisible(false) });

    useEffect(() => {
        // Check if user has already seen/completed tour for this role
        if (!hasCompletedTour(role)) {
            // Small delay for smoother UX after page load
            const timer = setTimeout(() => setIsVisible(true), 500);
            return () => clearTimeout(timer);
        }
    }, [role, hasCompletedTour]);

    // Announce modal for screen readers
    useEffect(() => {
        if (isVisible) {
            announce('Welcome dialog opened. Press Escape to close or Tab to navigate.', 'polite');
        }
    }, [isVisible, announce]);

    const handleStartTour = () => {
        setIsVisible(false);
        // Small delay for modal to close before starting tour
        setTimeout(() => startTour(role), 300);
    };

    const handleSkip = () => {
        setIsVisible(false);
    };

    if (!isVisible) return null;

    const roleConfig = {
        member: {
            emoji: '👋',
            title: 'Welcome to Project Vector!',
            subtitle: 'Secure Anonymous Scheduling',
            description: 'This is your personal patient portal. You can book appointments, manage your schedule, and access care — all while maintaining complete privacy.',
            gradient: 'from-blue-500 via-indigo-500 to-purple-500'
        },
        provider: {
            emoji: '🩺',
            title: 'Welcome, Provider!',
            subtitle: 'Clinical Management Dashboard',
            description: 'Manage your schedule, view patient appointments, and handle waitlist requests all in one place.',
            gradient: 'from-emerald-500 via-teal-500 to-cyan-500'
        },
        admin: {
            emoji: '🎛️',
            title: 'Admin Console',
            subtitle: 'System Command Center',
            description: 'Full control over tokens, schedules, and system health. Let\'s make sure you know where everything is.',
            gradient: 'from-amber-500 via-orange-500 to-red-500'
        }
    };

    const config = roleConfig[role];

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={handleSkip}
            />

            {/* Modal with Focus Trap */}
            <div
                ref={containerRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="welcome-modal-title"
                aria-describedby="welcome-modal-description"
                className={cn(
                    'relative w-full max-w-md',
                    'bg-white dark:bg-slate-900',
                    'rounded-2xl shadow-2xl overflow-hidden',
                    'animate-in zoom-in-95 fade-in duration-300'
                )}
            >
                {/* Gradient Header */}
                <div className={cn(
                    'relative p-8 pb-12 text-center',
                    `bg-gradient-to-br ${config.gradient}`
                )}>
                    {/* Close button */}
                    <button
                        onClick={handleSkip}
                        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                        aria-label="Close welcome dialog"
                    >
                        <X className="w-5 h-5" aria-hidden="true" />
                    </button>

                    {/* Decorative elements */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
                    </div>

                    {/* Content */}
                    <div className="relative">
                        <div className="text-5xl mb-4" aria-hidden="true">{config.emoji}</div>
                        <h2 id="welcome-modal-title" className="text-2xl font-black text-white mb-1">
                            {config.title}
                        </h2>
                        <p className="text-sm font-medium text-white/80">
                            {config.subtitle}
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 -mt-6 relative">
                    {/* User greeting if available */}
                    {userName && (
                        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                                Logged in as
                            </p>
                            <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300 truncate">
                                {userName}
                            </p>
                        </div>
                    )}

                    <p id="welcome-modal-description" className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                        {config.description}
                    </p>

                    <p className="text-xs text-slate-500 dark:text-slate-500 mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Take a quick 30-second tour to get oriented</span>
                    </p>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleStartTour}
                            className={cn(
                                'w-full flex items-center justify-center gap-2',
                                'px-4 py-3 rounded-xl',
                                'bg-gradient-to-r from-indigo-600 to-purple-600',
                                'hover:from-indigo-700 hover:to-purple-700',
                                'text-white font-bold text-sm uppercase tracking-wide',
                                'shadow-lg shadow-indigo-500/30',
                                'transition-all duration-200',
                                'hover:scale-[1.02] active:scale-[0.98]'
                            )}
                        >
                            Start Tour
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleSkip}
                            className={cn(
                                'w-full px-4 py-2.5 rounded-xl',
                                'text-slate-500 dark:text-slate-400 font-medium text-sm',
                                'hover:bg-slate-100 dark:hover:bg-slate-800',
                                'transition-colors'
                            )}
                        >
                            Skip, I'll explore
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
