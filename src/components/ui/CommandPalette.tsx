import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, User, Settings, LogOut, Command, Shield, Home } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

type CommandItem = {
    id: string;
    label: string;
    icon: React.ReactNode;
    shortcut?: string;
    action: () => void;
    category: 'Navigation' | 'Actions' | 'System';
};

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    const { signOut, user } = useAuth();

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    // Toggle Open/Close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
            if (e.key === 'Escape') {
                setOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // commands definition
    const commands: CommandItem[] = [
        {
            id: 'home',
            label: 'Go to Dashboard',
            icon: <Home className="w-4 h-4" />,
            shortcut: 'G D',
            category: 'Navigation',
            action: () => navigate(user?.role === 'provider' ? '/provider-dashboard' : '/dashboard')
        },
        {
            id: 'schedule',
            label: 'View Schedule',
            icon: <Calendar className="w-4 h-4" />,
            shortcut: 'G S',
            category: 'Navigation',
            action: () => navigate('/schedule')
        },
        {
            id: 'profile',
            label: 'Profile Settings',
            icon: <User className="w-4 h-4" />,
            shortcut: 'G P',
            category: 'Navigation',
            action: () => navigate('/profile')
        },
        {
            id: 'theme',
            label: 'Toggle Theme',
            icon: <Settings className="w-4 h-4" />,
            category: 'System',
            action: toggleTheme
        },
        {
            id: 'logout',
            label: 'Sign Out',
            icon: <LogOut className="w-4 h-4" />,
            category: 'System',
            action: signOut
        }
    ];

    if (user?.role === 'admin' || user?.role === 'provider') {
        commands.push({
            id: 'admin',
            label: 'Admin Station',
            icon: <Shield className="w-4 h-4" />,
            category: 'Navigation',
            action: () => navigate('/admin')
        });
    }

    const filteredCommands = commands.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase())
    );



    // Handle navigation within the palette
    useEffect(() => {
        if (!open) return;

        const handleNavigation = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    filteredCommands[selectedIndex].action();
                    setOpen(false);
                }
            }
        };

        window.addEventListener('keydown', handleNavigation);
        return () => window.removeEventListener('keydown', handleNavigation);
    }, [open, filteredCommands, selectedIndex]);

    // Focus input on open
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh] px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={() => setOpen(false)}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Search Bar */}
                <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <Search className="w-5 h-5 text-slate-400 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Type a command or search..."
                        className="flex-1 bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-sm font-medium"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                    />
                    <div className="flex items-center gap-1">
                        <kbd className="px-2 py-0.5 text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">ESC</kbd>
                    </div>
                </div>

                {/* Results */}
                <div className="max-h-[300px] overflow-y-auto py-2">
                    {filteredCommands.length === 0 ? (
                        <div className="px-4 py-8 text-center text-slate-500 text-sm">
                            <Command className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                            No commands found.
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {/* Grouping could go here, but flat list for now */}
                            {filteredCommands.map((cmd, index) => (
                                <button
                                    key={cmd.id}
                                    onClick={() => {
                                        cmd.action();
                                        setOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors
                                        ${index === selectedIndex
                                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-md ${index === selectedIndex ? 'bg-indigo-100 dark:bg-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                            {cmd.icon}
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="font-medium">{cmd.label}</span>
                                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{cmd.category}</span>
                                        </div>
                                    </div>
                                    {cmd.shortcut && (
                                        <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-transparent rounded border border-slate-200 dark:border-slate-700">
                                            {cmd.shortcut}
                                        </kbd>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <div className="flex gap-4">
                        <span><strong className="text-slate-600 dark:text-slate-400">↑↓</strong> Navigate</span>
                        <span><strong className="text-slate-600 dark:text-slate-400">↵</strong> Select</span>
                    </div>
                    <span>Project Vector v2.0</span>
                </div>
            </div>
        </div>
    );
}
