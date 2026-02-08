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
            <div className="fixed bottom-6 left-4 z-[50] pointer-events-none">
                <div className="bg-amber-400/90 backdrop-blur text-amber-950 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg border border-amber-500/20 opacity-50 hover:opacity-100 transition-opacity flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                    BETA: MOCK
                </div>
            </div>
        );
    }

    return null; // Production mode is silent/clean or maybe just a console log
};
