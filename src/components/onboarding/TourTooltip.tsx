import { useEffect, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, SkipForward, Check } from 'lucide-react';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { cn } from '../../lib/utils';

interface TooltipPosition {
    top: number;
    left: number;
    arrowPosition: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * TourTooltip - Floating tooltip for onboarding tour steps
 * 
 * Features:
 * - Auto-positions relative to target element
 * - Spotlight overlay to focus attention
 * - Progress indicator
 * - Navigation controls
 * - Animated entrance
 */
export function TourTooltip() {
    const {
        isActive,
        currentStep,
        currentTour,
        nextStep,
        prevStep,
        skipTour,
        completeTour
    } = useOnboarding();

    const [position, setPosition] = useState<TooltipPosition | null>(null);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const step = currentTour[currentStep];
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === currentTour.length - 1;

    // Calculate position based on target element
    useEffect(() => {
        if (!isActive || !step) return;

        const calculatePosition = () => {
            requestAnimationFrame(() => {
                const target = document.querySelector(step.targetSelector);
                if (!target) {
                    console.warn(`Tour target not found: ${step.targetSelector}`);
                    return;
                }

                const rect = target.getBoundingClientRect();

                // Compare with current to avoid unnecessary updates
                setTargetRect(prev => {
                    if (prev &&
                        prev.top === rect.top &&
                        prev.left === rect.left &&
                        prev.width === rect.width &&
                        prev.height === rect.height) {
                        return prev;
                    }
                    return rect;
                });

                const tooltipWidth = 320;
                const tooltipHeight = 180;
                const padding = 16;
                const arrowOffset = 12;

                let top = 0;
                let left = 0;
                let arrowPosition: TooltipPosition['arrowPosition'] = 'top';

                const preferredPosition = step.position || 'bottom';

                switch (preferredPosition) {
                    case 'bottom':
                        top = rect.bottom + arrowOffset;
                        left = rect.left + rect.width / 2 - tooltipWidth / 2;
                        arrowPosition = 'top';
                        break;
                    case 'top':
                        top = rect.top - tooltipHeight - arrowOffset;
                        left = rect.left + rect.width / 2 - tooltipWidth / 2;
                        arrowPosition = 'bottom';
                        break;
                    case 'right':
                        top = rect.top + rect.height / 2 - tooltipHeight / 2;
                        left = rect.right + arrowOffset;
                        arrowPosition = 'left';
                        break;
                    case 'left':
                        top = rect.top + rect.height / 2 - tooltipHeight / 2;
                        left = rect.left - tooltipWidth - arrowOffset;
                        arrowPosition = 'right';
                        break;
                }

                // Boundary checks
                left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
                top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

                const nextPos: TooltipPosition = { top, left, arrowPosition };
                setPosition(prev => {
                    if (prev &&
                        prev.top === nextPos.top &&
                        prev.left === nextPos.left &&
                        prev.arrowPosition === nextPos.arrowPosition) {
                        return prev;
                    }
                    return nextPos;
                });
            });
        };

        calculatePosition();

        const handleResize = () => calculatePosition();
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleResize, true);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleResize, true);
        };
    }, [isActive, step]);

    if (!isActive || !step || !position) return null;

    const handleNext = () => {
        if (isLastStep) {
            completeTour();
        } else {
            nextStep();
        }
    };

    return (
        <>
            {/* Spotlight Overlay */}
            <div className="fixed inset-0 z-[9998] pointer-events-none">
                {/* Dark overlay with spotlight cutout */}
                <div
                    className="absolute inset-0 bg-black/60 transition-opacity duration-300"
                    style={{
                        maskImage: targetRect
                            ? `radial-gradient(ellipse ${targetRect.width + 40}px ${targetRect.height + 40}px at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent 50%, black 51%)`
                            : undefined,
                        WebkitMaskImage: targetRect
                            ? `radial-gradient(ellipse ${targetRect.width + 40}px ${targetRect.height + 40}px at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent 50%, black 51%)`
                            : undefined
                    }}
                />
            </div>

            {/* Tooltip */}
            <div
                ref={tooltipRef}
                className={cn(
                    'fixed z-[9999] w-80',
                    'bg-white dark:bg-slate-900',
                    'rounded-xl shadow-2xl',
                    'border border-slate-200 dark:border-slate-700',
                    'animate-in fade-in zoom-in-95 duration-200'
                )}
                style={{
                    top: position.top,
                    left: position.left
                }}
            >
                {/* Arrow */}
                <div
                    className={cn(
                        'absolute w-3 h-3 bg-white dark:bg-slate-900 rotate-45',
                        'border border-slate-200 dark:border-slate-700',
                        position.arrowPosition === 'top' && 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-b-0 border-r-0',
                        position.arrowPosition === 'bottom' && 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-t-0 border-l-0',
                        position.arrowPosition === 'left' && 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 border-t-0 border-r-0',
                        position.arrowPosition === 'right' && 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2 border-b-0 border-l-0'
                    )}
                />

                {/* Header */}
                <div className="flex items-start justify-between p-4 pb-2">
                    <div className="flex-1">
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                            {step.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            {/* Progress dots */}
                            <div className="flex gap-1">
                                {currentTour.map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            'w-1.5 h-1.5 rounded-full transition-colors',
                                            i === currentStep
                                                ? 'bg-indigo-600 dark:bg-indigo-400'
                                                : i < currentStep
                                                    ? 'bg-indigo-300 dark:bg-indigo-700'
                                                    : 'bg-slate-200 dark:bg-slate-700'
                                        )}
                                    />
                                ))}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                                {currentStep + 1}/{currentTour.length}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={skipTour}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        title="Skip tour"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-4 pb-2">
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {step.description}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between p-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={skipTour}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    >
                        <SkipForward className="w-3 h-3" />
                        Skip
                    </button>

                    <div className="flex items-center gap-2">
                        {!isFirstStep && (
                            <button
                                onClick={prevStep}
                                className={cn(
                                    'flex items-center justify-center w-8 h-8 rounded-lg',
                                    'bg-slate-100 dark:bg-slate-800',
                                    'text-slate-600 dark:text-slate-400',
                                    'hover:bg-slate-200 dark:hover:bg-slate-700',
                                    'transition-colors'
                                )}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className={cn(
                                'flex items-center gap-1.5 px-4 py-2 rounded-lg',
                                'text-xs font-bold uppercase tracking-wide',
                                'bg-indigo-600 hover:bg-indigo-700 text-white',
                                'shadow-lg shadow-indigo-600/20',
                                'transition-colors'
                            )}
                        >
                            {isLastStep ? (
                                <>
                                    <Check className="w-3.5 h-3.5" />
                                    Done
                                </>
                            ) : (
                                <>
                                    Next
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
