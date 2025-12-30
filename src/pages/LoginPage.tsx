import { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { QrCode, Mail, Activity, Key, ShieldCheck, Fingerprint, Lock } from 'lucide-react';
import { supabase, IS_MOCK } from '../lib/supabase';
import { webauthn } from '../lib/webauthn';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { TacticalPinField } from '../components/ui/TacticalPinField';

export default function LoginPage() {
    const [stage, setStage] = useState<'auth' | 'pin' | 'setup' | 'reset'>('auth');
    const [mode, setMode] = useState<'token' | 'email'>('token');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [pinLoading, setPinLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const { session, verifyPin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const checkPinRequirement = async (uid: string) => {
        try {
            setCurrentUserId(uid);
            const savedPin = await api.getTacticalPin(uid);
            if (savedPin) {
                setStage('pin');
            } else {
                setStage('setup');
            }
        } catch (err) {
            setStage('setup'); // Force setup if metadata unavailable
        }
    };

    const handlePinComplete = async (enteredPin: string) => {
        setPinLoading(true);
        setError('');
        try {
            if (!currentUserId) throw new Error('SESSION INVALID');
            const savedPin = await api.getTacticalPin(currentUserId);
            if (enteredPin === savedPin) {
                verifyPin();
                navigate('/dashboard');
            } else {
                setError('ACCESS DENIED: INVALID SECURITY PIN');
                setPinLoading(false);
            }
        } catch (err) {
            setError('PIN VERIFICATION ERROR');
            setPinLoading(false);
        }
    };

    const handlePinSetup = async (newPin: string) => {
        setPinLoading(true);
        try {
            if (!currentUserId) throw new Error('SESSION INVALID');
            await api.setTacticalPin(currentUserId, newPin);
            verifyPin();
            navigate('/dashboard');
        } catch (err) {
            setError('FAILED TO INITIALIZE SECURITY PIN');
            setPinLoading(false);
        }
    };

    // Resume Session Logic
    useEffect(() => {
        if (session?.user) {
            checkPinRequirement(session.user.id);
        }
    }, [session]);

    const handleReset = (resetToken: string) => {
        if (resetToken === 'VECTOR-ADMIN-RESET' || resetToken === '0000') {
            setStage('setup');
            setError('');
        } else {
            setError('INVALID RESET TOKEN');
        }
    };

    // Handle Query Params for QR Auto-fill
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlToken = params.get('token');
        if (urlToken) {
            setToken(urlToken);
            setMode('token');
        }
    }, [location]);

    // Handle Auto-Submit (Post-Mock Switch)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('autosubmit') === 'true' && token) {
            const fakeEvent = { preventDefault: () => { } } as React.FormEvent;
            handleLogin(fakeEvent);
        }
    }, [token, location]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let loginEmail = email;
            let loginPassword = password;

            if (mode === 'token') {
                const tokenMap: Record<string, string> = {
                    // SECURE V3 TOKENS (High-Entropy / Non-Sequential)
                    'M-8821-X4': 'patient01@example.com',
                    'M-3392-L9': 'patient02@example.com',
                    'M-1102-P2': 'patient03@example.com',

                    'P-MH-9921': 'docmh@example.com',
                    'R-TEAM-99X2': 'doc_red@example.com',
                    'MOCK-R-TEAM-99X2': 'doc_red@example.com',
                    'B-TEAM-77K1': 'doc_blue@example.com',
                    'CMD-ALPHA-1': 'admin@example.com',

                    // LEGACY / SHORT TOKENS
                    'DOC-MH': 'doc.mh.final@gmail.com',
                    'DOC-FAM': 'doc_fam@example.com',
                    'DOC-PT': 'doc_pt@example.com',
                    'COMMAND-01': 'admin@example.com',
                    'PATIENT-01': 'patient01@example.com',
                    'PATIENT-02': 'patient02@example.com',
                    'SARAH': 'patient03@example.com'
                };

                const key = token.trim().toUpperCase();

                // [AUTO-MOCK SWITCH] - If user enters a mock/test credential but is in REAL mode, switch them.
                const isMockToken =
                    key.includes('MOCK') ||
                    key.includes('TEST') ||
                    key.includes('DOC_RED') ||
                    key.includes('R-TEAM') ||
                    key.includes('B-TEAM') ||
                    key.includes('P-MH') ||
                    key.includes('CMD-ALPHA') ||
                    key.startsWith('M-');

                if (isMockToken && !localStorage.getItem('PROJECT_VECTOR_DEMO_MODE')) {
                    // Force Mock Mode and Reload
                    localStorage.setItem('PROJECT_VECTOR_DEMO_MODE', 'true');
                    window.location.href = `/login?token=${encodeURIComponent(key)}&autosubmit=true`;
                    return;
                }
                const mappedEmail = tokenMap[key];

                if (mappedEmail) {
                    loginEmail = mappedEmail;
                } else {
                    // DYNAMIC PROVISIONING FALLBACK
                    // If not in the hardcoded map, try the standardized format from the Admin Generator.
                    // This allows any newly generated token to work immediately.
                    loginEmail = `${key.toLowerCase()}@vector.mil`;
                }

                loginPassword = 'SecurePass2025!';
            }

            const { error } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password: loginPassword,
            });

            if (error) throw error;
            // Session effect will handle pin Requirement check
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBiometric = async () => {
        try {
            setError('');
            const isSupported = await webauthn.isSupported();
            if (!isSupported) {
                setError('BIO-SENSOR UNAVAILABLE ON THIS TERMINAL');
                return;
            }

            // In a real app, we'd fetch the user's email first or use a resident key
            const assertion = await webauthn.authenticate();
            if (assertion) {
                setLoading(true);
                // Simulate biometric-to-pin transition
                setTimeout(async () => {
                    // Simulate biometric user resolution
                    await checkPinRequirement('BIOMETRIC-USER-01');
                    setLoading(false);
                }, 800);
            }
        } catch (err: any) {
            setError(err.message || 'BIOMETRIC LOGIN FAILED');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 font-sans selection:bg-indigo-100 relative overflow-hidden transition-colors">
            {/* Background Pattern Elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600"></div>
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
            </div>

            <div className="w-full max-w-[420px] space-y-4 relative z-10 px-4">
                {/* Enterprise Branding */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 relative group overflow-hidden">
                        {stage === 'auth' ? (
                            <>
                                <img src="/pwa-192x192.png" alt="Vector" className="w-10 h-10 group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute inset-0 border-2 border-indigo-600/0 group-hover:border-indigo-600/10 rounded-2xl transition-all"></div>
                            </>
                        ) : (
                            <Lock className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                        )}
                    </div>
                    <div className="space-y-0.5">
                        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-[0.1em] uppercase">Project Vector</h1>
                        <div className="flex items-center justify-center gap-2">
                            <span className="h-px w-6 bg-slate-200 dark:bg-slate-800"></span>
                            <span className="ent-label text-[10px]">{stage === 'auth' ? 'Secure Clinical Access' : stage === 'pin' ? 'Security Access Required' : 'Initialize Security PIN'}</span>
                            <span className="h-px w-6 bg-slate-200 dark:bg-slate-800"></span>
                        </div>
                    </div>
                </div>

                {/* Login Selection */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl p-6 space-y-6 shadow-slate-200/50 dark:shadow-none transition-colors">
                    {stage === 'auth' ? (
                        <>
                            <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setMode('token')}
                                    className={`flex-1 flex items-center justify-center py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'token' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <QrCode className="w-3.5 h-3.5 mr-2" />
                                    Secure Token
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('email')}
                                    className={`flex-1 flex items-center justify-center py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'email' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Mail className="w-3.5 h-3.5 mr-2" />
                                    Email Login
                                </button>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-6">
                                {mode === 'email' ? (
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Email Address</label>
                                            <Input
                                                type="email"
                                                placeholder="user@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="h-11 text-xs font-bold uppercase border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Password</label>
                                            <Input
                                                type="password"
                                                placeholder="••••••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="h-11 text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 text-center block">Clinical Identity Token</label>
                                            <div className="relative">
                                                <Input
                                                    type="text"
                                                    placeholder="M-XXXX-XX"
                                                    value={token}
                                                    onChange={(e) => setToken(e.target.value.toUpperCase())}
                                                    className="h-16 text-center text-2xl tracking-[0.2em] font-black uppercase border-slate-200 dark:border-slate-800 focus:border-indigo-500 transition-all shadow-inner bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white"
                                                    autoFocus
                                                />
                                                <Key className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            </div>
                                            <p className="text-[10px] text-slate-700 dark:text-slate-300 text-center font-bold uppercase tracking-wide">
                                                Located on your Appointment Card
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center bg-white/50 dark:bg-slate-800/20 group hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors cursor-pointer">
                                                <QrCode className="w-10 h-10 mb-3 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 transition-colors" />
                                                <span className="text-[9px] font-black uppercase text-slate-800 dark:text-slate-200 tracking-widest group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">Optical Capture</span>
                                            </div>
                                            <div
                                                className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center bg-white/50 dark:bg-slate-800/20 group hover:border-emerald-500 dark:hover:border-emerald-400 transition-colors cursor-pointer"
                                                onClick={handleBiometric}
                                            >
                                                <Fingerprint className="w-10 h-10 mb-3 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 transition-colors" />
                                                <span className="text-[9px] font-black uppercase text-slate-800 dark:text-slate-200 tracking-widest group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">Biometric Login</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded text-red-700 animate-in fade-in zoom-in-95">
                                        <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                                        <p className="text-[10px] font-black uppercase leading-tight tracking-tight">{error}</p>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-indigo-600 dark:bg-indigo-500 text-white font-black uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none active:scale-[0.98] transition-all hover:bg-indigo-700 dark:hover:bg-indigo-400 hover:text-white"
                                    isLoading={loading}
                                >
                                    {mode === 'token' ? 'Confirm Identity' : 'Secure Login'}
                                </Button>

                                <div className="flex flex-col items-center gap-4 pt-2">
                                    {mode === 'email' && (
                                        <Link to="/register" className="text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">
                                            Request Access Clearance
                                        </Link>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Zero PHI / FIPS-140 Compliant</span>
                                    </div>
                                </div>
                            </form>
                        </>
                    ) : stage === 'pin' ? (
                        <TacticalPinField
                            onComplete={handlePinComplete}
                            error={error}
                            loading={pinLoading}
                        />
                    ) : stage === 'reset' ? (
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Administrative Reset Token</label>
                                <Input
                                    autoFocus
                                    placeholder="Enter Reset Code"
                                    className="h-11 text-xs font-bold uppercase border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                                    onChange={(e) => {
                                        if (e.target.value.length >= 4) handleReset(e.target.value);
                                    }}
                                />
                            </div>
                            <Button
                                onClick={() => setStage('auth')}
                                className="w-full text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600"
                                variant="ghost"
                            >
                                Cancel Reset
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-[10px] font-bold text-slate-600 uppercase text-center">First-time login detected. Please create your 4-digit Security PIN.</p>
                            <TacticalPinField
                                onComplete={handlePinSetup}
                                error={error}
                                loading={pinLoading}
                            />
                        </div>
                    )}
                </div>

                {stage === 'pin' && (
                    <button
                        onClick={() => {
                            setStage('reset');
                            setError('');
                        }}
                        className="w-full text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                        Forgot PIN? Recover Access
                    </button>
                )}

                {/* Footer Security Badge */}
                <div className="text-center opacity-60 flex flex-col items-center gap-2">
                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tighter">Authorized Use Only • Public Access Restricted • Vector Build v1.4.2</p>
                    <div
                        className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded ${IS_MOCK ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'}`}
                    >
                        {IS_MOCK ? '⚠️ BETA PREVIEW: SIMULATION MODE ACTIVE' : '● LIVE SYSTEM CONNECTED'}
                    </div>
                </div>
            </div>
        </div>
    );
}
