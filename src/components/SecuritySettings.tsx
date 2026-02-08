import React, { useState, useEffect } from 'react';
import { ShieldCheck, Fingerprint, Lock, RefreshCw, CheckCircle2, Database } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { api } from '../lib/api';
import { webauthn } from '../lib/webauthn';
import { useAuth } from '../contexts/AuthContext';

export const SecuritySettings: React.FC = () => {
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [isBioSupported, setIsBioSupported] = useState(false);
    const [isBioEnrolled, setIsBioEnrolled] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        webauthn.isSupported().then(setIsBioSupported);
        setIsBioEnrolled(localStorage.getItem('vector_biometric_enrolled') === 'true');
    }, []);

    const { user } = useAuth();

    const handleUpdatePin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pin.length !== 4) {
            setMessage({ type: 'error', text: 'PIN MUST BE EXACTLY 4 DIGITS' });
            return;
        }
        if (pin !== confirmPin) {
            setMessage({ type: 'error', text: 'PIN MATCH FAILED: CODES DO NOT MATCH' });
            return;
        }
        if (!user) return;

        setLoading(true);
        try {
            await api.setTacticalPin(user.id, pin);
            setMessage({ type: 'success', text: 'SECURITY PIN UPDATED' });
            setPin('');
            setConfirmPin('');
        } catch {
            setMessage({ type: 'error', text: 'SYSTEM ERROR: UNABLE TO SET PIN' });
        } finally {
            setLoading(false);
        }
    };

    const handleEnrollBio = async () => {
        setLoading(true);
        try {
            const success = await webauthn.register('vector-operator');
            if (success) {
                setIsBioEnrolled(true);
                setMessage({ type: 'success', text: 'BIOMETRIC LOGIN REGISTERED' });
            } else {
                setMessage({ type: 'error', text: 'SENSOR REJECTED SIGNATURE' });
            }
        } catch {
            setMessage({ type: 'error', text: 'BIOMETRIC SYSTEM ERROR' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid md:grid-cols-2 gap-6">
                {/* PIN Management */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                            <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Security PIN</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Access Verification Code</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdatePin} className="space-y-4">
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-700">New 4-Digit PIN</label>
                                <Input
                                    type="password"
                                    maxLength={4}
                                    placeholder="••••"
                                    value={pin}
                                    onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                                    className="h-11 text-center text-xl font-black tracking-[0.5em] border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-700">Confirm PIN</label>
                                <Input
                                    type="password"
                                    maxLength={4}
                                    placeholder="••••"
                                    value={confirmPin}
                                    onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                                    className="h-11 text-center text-xl font-black tracking-[0.5em] border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-10 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-black uppercase tracking-[0.2em]"
                            isLoading={loading}
                        >
                            Update PIN
                        </Button>
                    </form>
                </div>

                {/* Biometric Management */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                            <Fingerprint className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Biometric Login</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Device Authentication</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sensor Status</span>
                                {isBioSupported ? (
                                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full uppercase">Online</span>
                                ) : (
                                    <span className="text-[9px] font-black text-red-600 bg-red-50 dark:bg-red-900/40 px-2 py-0.5 rounded-full uppercase">Unsupported</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Enrollment</span>
                                {isBioEnrolled ? (
                                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> ACTIVE
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold text-slate-500 uppercase">NONE</span>
                                )}
                            </div>
                        </div>

                        <Button
                            onClick={handleEnrollBio}
                            disabled={!isBioSupported || loading}
                            className="w-full h-10 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-[10px] font-black uppercase tracking-[0.2em]"
                            variant="outline"
                        >
                            {isBioEnrolled ? 'Update Biometric Login' : 'Register Biometrics'}
                        </Button>
                        <p className="text-[8px] font-bold text-slate-500 uppercase leading-relaxed text-center">Biometric signatures are stored locally on-device and never transmit to the network.</p>
                    </div>
                </div>
            </div>

            {/* BETA & ADMIN CONTROLS */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Simulation Controls (Available to All in Beta) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                            <RefreshCw className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Beta Controls</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Simulation Data Management</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-bold text-slate-700 leading-relaxed">
                                Resetting the simulation will perform a factory reset of all mock data (appointments, patients) and clear your session.
                                <br /><span className="text-red-500">This action cannot be undone.</span>
                            </p>
                        </div>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                if (confirm('Factory Reset Simulation Data? This will reload the app.')) {
                                    localStorage.removeItem('MOCK_DB_V1');
                                    localStorage.removeItem('PROJECT_VECTOR_MOCK_SESSION');
                                    window.location.reload();
                                }
                            }}
                            className="w-full h-10 text-[10px] font-black uppercase tracking-[0.2em] bg-red-600 hover:bg-red-700 text-white"
                        >
                            Factory Reset Simulation
                        </Button>
                    </div>
                </div>

                {/* Admin Zone (Restricted) */}
                {(user?.email?.includes('admin') || user?.email?.includes('alex')) && (
                    <div className="bg-slate-900 dark:bg-black border border-slate-800 dark:border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <ShieldCheck className="w-24 h-24 text-white" />
                        </div>

                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                                <Database className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">System Admin</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Environment Control</p>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between p-3 bg-black/40 rounded-lg border border-white/10">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">System Mode</span>
                                    <span className={localStorage.getItem('PROJECT_VECTOR_LIVE_ACCESS') === 'true' ? "text-[9px] font-bold text-red-400" : "text-[9px] font-bold text-emerald-400"}>
                                        {localStorage.getItem('PROJECT_VECTOR_LIVE_ACCESS') === 'true' ? 'LIVE PRODUCTION' : 'MOCK / SIMULATION'}
                                    </span>
                                </div>
                                <div className={`w-3 h-3 rounded-full animate-pulse ${localStorage.getItem('PROJECT_VECTOR_LIVE_ACCESS') === 'true' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                            </div>

                            <Button
                                onClick={() => {
                                    const current = localStorage.getItem('PROJECT_VECTOR_LIVE_ACCESS') === 'true';
                                    if (current) {
                                        localStorage.removeItem('PROJECT_VECTOR_LIVE_ACCESS');
                                    } else {
                                        if (!confirm('ENABLE LIVE PRODUCTION MODE?\n\nThis will connect to the real Supabase database. Data changes will be permanent.')) return;
                                        localStorage.setItem('PROJECT_VECTOR_LIVE_ACCESS', 'true');
                                    }
                                    window.location.reload();
                                }}
                                className={`w-full h-10 text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${localStorage.getItem('PROJECT_VECTOR_LIVE_ACCESS') === 'true'
                                    ? 'bg-transparent border-emerald-500 text-emerald-500 hover:bg-emerald-500/10'
                                    : 'bg-red-600 hover:bg-red-700 border-red-600 text-white'
                                    }`}
                            >
                                {localStorage.getItem('PROJECT_VECTOR_LIVE_ACCESS') === 'true' ? 'Switch to Simulation' : 'Enable Live System'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {message && (
                <div className={`flex items-center gap-3 p-4 rounded-xl border animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' : 'bg-red-50 border-red-100 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'}`}>
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{message.text}</span>
                    <button onClick={() => setMessage(null)} className="ml-auto text-xs opacity-50 hover:opacity-100"><RefreshCw className="w-3.5 h-3.5" /></button>
                </div>
            )}
        </div>
    );
};
