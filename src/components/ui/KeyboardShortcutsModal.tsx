import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
    open: boolean;
    onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ open, onClose }) => {
    if (!open) return null;

    const shortcuts = [
        { key: '⌘/Ctrl + K', description: 'Open Command Palette' },
        { key: '⌘/Ctrl + B', description: 'Toggle Sidebar' },
        { key: '?', description: 'Show Shortcuts Help' },
        { key: 'ESC', description: 'Close Modals' },
        { key: 'N', description: 'New Note (Provider Dashboard)' },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden relative">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Keyboard className="w-5 h-5 text-indigo-500" />
                        Keyboard Shortcuts
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-4 space-y-2">
                    {shortcuts.map((s, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{s.description}</span>
                            <kbd className="px-2 py-1 text-xs font-mono font-bold text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 min-w-[24px] text-center">
                                {s.key}
                            </kbd>
                        </div>
                    ))}
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 text-center">
                    <span className="text-xs text-slate-400">Pro Tip: Use TAB to navigate form fields quickly.</span>
                </div>
            </div>
        </div>
    );
};
