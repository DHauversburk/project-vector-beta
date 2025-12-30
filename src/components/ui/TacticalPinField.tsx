import React, { useRef, useState, useEffect } from 'react';
import { ShieldCheck, Lock } from 'lucide-react';

interface TacticalPinFieldProps {
    onComplete: (pin: string) => void;
    error?: string;
    loading?: boolean;
}

export const TacticalPinField: React.FC<TacticalPinFieldProps> = ({ onComplete, error, loading }) => {
    const [pin, setPin] = useState(['', '', '', '']);
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Clear pin on error
        if (error) {
            setPin(['', '', '', '']);
            inputs.current[0]?.focus();
        }
    }, [error]);

    const handleChange = (value: string, index: number) => {
        if (!/^\d*$/.test(value)) return;

        const newPin = [...pin];
        newPin[index] = value.slice(-1);
        setPin(newPin);

        if (value && index < 3) {
            inputs.current[index + 1]?.focus();
        }

        if (newPin.every(digit => digit !== '') && index === 3) {
            onComplete(newPin.join(''));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-full border border-indigo-100 dark:border-indigo-800">
                    <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Security Access Required</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Enter your 4-digit Security PIN</p>
            </div>

            <div className="flex justify-center gap-3">
                {pin.map((digit, i) => (
                    <input
                        key={i}
                        ref={el => { inputs.current[i] = el; }}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleChange(e.target.value, i)}
                        onKeyDown={e => handleKeyDown(e, i)}
                        disabled={loading}
                        className={`w-14 h-16 text-center text-2xl font-black bg-white dark:bg-slate-950 border-2 rounded-xl transition-all outline-none 
                            ${error ? 'border-red-500 text-red-600 focus:ring-red-500/20' :
                                digit ? 'border-indigo-500 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400' :
                                    'border-slate-200 dark:border-slate-800 dark:text-white focus:border-indigo-300 dark:focus:border-indigo-700'} 
                            focus:ring-4 focus:ring-indigo-500/10`}
                    />
                ))}
            </div>

            {error && (
                <div className="flex items-center justify-center gap-2 text-red-500 dark:text-red-400 animate-in fade-in slide-in-from-top-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest">{error}</span>
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[9px] font-black uppercase text-indigo-600 tracking-widest">Verifying PIN...</span>
                </div>
            )}
        </div>
    );
};
