import { X, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useAnnouncer } from './ScreenReaderAnnouncer';
import { useEffect } from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'destructive' | 'warning' | 'primary';
    loading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'primary',
    loading = false
}: ConfirmModalProps) {
    const containerRef = useFocusTrap(isOpen, { onEscape: onClose });
    const { announce } = useAnnouncer();

    // Announce modal opening for screen readers
    useEffect(() => {
        if (isOpen) {
            announce(`Dialog opened: ${title}. ${description}`, 'assertive');
        }
    }, [isOpen, title, description, announce]);

    if (!isOpen) return null;

    const variants = {
        primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
        destructive: 'bg-red-600 hover:bg-red-700 text-white',
        warning: 'bg-amber-500 hover:bg-amber-600 text-white'
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal with Focus Trap */}
            <div
                ref={containerRef}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-title"
                aria-describedby="confirm-modal-description"
                className={cn(
                    "relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden",
                    "animate-in zoom-in-95 fade-in duration-300"
                )}
            >
                {/* Header Decoration */}
                <div className={cn(
                    "h-1.5 w-full",
                    variant === 'destructive' ? 'bg-red-500' : variant === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'
                )} />

                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                            variant === 'destructive' ? 'bg-red-50 dark:bg-red-900/20 text-red-600' :
                                variant === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500' :
                                    'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'
                        )}>
                            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                            <h3
                                id="confirm-modal-title"
                                className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight"
                            >
                                {title}
                            </h3>
                            <p
                                id="confirm-modal-description"
                                className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium"
                            >
                                {description}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded"
                            aria-label="Close dialog"
                        >
                            <X className="w-5 h-5" aria-hidden="true" />
                        </button>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 h-11 text-xs font-black uppercase tracking-widest"
                        >
                            {cancelLabel}
                        </Button>
                        <Button
                            onClick={onConfirm}
                            isLoading={loading}
                            className={cn(
                                "flex-1 h-11 text-xs font-black uppercase tracking-widest",
                                variants[variant]
                            )}
                        >
                            {confirmLabel}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

