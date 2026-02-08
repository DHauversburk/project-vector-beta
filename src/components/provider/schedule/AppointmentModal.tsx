import React from 'react';
import { User, X, Clock, FileText, History } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { type Appointment } from '../../../lib/api';
import { generatePatientCodename, getShortPatientId } from '../../../lib/codenames';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/Button';

interface AppointmentModalProps {
    appointment: Appointment;
    onClose: () => void;
    patientHistory: Appointment[];
    historyLoading: boolean;
    isCancelling: boolean;
    setIsCancelling: (val: boolean) => void;
    cancelReason: string;
    setCancelReason: (val: string) => void;
    handleProviderCancel: () => void;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
    appointment,
    onClose,
    patientHistory,
    historyLoading,
    isCancelling,
    setIsCancelling,
    cancelReason,
    setCancelReason,
    handleProviderCancel
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-indigo-600 text-white">
                    <div className="flex items-center gap-3">
                        <User className="w-6 h-6" />
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest">
                                {generatePatientCodename(appointment.member_id || '')}
                            </h3>
                            <p className="text-[10px] font-bold text-indigo-200">
                                ID: {getShortPatientId(appointment.member_id || '')}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-600" />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {format(parseISO(appointment.start_time), 'EEEE, MMMM d, yyyy @ HH:mm')}
                            </span>
                        </div>
                        {appointment.notes && (
                            <div className="flex items-start gap-2">
                                <FileText className="w-4 h-4 text-indigo-600 mt-0.5" />
                                <div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Reason for Visit</span>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{appointment.notes}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <History className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Patient History</span>
                        </div>

                        {historyLoading ? (
                            <div className="text-center py-4">
                                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            </div>
                        ) : patientHistory.length > 0 ? (
                            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                {patientHistory.filter(h => h.id !== appointment.id).slice(0, 5).map(hist => (
                                    <div key={hist.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                                {format(parseISO(hist.start_time), 'MMM d, yyyy @ HH:mm')}
                                            </div>
                                            {hist.notes && <div className="text-[9px] text-slate-500 truncate max-w-[200px]">{hist.notes}</div>}
                                        </div>
                                        <span className={cn(
                                            "text-[8px] font-black uppercase px-1.5 py-0.5 rounded",
                                            hist.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                hist.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                    'bg-slate-100 text-slate-600'
                                        )}>
                                            {hist.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[10px] text-slate-400 text-center py-4">No previous appointments found</p>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                    {!isCancelling ? (
                        <>
                            <button
                                onClick={() => setIsCancelling(true)}
                                className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded transition-colors"
                            >
                                Cancel Appointment
                            </button>
                            <Button size="sm" onClick={onClose}>
                                Close
                            </Button>
                        </>
                    ) : (
                        <div className="w-full space-y-3">
                            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-3 rounded-lg">
                                <p className="text-[10px] font-black uppercase text-red-600 dark:text-red-400 mb-2">Cancellation Reason (Required)</p>
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="e.g. Provider unavailable, Equipment failure..."
                                    className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-950 min-h-[60px] focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                    autoFocus
                                />
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={() => { setIsCancelling(false); setCancelReason(''); }}
                                    className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleProviderCancel}
                                    disabled={!cancelReason.trim()}
                                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest rounded disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                >
                                    Confirm Cancellation
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
