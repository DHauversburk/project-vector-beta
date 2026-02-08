import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children?: ReactNode;
    fallbackTitle?: string;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);

        // Setup local error tracking for Beta 2 review
        try {
            const errorLog = JSON.parse(localStorage.getItem('vector_system_errors') || '[]');
            errorLog.push({
                timestamp: new Date().toISOString(),
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack,
                url: window.location.href
            });
            // Keep only last 20 errors
            localStorage.setItem('vector_system_errors', JSON.stringify(errorLog.slice(-20)));
        } catch (e) {
            console.warn('Failed to persist system error log', e);
        }
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-xl font-black uppercase text-slate-900 dark:text-white tracking-tight mb-2">
                        {this.props.fallbackTitle || 'System Glitch Detected'}
                    </h2>
                    <p className="text-xs font-bold text-slate-500 max-w-sm mx-auto mb-6 bg-slate-100 dark:bg-slate-800 p-3 rounded font-mono break-all">
                        {this.state.error?.message || 'Unknown Runtime Error'}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-800"
                    >
                        <RefreshCw className="w-3.5 h-3.5" /> Reload Interface
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
