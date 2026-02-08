/**
 * WaitlistModal - Join waitlist for fully booked providers
 * 
 * @component
 * @description Allows patients to join a waitlist when a provider has no
 * available slots. Users can specify preferred days and notes.
 */

import { useState } from 'react';
import { X, Clock, CheckCircle, Loader2, Bell } from 'lucide-react';
import { Button } from './Button';
import { api } from '../../lib/api';
import type { WaitlistEntry } from '../../lib/api';

interface WaitlistModalProps {
    isOpen: boolean;
    onClose: () => void;
    providerId: string;
    serviceType: string;
    onSuccess?: (entry: WaitlistEntry) => void;
}

const DAYS_OF_WEEK = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
];

export function WaitlistModal({ isOpen, onClose, providerId, serviceType, onSuccess }: WaitlistModalProps) {
    const [preferredDays, setPreferredDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const toggleDay = (day: number) => {
        if (preferredDays.includes(day)) {
            setPreferredDays(preferredDays.filter(d => d !== day));
        } else {
            setPreferredDays([...preferredDays, day].sort());
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        try {
            const entry = await api.joinWaitlist(providerId, serviceType, note, preferredDays);
            onSuccess?.(entry);
            onClose();
        } catch (err) {
            const error = err as Error;
            console.error(error);
            setError(error.message || 'Failed to join waitlist');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" />
            <div
                className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 pb-4 border-b border-slate-800 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Join Waitlist</h2>
                            <p className="text-xs text-slate-400">Get notified when a slot opens up</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Info Box */}
                    <div className="bg-amber-950/30 border border-amber-500/20 rounded-lg p-3 flex gap-3">
                        <Bell className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <p className="text-xs text-amber-200">
                            You'll receive a notification if an appointment becomes available matching your preferences.
                        </p>
                    </div>

                    {/* Preferred Days */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                            Preferred Days
                        </label>
                        <div className="flex justify-between gap-1">
                            {DAYS_OF_WEEK.map(day => {
                                const isSelected = preferredDays.includes(day.value);
                                return (
                                    <button
                                        key={day.value}
                                        onClick={() => toggleDay(day.value)}
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${isSelected
                                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 scale-105'
                                            : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                                            }`}
                                    >
                                        {day.label.charAt(0)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                            Notes <span className="text-slate-600">(Optional)</span>
                        </label>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Any specific time preferences or urgency?"
                            rows={3}
                            className="w-full p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-950/50 border border-red-500/50 text-red-400 text-xs rounded-lg">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 pt-0 flex gap-3">
                    <Button onClick={onClose} variant="outline" className="flex-1">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                        disabled={loading || preferredDays.length === 0}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                        Join Waitlist
                    </Button>
                </div>
            </div>
        </div>
    );
}
