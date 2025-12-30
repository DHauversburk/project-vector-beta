import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Lock, Unlock, AlertCircle, Clock, Filter, ListFilter } from 'lucide-react';

type AppointmentWithDetails = {
    id: string;
    start_time: string;
    end_time: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    member: { token_alias: string };
    provider: { token_alias: string; service_type: string };
};

type MasterScheduleProps = {
    actionContext: 'view' | 'block' | 'unblock' | 'override';
};

export default function MasterSchedule({ actionContext }: MasterScheduleProps) {
    const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        try {
            const data = await api.getAllAppointments();
            // @ts-ignore - Supabase types are tricky with joins
            setAppointments(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSlotClick = async (apt: AppointmentWithDetails) => {
        if (actionContext === 'view') return;

        let newStatus: string | null = null;
        if (actionContext === 'block') newStatus = 'cancelled';
        if (actionContext === 'unblock') newStatus = 'pending';

        if (newStatus) {
            const originalStatus = apt.status;
            setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, status: newStatus as any } : a));

            try {
                await api.updateAppointmentStatus(apt.id, newStatus as any);
            } catch (err) {
                setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, status: originalStatus } : a));
                console.error('Failed to update status', err);
            }
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Hydrating Logistical Data...</span>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center text-red-700 bg-red-50 rounded border border-red-100 mx-6 shadow-sm">
            <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <h3 className="font-black uppercase text-xs tracking-widest mb-1">Telemetry Interrupted</h3>
            <p className="text-xs font-bold text-red-600/70 uppercase">{error}</p>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Enterprise Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Master Base Inventory</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Real-time Stream Active</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded hover:bg-white hover:shadow-sm text-slate-400 transition-all border border-transparent hover:border-slate-200">
                        <Filter className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-white hover:shadow-sm text-slate-400 transition-all border border-transparent hover:border-slate-200">
                        <ListFilter className="w-3.5 h-3.5" />
                    </button>
                    <div className="h-4 w-px bg-slate-200 mx-1" />
                    <button onClick={fetchSchedule} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700">Refresh Feed</button>
                </div>
            </div>

            {/* High-Density Data Grid */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30">
                {appointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-400 italic">
                        <div className="bg-white border border-slate-200 p-8 rounded-lg shadow-sm text-center max-w-sm">
                            <Clock className="w-12 h-12 mx-auto mb-4 opacity-10" />
                            <p className="text-xs font-bold uppercase tracking-widest">No Active Nodes Detected</p>
                            <p className="text-[10px] mt-2 uppercase">Ensure providers have generated supply.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-2">
                        {appointments.map((apt) => (
                            <div
                                key={apt.id}
                                onClick={() => handleSlotClick(apt)}
                                className={`
                                    relative p-2.5 rounded border transition-all cursor-pointer group shadow-sm bg-white
                                    ${apt.status === 'cancelled'
                                        ? 'border-red-100 bg-red-50/30 grayscale opacity-60'
                                        : 'border-slate-200 hover:border-indigo-400 hover:shadow-md hover:bg-indigo-50/10'}
                                    ${actionContext !== 'view' ? 'hover:-translate-y-0.5' : ''}
                                `}
                            >
                                {/* Subtle Status Bar */}
                                <div className={`absolute top-0 left-0 right-0 h-[3px] ${apt.status === 'confirmed' ? 'bg-indigo-500' :
                                        apt.status === 'completed' ? 'bg-emerald-500' :
                                            apt.status === 'cancelled' ? 'bg-red-400' : 'bg-slate-200'
                                    }`}></div>

                                <div className="flex justify-between items-start mb-1.5">
                                    <span className="text-xs font-black text-slate-900 tracking-tighter">
                                        {new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                    </span>

                                    <div className="flex gap-1.5">
                                        {apt.status === 'cancelled' && <Lock className="w-2.5 h-2.5 text-red-500" />}
                                        {actionContext !== 'view' && (
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                {actionContext === 'block' && <Lock className="w-3 h-3 text-red-500" />}
                                                {actionContext === 'unblock' && <Unlock className="w-3 h-3 text-indigo-500" />}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate leading-none">
                                        {apt.provider?.service_type || 'GENERAL'}
                                    </div>
                                    <div className={`text-[11px] font-bold truncate leading-tight ${apt.status === 'cancelled' ? 'text-red-700' :
                                            apt.member?.token_alias ? 'text-indigo-700' : 'text-slate-400'
                                        }`}>
                                        {apt.status === 'cancelled' ? 'RESTRICTED' : apt.member?.token_alias || 'AVAILABLE'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Status Legend - Enterprise Footer */}
            <div className="px-4 py-2 border-t border-slate-100 bg-white flex items-center gap-6 justify-center">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Open</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Booked</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Restricted</span>
                </div>
            </div>
        </div>
    );
}
