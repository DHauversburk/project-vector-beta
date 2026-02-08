import { useState, useEffect, type ReactNode } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOffline } from '../../contexts/OfflineContext';
import {
    Menu, X, Sun, Moon, LogOut, ChevronLeft, ChevronRight, User, Keyboard as KeyboardIcon, CloudOff, RefreshCcw
} from 'lucide-react';
import { cn } from '../../lib/utils';
import CommandPalette from '../ui/CommandPalette';
import { KeyboardShortcutsModal } from '../ui/KeyboardShortcutsModal';

export interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    onClick?: () => void;
    dataTour?: string;
}

interface UserInfo {
    id?: string;
    email?: string;
    user_metadata?: {
        token_alias?: string;
        [key: string]: unknown;
    };
}

interface DashboardLayoutProps {
    children: ReactNode;
    navItems: NavItem[];
    activeTab: string;
    user: UserInfo | null;
    role: string;
    onSignOut: () => void;
    title?: string;
    /** Show bottom mobile nav bar (default: true if 5 or fewer nav items) */
    showMobileBottomNav?: boolean;
    /** Optional elements to show in the header (desktop right / mobile header) */
    headerActions?: React.ReactNode;
}

/**
 * DashboardLayout - Responsive layout component with Global Command Palette
 */
export function DashboardLayout({
    children,
    navItems,
    activeTab,
    user,
    role,
    onSignOut,
    title = 'Project Vector',
    showMobileBottomNav,
    headerActions
}: DashboardLayoutProps) {
    const { theme, setTheme } = useTheme();
    const { isOnline, pendingCount, syncNow } = useOffline();
    const [sidebarOpen, setSidebarOpen] = useState(true); // Desktop state
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile state
    const [shortcutsOpen, setShortcutsOpen] = useState(false);


    // Show bottom nav if explicitly set, or if 5 or fewer nav items
    const shouldShowBottomNav = showMobileBottomNav ?? navItems.length <= 5;

    const onToggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
    const onToggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const onCloseMobileMenu = () => setMobileMenuOpen(false);

    // Global Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Toggle Sidebar: Ctrl/Cmd + B
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                setSidebarOpen(prev => !prev);
            }
            // Show Shortcuts: ? (Shift + /) - ignore if in input
            if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                e.preventDefault();
                setShortcutsOpen(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const OfflineIndicator = (
        (!isOnline || pendingCount > 0) ? (
            <button
                onClick={syncNow}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all mr-2",
                    !isOnline ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" : "bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse"
                )}
                title={!isOnline ? "You are offline" : "Syncing data..."}
            >
                {!isOnline ? <CloudOff className="w-3.5 h-3.5" /> : <RefreshCcw className="w-3.5 h-3.5 animate-spin" />}
                {pendingCount > 0 ? `${pendingCount} Syncing` : 'Offline'}
            </button>
        ) : null
    );

    const sidebarProps = {
        title,
        sidebarOpen,
        navItems,
        activeTab,
        onCloseMobileMenu,
        user,
        role,
        theme,
        onToggleTheme,
        onSignOut,
        onToggleSidebar
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900/50">
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    'hidden md:block fixed inset-y-0 left-0 z-40',
                    'transition-all duration-300 ease-in-out bg-slate-900',
                    sidebarOpen ? 'w-64' : 'w-20'
                )}
            >
                <SidebarInner {...sidebarProps} />
            </aside>

            {/* Desktop Top Header */}
            <header className={cn(
                'hidden md:flex fixed top-0 right-0 z-30',
                'bg-white/80 dark:bg-slate-950/80 backdrop-blur-md',
                'border-b border-slate-200 dark:border-slate-800',
                'items-center justify-between px-8 h-16',
                'transition-all duration-300',
                sidebarOpen ? 'left-64' : 'left-20'
            )}>
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{navItems.find(i => i.id === activeTab)?.label || title}</h2>
                </div>
                <div className="flex items-center gap-4">
                    {OfflineIndicator}
                    {/* Keyboard Help Trigger */}
                    <button
                        onClick={() => setShortcutsOpen(true)}
                        className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
                        title="Keyboard Shortcuts (?)"
                        aria-label="View keyboard shortcuts"
                    >
                        <KeyboardIcon className="w-5 h-5" aria-hidden="true" />
                    </button>
                    {headerActions}
                </div>
            </header>

            {/* Mobile Header */}
            <header className={cn(
                'md:hidden fixed top-0 w-full z-40',
                'bg-white dark:bg-slate-900',
                'border-b border-slate-200 dark:border-slate-800',
                'flex items-center justify-between px-4 h-14',
                'shadow-sm',
                'pt-[env(safe-area-inset-top)]'
            )}>
                <div className="flex items-center gap-3">
                    <img src="/pwa-192x192.png" alt="Logo" className="w-8 h-8 rounded" />
                    <h1 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</h1>
                </div>
                <div className="flex items-center gap-2">
                    {OfflineIndicator}
                    {headerActions}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="w-11 h-11 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                        aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                        aria-expanded={mobileMenuOpen}
                        aria-controls="mobile-menu"
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
                    </button>
                </div>
            </header>

            {/* Mobile Sidebar Drawer */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />
                    <div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Navigation menu" className="relative w-72 max-w-[80vw] h-full animate-in slide-in-from-left duration-200">
                        <SidebarInner {...sidebarProps} mobile />
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main
                id="main-content"
                role="main"
                aria-label="Main content"
                tabIndex={-1}
                className={cn(
                    'flex-1 transition-all duration-300 min-h-screen',
                    'focus:outline-none', // Remove focus outline when programmatically focused
                    sidebarOpen ? 'md:ml-64' : 'md:ml-20',
                    'pt-14 md:pt-16',
                    shouldShowBottomNav ? 'pb-20 md:pb-0' : ''
                )}
            >
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            {shouldShowBottomNav && (
                <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center h-16 pb-[env(safe-area-inset-bottom)] shadow-lg">
                    {navItems.slice(0, 5).map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => item.onClick?.()}
                                className={cn(
                                    'flex-1 h-full flex flex-col items-center justify-center transition-all duration-200 active:scale-95',
                                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
                                )}
                            >
                                <item.icon className={cn('w-5 h-5', isActive && 'animate-scale-in')} />
                                <span className="text-[10px] font-bold uppercase tracking-tight mt-1">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            )}

            <CommandPalette />
            <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
        </div>
    );
}

interface SidebarInnerProps {
    title: string;
    sidebarOpen: boolean;
    navItems: NavItem[];
    activeTab: string;
    onCloseMobileMenu: () => void;
    user: UserInfo | null;
    role: string;
    theme: string;
    onToggleTheme: () => void;
    onSignOut: () => void;
    onToggleSidebar: () => void;
    mobile?: boolean;
}

function SidebarInner({
    title,
    sidebarOpen,
    navItems,
    activeTab,
    onCloseMobileMenu,
    user,
    role,
    theme,
    onToggleTheme,
    onSignOut,
    onToggleSidebar,
    mobile = false
}: SidebarInnerProps) {
    return (
        <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-300 relative">
            <div className={cn('h-16 flex items-center border-b border-slate-800', (sidebarOpen || mobile) ? 'px-6' : 'justify-center')}>
                <div className="flex items-center gap-3">
                    <img src="/pwa-192x192.png" alt="Logo" className="w-8 h-8 rounded shrink-0" />
                    {(sidebarOpen || mobile) && <h1 className="text-sm font-black text-white uppercase tracking-tight whitespace-nowrap">{title}</h1>}
                </div>
            </div>

            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar" role="navigation" aria-label="Main navigation">
                {navItems.map((item: NavItem) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => { item.onClick?.(); onCloseMobileMenu(); }}
                            aria-current={isActive ? 'page' : undefined}
                            aria-label={(!sidebarOpen && !mobile) ? item.label : undefined}
                            className={cn(
                                'w-full flex items-center gap-3 px-3 min-h-[44px] rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-200 active:scale-[0.98]',
                                'focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
                                isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 text-slate-400 hover:text-white',
                                (!sidebarOpen && !mobile) && 'justify-center'
                            )}
                        >
                            <item.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                            {(sidebarOpen || mobile) && <span>{item.label}</span>}
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800 bg-slate-950/30">
                <div className={cn('flex items-center gap-3 mb-4', (!sidebarOpen && !mobile) && 'justify-center')}>
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0">
                        <User className="w-5 h-5 text-slate-400" />
                    </div>
                    {(sidebarOpen || mobile) && (
                        <div className="overflow-hidden flex-1">
                            <p className="text-xs font-bold text-white truncate font-mono">{user?.user_metadata?.token_alias || user?.email || 'Unknown'}</p>
                            <p className="text-[10px] font-medium text-slate-500 uppercase truncate">{role}</p>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onToggleTheme}
                        className="flex-1 flex items-center justify-center min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5" aria-hidden="true" /> : <Moon className="w-5 h-5" aria-hidden="true" />}
                    </button>
                    <button
                        onClick={onSignOut}
                        className="flex-1 flex items-center justify-center min-h-[44px] rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                        title="Sign Out"
                        aria-label="Sign out of your account"
                    >
                        <LogOut className="w-5 h-5" aria-hidden="true" />
                    </button>
                </div>
            </div>

            {!mobile && (
                <button
                    onClick={onToggleSidebar}
                    className="absolute -right-3 top-20 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white shadow-lg transition-all hover:scale-110 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                    title="Toggle Sidebar (Ctrl+B)"
                    aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                    aria-expanded={sidebarOpen}
                >
                    {sidebarOpen ? <ChevronLeft className="w-3 h-3" aria-hidden="true" /> : <ChevronRight className="w-3 h-3" aria-hidden="true" />}
                </button>
            )}
        </div>
    );
}

