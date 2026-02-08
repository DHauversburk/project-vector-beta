import React, { useState } from 'react';
import { getRandomTip } from '../../lib/constants';

interface LoadingStateProps {
    message?: string;
    showTip?: boolean;
}

/**
 * Standard Operational Loading State
 * Features a random tactical tip to make the wait "useful".
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
    message = "INITIALIZING MODULE...",
    showTip = true
}) => {
    const [tip] = useState(() => showTip ? getRandomTip() : '');

    return (
        <div className="flex flex-col items-center justify-center p-12 min-h-[400px] space-y-8 animate-in fade-in duration-500">
            {/* Cinematic Spinner */}
            <div className="relative">
                <div className="absolute inset-0 vector-gradient rounded-full blur-xl opacity-20 animate-pulse" />
                <div className="relative w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            </div>

            <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">
                    {message}
                </span>

                {showTip && tip && (
                    <div className="max-w-xs text-center mt-4 p-4 rounded-xl border border-slate-200/5 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20">
                        <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed text-slate-400">
                            <span className="text-blue-500 mr-2">OP-TIP:</span>
                            {tip}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
