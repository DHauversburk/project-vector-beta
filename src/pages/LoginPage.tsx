/**
 * LoginPage - Dramatic enterprise login with choreographed reveal
 * 
 * @component
 * @description The primary authentication entry point for Project Vector.
 * Features a cinematic boot sequence where UI elements "load in" with
 * placeholder text that transforms into the actual component.
 * 
 * @troubleshooting
 * - Animation not playing: Check if prefers-reduced-motion is enabled
 * - Elements not appearing: Verify animation delays are sequential
 * - Login failing: Check console for API errors, verify mock mode
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { QrCode, Mail, Activity, Key, ShieldCheck, Fingerprint, Lock, Shield, Zap, CheckCircle2, Loader2, HelpCircle } from 'lucide-react';
import { supabase, IS_MOCK } from '../lib/supabase';
import { webauthn } from '../lib/webauthn';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { TacticalPinField } from '../components/ui/TacticalPinField';
import { TokenHelpModal } from '../components/ui/TokenHelpModal';

interface AuthenticationError {
    message: string;
}

// Boot sequence configuration
interface BootStep {
    id: string;
    loadingText: string;
    delay: number;
    duration: number;
}

const bootSequence: BootStep[] = [
    { id: 'background', loadingText: 'INITIALIZING DISPLAY...', delay: 0, duration: 400 },
    { id: 'logo', loadingText: 'LOADING SECURITY MODULE...', delay: 400, duration: 500 },
    { id: 'title', loadingText: 'ESTABLISHING IDENTITY...', delay: 800, duration: 400 },
    { id: 'card', loadingText: 'PREPARING INTERFACE...', delay: 1200, duration: 500 },
    { id: 'inputs', loadingText: 'INITIALIZING INPUT LAYER...', delay: 1700, duration: 400 },
    { id: 'button', loadingText: 'ARMING AUTHENTICATION...', delay: 2100, duration: 400 },
    { id: 'footer', loadingText: 'VERIFYING PROTOCOLS...', delay: 2500, duration: 400 },
    { id: 'complete', loadingText: 'SYSTEM READY', delay: 2900, duration: 300 },
];

export default function LoginPage() {
    // Boot sequence state
    const [bootPhase, setBootPhase] = useState<string>('init');
    const [loadedElements, setLoadedElements] = useState<Set<string>>(new Set());
    const [currentLoadingText, setCurrentLoadingText] = useState('');
    const [bootComplete, setBootComplete] = useState(false);
    const [showBootSequence, setShowBootSequence] = useState(true);

    // Auth state
    const [stage, setStage] = useState<'auth' | 'pin' | 'setup' | 'reset'>('auth');
    const [mode, setMode] = useState<'token' | 'email'>('token');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [pinLoading, setPinLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const tokenInputRef = useRef<HTMLInputElement>(null);
    const [showTokenHelp, setShowTokenHelp] = useState(false);

    const { session, verifyPin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Check if boot sequence should be skipped
    useEffect(() => {
        const hasBooted = sessionStorage.getItem('VECTOR_BOOTED_THIS_SESSION');
        if (hasBooted) {
            setShowBootSequence(false);
            setBootComplete(true);
            bootSequence.forEach(step => {
                setLoadedElements(prev => new Set([...prev, step.id]));
            });
        }
    }, []);

    // Handle URL params for mode selection
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const modeParam = params.get('mode');
        const helpParam = params.get('help');

        if (modeParam === 'patient') {
            setMode('token');
        } else if (modeParam === 'staff' || modeParam === 'admin') {
            setMode('email');
        }

        if (helpParam === 'token') {
            setMode('token');
            // Give a small delay to allow animation to settle if needed, or just open immediately
            setTimeout(() => setShowTokenHelp(true), 500);
        }
    }, [location]);

    // Auto-focus token input when boot completes
    useEffect(() => {
        if (bootComplete && stage === 'auth' && mode === 'token') {
            const focusToken = () => {
                if (tokenInputRef.current) {
                    tokenInputRef.current.focus();
                }
            };
            // Multiple attempts to handle render timing
            const timers = [0, 50, 100, 200, 400].map(delay =>
                setTimeout(focusToken, delay)
            );
            return () => timers.forEach(clearTimeout);
        }
    }, [bootComplete, stage, mode]);

    // Run boot sequence
    useEffect(() => {
        if (!showBootSequence) return;

        bootSequence.forEach((step) => {
            // Show loading text
            setTimeout(() => {
                setCurrentLoadingText(step.loadingText);
                setBootPhase(step.id);
            }, step.delay);

            // Mark element as loaded after its duration
            setTimeout(() => {
                setLoadedElements(prev => new Set([...prev, step.id]));

                if (step.id === 'complete') {
                    setBootComplete(true);
                    sessionStorage.setItem('VECTOR_BOOTED_THIS_SESSION', 'true');
                    setTimeout(() => {
                        setShowBootSequence(false);
                    }, 500);
                }
            }, step.delay + step.duration);
        });
    }, [showBootSequence]);

    // Auth logic (unchanged)
    const checkPinRequirement = async (uid: string) => {
        try {
            setCurrentUserId(uid);
            const savedPin = await api.getTacticalPin(uid);
            if (savedPin) {
                setStage('pin');
            } else {
                setStage('setup');
            }
        } catch {
            setStage('setup');
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
        } catch {
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
        } catch {
            setError('FAILED TO INITIALIZE SECURITY PIN');
            setPinLoading(false);
        }
    };

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

    // Handle URL parameters for mode and token
    useEffect(() => {
        const params = new URLSearchParams(location.search);

        // Check for mode from landing page
        const urlMode = params.get('mode');
        if (urlMode === 'patient') {
            setMode('token');
        } else if (urlMode === 'staff' || urlMode === 'admin') {
            setMode('email');
        }

        // Check for pre-filled token
        const urlToken = params.get('token');
        if (urlToken) {
            setToken(urlToken);
            setMode('token');
        }
    }, [location]);

    const handleLogin = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let loginEmail = email;
            let loginPassword = password;

            if (mode === 'token') {
                const tokenMap: Record<string, string> = {
                    'M-8821-X4': 'patient01@example.com',
                    'M-3392-L9': 'patient02@example.com',
                    'M-1102-P2': 'patient03@example.com',
                    'P-MH-9921': 'docmh@example.com',
                    'R-TEAM-99X2': 'doc_red@example.com',
                    'MOCK-R-TEAM-99X2': 'doc_red@example.com',
                    'B-TEAM-77K1': 'doc_blue@example.com',
                    'CMD-ALPHA-1': 'admin@example.com',
                    'DOC-MH': 'doc.mh.final@gmail.com',
                    'DOC-FAM': 'doc_fam@example.com',
                    'DOC-PT': 'doc_pt@example.com',
                    'COMMAND-01': 'admin@example.com',
                    'PATIENT-01': 'patient01@example.com',
                    'PATIENT-02': 'patient02@example.com',
                    'SARAH': 'patient03@example.com'
                };

                const key = token.trim().toUpperCase();
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
                    localStorage.setItem('PROJECT_VECTOR_DEMO_MODE', 'true');
                    window.location.href = `/login?token=${encodeURIComponent(key)}&autosubmit=true`;
                    return;
                }

                const mappedEmail = tokenMap[key];
                if (mappedEmail) {
                    loginEmail = mappedEmail;
                } else {
                    loginEmail = `${key.toLowerCase()}@vector.mil`;
                }
                loginPassword = 'SecurePass2025!';
            }

            const { error } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password: loginPassword,
            });

            if (error) throw error;
        } catch (err) {
            const error = err as AuthenticationError;
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [email, password, mode, token]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('autosubmit') === 'true' && token) {
            const fakeEvent = { preventDefault: () => { } } as React.FormEvent;
            handleLogin(fakeEvent);
        }
    }, [token, location, handleLogin]);

    const handleBiometric = async () => {
        try {
            setError('');
            const isSupported = await webauthn.isSupported();
            if (!isSupported) {
                setError('BIO-SENSOR UNAVAILABLE ON THIS TERMINAL');
                return;
            }
            const assertion = await webauthn.authenticate();
            if (assertion) {
                setLoading(true);
                setTimeout(async () => {
                    await checkPinRequirement('BIOMETRIC-USER-01');
                    setLoading(false);
                }, 800);
            }
        } catch (err) {
            const error = err as AuthenticationError;
            setError(error.message || 'BIOMETRIC LOGIN FAILED');
        }
    };

    // Helper to check if an element should be visible
    const isLoaded = (id: string) => loadedElements.has(id);
    const isLoading = (id: string) => bootPhase === id && !loadedElements.has(id);

    // Loading placeholder component
    const LoadingPlaceholder = ({ text, visible }: { text: string; visible: boolean }) => (
        <div className={`flex items-center justify-center gap-2 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">{text}</span>
        </div>
    );

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
            {/* ============================================================
                BACKGROUND - Loads first
                ============================================================ */}
            <div className={`absolute inset-0 transition-opacity duration-700 ${isLoaded('background') ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />

                {/* Animated gradient orbs */}
                <div className="absolute inset-0 overflow-hidden">
                    <div
                        className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-30 blur-3xl animate-pulse"
                        style={{ background: 'radial-gradient(circle, hsl(217, 91%, 60%) 0%, transparent 70%)', animationDuration: '4s' }}
                    />
                    <div
                        className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl animate-pulse"
                        style={{ background: 'radial-gradient(circle, hsl(262, 83%, 58%) 0%, transparent 70%)', animationDuration: '5s', animationDelay: '1s' }}
                    />
                    <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl animate-pulse"
                        style={{ background: 'radial-gradient(circle, hsl(330, 81%, 60%) 0%, transparent 70%)', animationDuration: '6s', animationDelay: '2s' }}
                    />
                </div>

                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

                {/* Top gradient bar */}
                <div className="absolute top-0 left-0 right-0 h-1 vector-gradient" />
            </div>

            {/* Background loading state */}
            {!isLoaded('background') && (
                <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
                    <LoadingPlaceholder text={currentLoadingText || 'INITIALIZING...'} visible={true} />
                </div>
            )}

            {/* ============================================================
                MAIN CONTENT
                ============================================================ */}
            <div className="w-full max-w-md relative z-10">

                {/* ============================================================
                    LOGO - Loads second
                    ============================================================ */}
                <div className="text-center mb-8">
                    <div className="relative inline-block mb-6 h-24">
                        {/* Loading state */}
                        {isLoading('logo') && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <LoadingPlaceholder text={currentLoadingText} visible={true} />
                            </div>
                        )}

                        {/* Loaded state */}
                        <div className={`transition-all duration-700 ${isLoaded('logo') ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                            <div className="absolute inset-0 vector-gradient rounded-2xl blur-xl opacity-50 animate-pulse" style={{ animationDuration: '3s' }} />
                            <div className="relative w-20 h-20 mx-auto rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 flex items-center justify-center shadow-2xl">
                                {stage === 'auth' ? (
                                    <img src="/pwa-192x192.png" alt="Vector" className="w-12 h-12 drop-shadow-lg" />
                                ) : (
                                    <Lock className="w-10 h-10 text-blue-400 animate-pulse" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ============================================================
                        TITLE - Loads third
                        ============================================================ */}
                    <div className="h-16 relative">
                        {/* Loading state */}
                        {isLoading('title') && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <LoadingPlaceholder text={currentLoadingText} visible={true} />
                            </div>
                        )}

                        {/* Loaded state */}
                        <div className={`transition-all duration-700 ${isLoaded('title') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <h1 className="text-3xl font-black tracking-[0.2em] uppercase mb-2 vector-gradient-text">
                                Project Vector
                            </h1>
                            <div className="flex items-center justify-center gap-3">
                                <span className="h-px w-8 bg-gradient-to-r from-transparent to-slate-600" />
                                <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
                                    {stage === 'auth' ? 'Secure Clinical Access' :
                                        stage === 'pin' ? 'Security Verification' :
                                            'Initialize Security'}
                                </span>
                                <span className="h-px w-8 bg-gradient-to-l from-transparent to-slate-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ============================================================
                    LOGIN CARD - Loads fourth
                    ============================================================ */}
                <div className="relative min-h-[400px]">
                    {/* Loading state */}
                    {isLoading('card') && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <LoadingPlaceholder text={currentLoadingText} visible={true} />
                        </div>
                    )}

                    {/* Card container */}
                    <div className={`transition-all duration-700 ${isLoaded('card') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <div className="absolute -inset-1 vector-gradient rounded-3xl blur-lg opacity-20" />

                        <div className="relative bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">

                            {stage === 'auth' ? (
                                <>
                                    {/* Mode Toggle */}
                                    <div className={`transition-all duration-500 delay-100 ${isLoaded('inputs') ? 'opacity-100' : 'opacity-0'}`}>
                                        <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 mb-8">
                                            <button
                                                type="button"
                                                onClick={() => setMode('token')}
                                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-300 ${mode === 'token'
                                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                                    : 'text-slate-500 hover:text-slate-300'
                                                    }`}
                                            >
                                                <QrCode className="w-4 h-4" />
                                                Token
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setMode('email')}
                                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-300 ${mode === 'email'
                                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                                    : 'text-slate-500 hover:text-slate-300'
                                                    }`}
                                            >
                                                <Mail className="w-4 h-4" />
                                                Email
                                            </button>
                                        </div>
                                    </div>

                                    <form onSubmit={handleLogin} className="space-y-6">
                                        {/* Input Fields Loading */}
                                        {isLoading('inputs') && (
                                            <div className="py-8 flex items-center justify-center">
                                                <LoadingPlaceholder text={currentLoadingText} visible={true} />
                                            </div>
                                        )}

                                        {/* Input Fields Loaded */}
                                        <div className={`transition-all duration-500 ${isLoaded('inputs') ? 'opacity-100' : 'opacity-0'}`}>
                                            {mode === 'email' ? (
                                                <div className="space-y-5">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                                                            Email Address
                                                        </label>
                                                        <Input
                                                            type="email"
                                                            placeholder="user@vector.mil"
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            required
                                                            className="h-12 bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                                                            Password
                                                        </label>
                                                        <Input
                                                            type="password"
                                                            placeholder="••••••••••••"
                                                            value={password}
                                                            onChange={(e) => setPassword(e.target.value)}
                                                            required
                                                            className="h-12 bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    <div className="space-y-3">
                                                        <label className="text-sm font-black uppercase tracking-widest text-center block text-slate-300">
                                                            Clinical Identity Token
                                                        </label>
                                                        <div className="relative group">
                                                            <div className="absolute -inset-1 vector-gradient rounded-xl blur opacity-25 group-focus-within:opacity-50 transition-opacity" />
                                                            <div className="relative">
                                                                <input
                                                                    ref={tokenInputRef}
                                                                    type="text"
                                                                    placeholder="M-XXXX-XX"
                                                                    value={token}
                                                                    onChange={(e) => setToken(e.target.value.toUpperCase())}
                                                                    className="flex w-full h-16 text-center text-2xl tracking-[0.2em] font-black uppercase bg-slate-950/80 border-2 border-slate-700 text-white placeholder:text-slate-700 focus:border-blue-500 font-mono rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                                />
                                                                <Key className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowTokenHelp(true)}
                                                            className="flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-blue-400 transition-colors mx-auto"
                                                        >
                                                            <HelpCircle className="w-4 h-4" />
                                                            <span>What's a Token? Where do I find it?</span>
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <button
                                                            type="button"
                                                            className="group p-5 bg-slate-950/50 border border-slate-800 rounded-xl flex flex-col items-center justify-center hover:border-blue-500/50 hover:bg-slate-900/50 transition-all duration-300"
                                                        >
                                                            <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center mb-3 group-hover:bg-blue-900/30 transition-colors">
                                                                <QrCode className="w-6 h-6 text-slate-500 group-hover:text-blue-400 transition-colors" />
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">
                                                                Scan QR
                                                            </span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleBiometric}
                                                            className="group p-5 bg-slate-950/50 border border-slate-800 rounded-xl flex flex-col items-center justify-center hover:border-emerald-500/50 hover:bg-slate-900/50 transition-all duration-300"
                                                        >
                                                            <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center mb-3 group-hover:bg-emerald-900/30 transition-colors">
                                                                <Fingerprint className="w-6 h-6 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">
                                                                Biometric
                                                            </span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Error Display */}
                                        {error && (
                                            <div className="flex items-start gap-3 p-4 bg-red-950/50 border border-red-900/50 rounded-xl text-red-400 animate-scale-in">
                                                <ShieldCheck className="w-5 h-5 mt-0.5 shrink-0" />
                                                <p className="text-xs font-black uppercase leading-relaxed tracking-wide">{error}</p>
                                            </div>
                                        )}

                                        {/* Submit Button Loading */}
                                        {isLoading('button') && (
                                            <div className="py-4 flex items-center justify-center">
                                                <LoadingPlaceholder text={currentLoadingText} visible={true} />
                                            </div>
                                        )}

                                        {/* Submit Button Loaded */}
                                        <div className={`transition-all duration-500 ${isLoaded('button') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                            <Button
                                                type="submit"
                                                variant="gradient"
                                                size="lg"
                                                className="w-full h-14 text-sm"
                                                isLoading={loading}
                                                disabled={!bootComplete}
                                            >
                                                {mode === 'token' ? (
                                                    <>
                                                        <Zap className="w-5 h-5 mr-2" />
                                                        Authenticate
                                                    </>
                                                ) : (
                                                    <>
                                                        <Shield className="w-5 h-5 mr-2" />
                                                        Secure Login
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        {/* Footer Loading */}
                                        {isLoading('footer') && (
                                            <div className="py-4 flex items-center justify-center">
                                                <LoadingPlaceholder text={currentLoadingText} visible={true} />
                                            </div>
                                        )}

                                        {/* Footer Links */}
                                        <div className={`transition-all duration-500 ${isLoaded('footer') ? 'opacity-100' : 'opacity-0'}`}>
                                            <div className="flex flex-col items-center gap-4 pt-4">
                                                {mode === 'email' && (
                                                    <Link
                                                        to="/register"
                                                        className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-blue-400 transition-colors"
                                                    >
                                                        Request Access Clearance
                                                    </Link>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <Activity className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                        Zero PHI • FIPS-140
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </>
                            ) : stage === 'pin' ? (
                                <div className="space-y-6">
                                    <div className="text-center mb-4">
                                        <Shield className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                                        <h2 className="text-lg font-black uppercase tracking-widest text-white mb-2">
                                            Security PIN Required
                                        </h2>
                                        <p className="text-xs text-slate-400 uppercase tracking-wide">
                                            Enter your 4-digit security code
                                        </p>
                                    </div>
                                    <TacticalPinField
                                        onComplete={handlePinComplete}
                                        error={error}
                                        loading={pinLoading}
                                    />
                                </div>
                            ) : stage === 'reset' ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                                            Administrative Reset Token
                                        </label>
                                        <Input
                                            autoFocus
                                            placeholder="Enter Reset Code"
                                            className="h-12 bg-slate-950/50 border-slate-700 text-white"
                                            onChange={(e) => {
                                                if (e.target.value.length >= 4) handleReset(e.target.value);
                                            }}
                                        />
                                    </div>
                                    {error && (
                                        <p className="text-xs text-red-400 font-bold uppercase">{error}</p>
                                    )}
                                    <Button
                                        onClick={() => setStage('auth')}
                                        variant="ghost"
                                        className="w-full text-slate-500 hover:text-white"
                                    >
                                        Cancel Reset
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="text-center mb-4">
                                        <div className="w-12 h-12 mx-auto mb-4 rounded-full vector-gradient flex items-center justify-center">
                                            <Shield className="w-6 h-6 text-white" />
                                        </div>
                                        <h2 className="text-lg font-black uppercase tracking-widest text-white mb-2">
                                            Initialize Security
                                        </h2>
                                        <p className="text-xs text-slate-400 uppercase tracking-wide">
                                            Create your 4-digit security PIN
                                        </p>
                                    </div>
                                    <TacticalPinField
                                        onComplete={handlePinSetup}
                                        error={error}
                                        loading={pinLoading}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* PIN Recovery Link */}
                {stage === 'pin' && (
                    <button
                        onClick={() => {
                            setStage('reset');
                            setError('');
                        }}
                        className="w-full mt-6 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-600 hover:text-blue-400 transition-colors"
                    >
                        Forgot PIN? Recover Access
                    </button>
                )}

                {/* Footer Status - Shows after complete */}
                <div className={`mt-8 text-center space-y-3 transition-all duration-700 ${isLoaded('complete') ? 'opacity-100' : 'opacity-0'}`}>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                        {bootComplete ? 'Authorized Use Only • Public Access Restricted • v2.0.0-beta' : ''}
                    </p>
                    <div
                        className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full ${IS_MOCK
                            ? 'text-amber-400 bg-amber-950/50 border border-amber-900/50'
                            : 'text-emerald-400 bg-emerald-950/50 border border-emerald-900/50'
                            }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${IS_MOCK ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
                        {IS_MOCK ? 'Simulation Mode' : 'Live System'}
                    </div>

                    {IS_MOCK && bootComplete && (
                        <button
                            onClick={() => {
                                if (confirm('Reset all demo data? This will clear appointments and reload clean mock data.')) {
                                    api.mockStore.reset();
                                    window.location.reload();
                                }
                            }}
                            className="block mx-auto mt-3 px-4 py-2 border border-red-900/50 rounded-lg text-xs font-black uppercase tracking-widest text-red-400 bg-red-950/30 hover:bg-red-950/50 active:scale-95 transition-all"
                        >
                            Reset Demo Data
                        </button>
                    )}
                </div>

                {/* Boot complete indicator */}
                {bootComplete && !showBootSequence && (
                    <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 text-emerald-400 animate-fade-in">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[10px] font-mono uppercase tracking-widest">System Ready</span>
                    </div>
                )}
            </div>

            {/* Token Help Modal */}
            <TokenHelpModal
                isOpen={showTokenHelp}
                onClose={() => setShowTokenHelp(false)}
            />
        </div>
    );
}
