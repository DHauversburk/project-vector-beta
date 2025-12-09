import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Link, useNavigate } from 'react-router-dom';
import { QrCode, Mail, Smartphone } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
    const [mode, setMode] = useState<'token' | 'email'>('token');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let loginEmail = email;
            let loginPassword = password;

            if (mode === 'token') {
                // Prototype Logic: Map Token to Email
                const tokenMap: Record<string, string> = {
                    'PATIENT-01': 'patient01@example.com',
                    'DOC-MH': 'docmh@example.com',
                    'COMMAND-01': 'admin@example.com'
                };

                const key = token.trim().toUpperCase();
                const mappedEmail = tokenMap[key];

                if (!mappedEmail) {
                    throw new Error('Invalid Token. Try PATIENT-01');
                }
                loginEmail = mappedEmail;
                loginPassword = 'password123'; // Hardcoded for prototype
            }

            const { error } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password: loginPassword,
            });

            if (error) throw error;
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-sm mx-auto p-4 sm:p-6">
            <div className="flex justify-center space-x-2 mb-6">
                <button
                    type="button"
                    onClick={() => setMode('token')}
                    className={`flex flex-1 items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'token' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                    <QrCode className="w-4 h-4 mr-2" />
                    Scan / Token
                </button>
                <button
                    type="button"
                    onClick={() => setMode('email')}
                    className={`flex flex-1 items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'email' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                    <Mail className="w-4 h-4 mr-2" />
                    Email Login
                </button>
            </div>

            <div className="space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    {mode === 'token' ? 'Identify Yourself' : 'Welcome Back'}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {mode === 'token' ? 'Scan your QR code or enter your token ID' : 'Enter your credentials to continue'}
                </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
                {mode === 'email' ? (
                    <div className="space-y-4">
                        <Input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="relative">
                            <Input
                                type="text"
                                placeholder="ENTER TOKEN ID"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="text-center text-xl tracking-widest uppercase font-mono py-6"
                                autoFocus
                            />
                            <Smartphone className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 opacity-50" />
                        </div>
                        <div className="p-4 border-2 border-dashed border-muted rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-muted/20">
                            <QrCode className="w-8 h-8 mb-2 opacity-50" />
                            <span className="text-xs">QR Scanner Simulator Active</span>
                        </div>
                    </div>
                )}

                {error && <p className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded">{error}</p>}

                <Button type="submit" className="w-full h-11 text-base" isLoading={loading}>
                    {mode === 'token' ? 'Verify Identity' : 'Sign In'}
                </Button>

                {mode === 'email' && (
                    <p className="text-center text-sm text-muted-foreground mt-4">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary hover:underline">
                            Register
                        </Link>
                    </p>
                )}
            </form>
        </div>
    );
}
