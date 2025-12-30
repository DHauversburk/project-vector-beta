import { IS_MOCK } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const SystemStatusBar = () => {
    const { session } = useAuth();

    // Only show status bar after login
    if (!session) return null;

    // If IS_MOCK is true, show Yellow Warning.
    // If IS_MOCK is false, show Green Live Indicator.

    // If IS_MOCK is true, show Yellow Warning.
    // If IS_MOCK is false, show Green Live Indicator.

    if (IS_MOCK) {
        return (
            <div className="bg-amber-400 text-amber-950 px-4 py-1.5 flex items-center justify-center font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] relative z-[100] shadow-sm select-none border-b border-amber-500/20">
                <span className="flex items-center gap-2">
                    <span className="hidden sm:inline">⚠</span>
                    BETA PREVIEW: SIMULATION MODE ACTIVE (LOCAL BROWSER)
                    <span className="hidden sm:inline">⚠</span>
                </span>
            </div>
        );
    }

    return (
        <div className="bg-emerald-600 dark:bg-emerald-700/80 backdrop-blur-md text-white px-4 py-1.5 flex items-center justify-center font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] relative z-[100] shadow-sm select-none border-b border-emerald-500/20">
            <span className="flex items-center gap-2">
                ✓ LIVE SYSTEM: PRODUCTION DATA ACTIVE
            </span>
        </div>
    );
};
