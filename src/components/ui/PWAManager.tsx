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
        onRegistered(r: any) {
            console.log('SW Registered:', r);
        },
        onRegisterError(error: any) {
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
            <div className={`fixed bottom-0 left-0 right-0 z-[100] transition-transform duration-500 transform ${isOnline ? 'translate-y-full' : 'translate-y-0'}`}>
                <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between border-t border-slate-800 shadow-2xl">
                    <div className="flex items-center gap-3">
                        <div className="animate-pulse">
                            <WifiOff className="w-4 h-4 text-red-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Offline Mode Active</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mt-1">Background Sync will queue operational changes.</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Indicator Bar (Enterprise Style) */}
        </>
    );
}
