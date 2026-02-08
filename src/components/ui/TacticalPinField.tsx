/**
 * TacticalPinField - Secure PIN entry component
 * 
 * @component
 * @description A military-styled 4-digit PIN entry field with visual feedback,
 * auto-advance between inputs, and animated states for the Vector Dark theme.
 * 
 * @troubleshooting
 * - PIN not submitting: Ensure all 4 digits are entered
 * - Focus not advancing: Check if input is disabled during loading
 * - Auto-focus not working: Component uses aggressive focus with timeouts
 */

import React, { useRef, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface TacticalPinFieldProps {
    /** Callback when all 4 digits are entered */
    onComplete: (pin: string) => void;
    /** Error message to display */
    error?: string;
    /** Loading state - disables input */
    loading?: boolean;
}

export const TacticalPinField: React.FC<TacticalPinFieldProps> = ({ onComplete, error, loading }) => {
    const [pin, setPin] = useState<string[]>(['', '', '', '']);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Focus a specific input by index
    const focusInput = useCallback((index: number) => {
        const input = inputRefs.current[index];
        if (input) {
            input.focus();
            input.select();
        }
    }, []);

    // Track previous error to detect changes
    const prevErrorRef = useRef(error);

    // Clear and refocus on error - using useLayoutEffect for synchronous DOM updates
    useLayoutEffect(() => {
        if (error && error !== prevErrorRef.current) {
            // Only clear if there are values to clear
            if (!pin.every(v => v === '')) {

                setPin(['', '', '', '']); // eslint-disable-line
            }
            setTimeout(() => focusInput(0), 100);
        }
        prevErrorRef.current = error;
    }, [error, focusInput, pin]);

    // Aggressive auto-focus on mount
    useEffect(() => {
        // Multiple attempts with delays to handle animations
        const attempts = [0, 50, 100, 200, 400, 600];
        const timers = attempts.map(delay =>
            setTimeout(() => focusInput(0), delay)
        );
        return () => timers.forEach(clearTimeout);
    }, [focusInput]);

    // Handle input change
    const handleInput = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const value = e.target.value;

        // Only allow digits
        const digit = value.replace(/\D/g, '').slice(-1);

        // Update PIN
        const newPin = [...pin];
        newPin[index] = digit;
        setPin(newPin);

        // Auto-advance to next input
        if (digit && index < 3) {
            setTimeout(() => focusInput(index + 1), 10);
        }

        // Check if complete
        if (digit && index === 3) {
            const fullPin = newPin.join('');
            if (fullPin.length === 4 && /^\d{4}$/.test(fullPin)) {
                setTimeout(() => onComplete(fullPin), 50);
            }
        }
    };

    // Handle key events
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        // Backspace handling
        if (e.key === 'Backspace') {
            if (pin[index] === '' && index > 0) {
                e.preventDefault();
                const newPin = [...pin];
                newPin[index - 1] = '';
                setPin(newPin);
                focusInput(index - 1);
            } else if (pin[index] !== '') {
                const newPin = [...pin];
                newPin[index] = '';
                setPin(newPin);
            }
        }

        // Arrow key navigation
        if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            focusInput(index - 1);
        }
        if (e.key === 'ArrowRight' && index < 3) {
            e.preventDefault();
            focusInput(index + 1);
        }

        // Handle direct digit input (for when maxLength causes issues)
        if (/^\d$/.test(e.key)) {
            e.preventDefault();
            const newPin = [...pin];
            newPin[index] = e.key;
            setPin(newPin);

            if (index < 3) {
                setTimeout(() => focusInput(index + 1), 10);
            } else {
                // Complete
                const fullPin = [...newPin.slice(0, 3), e.key].join('');
                if (/^\d{4}$/.test(fullPin)) {
                    setTimeout(() => onComplete(fullPin), 50);
                }
            }
        }
    };

    // Handle paste
    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
        if (pastedData.length > 0) {
            const newPin = ['', '', '', ''];
            pastedData.split('').forEach((digit, i) => {
                if (i < 4) newPin[i] = digit;
            });
            setPin(newPin);

            if (pastedData.length === 4) {
                setTimeout(() => onComplete(pastedData), 50);
            } else {
                focusInput(pastedData.length);
            }
        }
    };

    return (
        <div className="space-y-6 animate-scale-in">
            {/* PIN Input Fields */}
            <div className="flex justify-center gap-3">
                {pin.map((digit, i) => (
                    <div key={i} className="relative">
                        {/* Glow effect behind focused input */}
                        {focusedIndex === i && (
                            <div className="absolute -inset-1 vector-gradient rounded-xl blur opacity-40 animate-pulse" />
                        )}
                        <input
                            ref={el => { inputRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="one-time-code"
                            maxLength={2}
                            value={digit ? '•' : ''}
                            onChange={e => handleInput(e, i)}
                            onKeyDown={e => handleKeyDown(e, i)}
                            onFocus={() => setFocusedIndex(i)}
                            onBlur={() => setFocusedIndex(null)}
                            onPaste={handlePaste}
                            disabled={loading}
                            className={`
                                relative w-14 h-16 text-center text-3xl font-black 
                                bg-slate-950/80 backdrop-blur-sm
                                border-2 rounded-xl 
                                transition-all duration-200 outline-none
                                caret-transparent select-none
                                ${error
                                    ? 'border-red-500 text-red-400'
                                    : digit
                                        ? 'border-blue-500 text-blue-400 shadow-lg shadow-blue-500/20'
                                        : 'border-slate-700 text-white hover:border-slate-600'
                                }
                                focus:border-blue-400 focus:shadow-lg focus:shadow-blue-500/30
                                disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                            aria-label={`PIN digit ${i + 1}`}
                        />
                    </div>
                ))}
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2">
                {pin.map((digit, i) => (
                    <div
                        key={i}
                        className={`
                            w-2 h-2 rounded-full transition-all duration-300
                            ${digit
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 scale-125'
                                : 'bg-slate-700'
                            }
                        `}
                    />
                ))}
            </div>

            {/* Error Display */}
            {error && (
                <div className="flex items-center justify-center gap-2 text-red-400 animate-scale-in">
                    <ShieldAlert className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-widest">{error}</span>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                    <span className="text-xs font-black uppercase text-blue-400 tracking-widest">
                        Verifying...
                    </span>
                </div>
            )}
        </div>
    );
};
