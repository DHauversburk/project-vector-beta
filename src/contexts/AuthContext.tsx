import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type UserRole = 'member' | 'provider' | 'admin' | null;

type AuthContextType = {
    session: Session | null;
    user: User | null;
    role: UserRole;
    loading: boolean;
    pinVerified: boolean;
    verifyPin: () => void;
    signOut: () => Promise<void>;
    supabase: typeof supabase;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>(null);
    const [loading, setLoading] = useState(true);
    const [pinVerified, setPinVerified] = useState(() => {
        try {
            return sessionStorage.getItem('vector_pin_verified') === 'true';
        } catch {
            return false;
        }
    });

    const verifyPin = () => {
        setPinVerified(true);
        sessionStorage.setItem('vector_pin_verified', 'true');
    };

    const fetchProfile = async (userId: string, currentUser: User) => {
        console.log('[AuthContext] Fetching profile for userId:', userId);
        try {
            const { data, error } = await (supabase
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .from('users') as any)
                .select('role, token_alias, service_type')
                .eq('id', userId)
                .single();

            console.log('[AuthContext] Profile query result:', { data, error });

            if (error) {
                console.error('[AuthContext] Error fetching profile:', error);
                setRole('member');
            } else if (data) {
                console.log('[AuthContext] Setting role to:', data.role);
                setRole(data.role as UserRole);
                // Enrich user object with profile data
                if (currentUser) {
                    currentUser.user_metadata = {
                        ...currentUser.user_metadata,
                        token_alias: data.token_alias,
                        service_type: data.service_type,
                        role: data.role
                    };
                    setUser({ ...currentUser });
                    console.log('[AuthContext] User metadata updated:', currentUser.user_metadata);
                }
            } else {
                console.log('[AuthContext] No data returned, defaulting to member');
                setRole('member');
            }
        } catch (err) {
            console.error('[AuthContext] Unexpected error fetching profile:', err);
            setRole('member');
        }
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id, session.user).then(() => {
                    // CRITICAL: Ensure loading is disabled after profile fetch
                    setLoading(false);

                });
            } else {
                setLoading(false);
            }
        }).catch((err: Error) => {
            console.error("Auth Session Error:", err);
            // SAFETY VALVE: Ensure we never get stuck on "Authenticating..."
            setLoading(false);
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id, session.user).then(() => {
                    // Slight delay to smoother transition in mock
                    setTimeout(() => setLoading(false), 300);
                });
            } else {
                setRole(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        sessionStorage.removeItem('vector_pin_verified');
        setPinVerified(false);
        setRole(null);
    };

    const value = {
        session,
        user,
        role,
        loading,
        pinVerified,
        verifyPin,
        signOut,
        supabase,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}



// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
