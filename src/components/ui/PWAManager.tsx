import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

export function PWAManager() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r: ServiceWorkerRegistration | undefined) {
            console.log('SW Registered:', r);
        },
        onRegisterError(error: Error) {
            console.error('SW registration error', error);
        },
    });

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            toast.success('Connectivity Restored', {
                description: 'Synchronizing all queued missions...',
                icon: <Wifi className="w-4 h-4" />
            });
        };
        const handleOffline = () => {
            setIsOnline(false);
            toast.error('Offline Mode Active', {
                description: 'Background Sync will queue operational changes.',
                icon: <WifiOff className="w-4 h-4" />
            });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        if (offlineReady) {
            toast.success('System Ready Offline', {
                description: 'Application successfully cached for field operations.',
                duration: 5000,
            });
            setOfflineReady(false);
        }
    }, [offlineReady, setOfflineReady]);

    useEffect(() => {
        if (needRefresh) {
            toast.info('Operational Update Available', {
                description: 'A new version of Vector is ready for deployment.',
                action: {
                    label: 'Update',
                    onClick: () => updateServiceWorker(true)
                },
                duration: Infinity,
            });
        }
    }, [needRefresh, updateServiceWorker]);

    return (
        <>
            {/* Status Indicator Bar (Enterprise Style) */}
            {/* Status Indicator Pill (Minimalist) */}
            <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 transform ${isOnline ? 'translate-y-20 opacity-0' : 'translate-y-0 opacity-100'}`}>
                <div className="bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-full border border-slate-700/50 shadow-2xl flex items-center gap-3">
                    <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Offline Mode</span>
                    <div className="h-3 w-px bg-slate-700" />
                    <WifiOff className="w-3.5 h-3.5 text-slate-400" />
                </div>
            </div>

            {/* Status Indicator Bar (Enterprise Style) */}
        </>
    );
}
