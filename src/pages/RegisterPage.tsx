import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ShieldCheck, User, Lock, Mail, Activity, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function RegisterPage() {
    const [alias, setAlias] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (pin.length !== 4 || !/^\d+$/.test(pin)) {
            setError("SECURITY PIN MUST BE 4 DIGITS");
            setLoading(false);
            return;
        }

        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        token_alias: alias.toUpperCase(),
                        tactical_pin: pin,
                        role: 'member' // Default to member for self-registration
                    }
                }
            });

            if (signUpError) throw signUpError;

            // In Project Vector, self-registration might require manual approval
            // but for this PoC we navigate to dashboard
            navigate('/dashboard');
        } catch (err) {
            const error = err as { message: string };
            setError(error.message.toUpperCase());
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 font-sans selection:bg-indigo-100 relative overflow-hidden transition-colors">
            {/* Background Pattern Elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600"></div>
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
            </div>

            <div className="w-full max-w-[480px] space-y-8 relative z-10 px-4">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800">
                        <Activity className="w-10 h-10 text-indigo-600" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-[0.2em] uppercase">Patient Registration</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enroll in Project Vector Healthcare</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl p-8 space-y-6 shadow-slate-200/50 dark:shadow-none transition-colors">
                    {error && (
                        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded text-red-700 animate-in fade-in zoom-in-95">
                            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                            <p className="text-[10px] font-black uppercase leading-tight tracking-tight">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Patient Alias</label>
                                <div className="relative">
                                    <Input
                                        placeholder="GHOST-01"
                                        value={alias}
                                        onChange={(e) => setAlias(e.target.value.toUpperCase())}
                                        required
                                        className="h-11 text-xs font-bold uppercase pl-9 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                                    />
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Security PIN</label>
                                <div className="relative">
                                    <Input
                                        type="password"
                                        placeholder="1234"
                                        maxLength={4}
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                        required
                                        className="h-11 text-xs font-bold pl-9 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 tracking-[0.5em]"
                                    />
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Email Address</label>
                            <div className="relative">
                                <Input
                                    type="email"
                                    placeholder="operator@vector.net"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-11 text-xs font-bold pl-9 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                                />
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Account Password</label>
                            <Input
                                type="password"
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-11 text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-indigo-600 dark:bg-indigo-500 text-white font-black uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none transition-all group"
                            isLoading={loading}
                        >
                            <span className="flex items-center gap-2">
                                Register Now
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </Button>
                    </form>

                    <div className="pt-4 border-t border-slate-50 dark:border-slate-800 text-center">
                        <Link to="/login" className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
                            Already Registered? Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
