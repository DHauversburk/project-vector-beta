import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// MOCK MODE FLAG - Auto-detect based on environment variables OR manual override
// When VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set, uses real Supabase
// Otherwise, falls back to Mock Mode for offline development/demo

// SAFETY: For Beta, Force Mock Mode unless explicit Live Access is granted via LocalStorage
const liveAccess = typeof window !== 'undefined' && window.localStorage.getItem('PROJECT_VECTOR_LIVE_ACCESS') === 'true';
export const IS_MOCK = !liveAccess || !supabaseUrl || !supabaseAnonKey;

// --- MOCK CLIENT IMPLEMENTATION ---

// Mock Event Emitter
// This system simulates Supabase's `onAuthStateChange` subscription model.
// When 'signInWithPassword' or 'signOut' is called in mock mode, we manually fire events
// to all registered listeners. This ensures the UI (AuthContext) updates immediately.
const mockAuthListeners: Array<(event: string, session: any) => void> = [];

const notifyListeners = (event: string, session: any) => {
    mockAuthListeners.forEach(cb => cb(event, session));
};

// State for Mock Session
let mockSession: any = null;

// Initialize from LocalStorage if available
if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem('PROJECT_VECTOR_MOCK_SESSION');
    if (stored) {
        try {
            mockSession = JSON.parse(stored);
        } catch (e) {
            console.error('Failed to restore mock session', e);
        }
    }
}

// --- MOCK CLIENT IMPLEMENTATION ---
const mockSupabase = {
    auth: {
        getSession: async () => ({
            data: {
                session: mockSession
            },
            error: null
        }),
        getUser: async () => ({
            data: { user: mockSession?.user ?? null },
            error: null
        }),
        signInWithPassword: async ({ email }: any) => {
            console.log('[MOCK] Sign In:', email);

            // Determine Role based on Email Pattern
            const isProvider = email.includes('provider') || email.includes('jameson') || email.includes('doc') || email.includes('jameson');
            const isAdmin = email.includes('admin') || email.includes('alex');

            let userId = 'mock-user-123';
            let tokenAlias = 'IVAN';

            if (isAdmin) {
                userId = 'mock-admin-alex';
                tokenAlias = 'CMD. ALEX';
            } else if (isProvider) {
                if (email.includes('blue')) {
                    userId = 'mock-provider-smith'; // Reuse existing mock ID for Smith
                    tokenAlias = 'DR. SMITH';
                } else if (email.includes('mh')) {
                    userId = 'mock-provider-mh';
                    tokenAlias = 'DR. MH';
                } else {
                    userId = 'mock-provider-jameson';
                    tokenAlias = 'DR. JAMESON';
                }
            } else {
                // Member Logic
                if (email.includes('patient01') || email.includes('8821')) {
                    userId = 'mock-user-8821';
                    tokenAlias = 'PATIENT ALPHA';
                } else if (email.includes('patient02') || email.includes('3392')) {
                    userId = 'mock-user-3392';
                    tokenAlias = 'PATIENT BRAVO';
                } else if (email.includes('patient03') || email.includes('1102')) {
                    userId = 'mock-user-1102';
                    tokenAlias = 'PATIENT CHARLIE';
                }
            }

            const user = {
                id: userId,
                email,
                user_metadata: { token_alias: tokenAlias }
            };
            const session = {
                access_token: 'mock-token',
                user
            };

            // Update local state and persist
            mockSession = session;
            if (typeof window !== 'undefined') {
                window.localStorage.setItem('PROJECT_VECTOR_MOCK_SESSION', JSON.stringify(session));
            }

            // CRITICAL: Notify listeners so AuthContext redirects immediately
            notifyListeners('SIGNED_IN', session);

            return {
                data: { user, session }, // Return valid session object so AuthContext can use it
                error: null
            };
        },
        signUp: async ({ email, options }: any) => {
            console.log('[MOCK] Sign Up:', email);
            const user = { id: 'mock-user-123', email, user_metadata: options?.data };
            const session = { access_token: 'mock-token', user };

            mockSession = session;
            notifyListeners('SIGNED_IN', session);

            return {
                data: { user, session },
                error: null
            };
        },
        signOut: async () => {
            console.log('[MOCK] Sign Out');
            mockSession = null;
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem('PROJECT_VECTOR_MOCK_SESSION');
            }
            notifyListeners('SIGNED_OUT', null);
            return { error: null };
        },
        onAuthStateChange: (callback: any) => {
            mockAuthListeners.push(callback);
            return {
                data: {
                    subscription: {
                        unsubscribe: () => {
                            const idx = mockAuthListeners.indexOf(callback);
                            if (idx > -1) mockAuthListeners.splice(idx, 1);
                        }
                    }
                }
            };
        }
    },
    from: (table: string) => {
        console.log(`[MOCK] DB Query on table: ${table}`);
        return {
            select: () => ({
                eq: (col: string, val: string) => ({
                    single: () => {
                        // Mock Profile Fetch
                        if (table === 'users' && col === 'id') {
                            if (val === 'mock-admin-alex') return { data: { role: 'admin' }, error: null };
                            if (val.includes('provider')) {
                                let st = 'MH_GREEN'; // Default to Jameson
                                if (val.includes('mh')) st = 'MH_GREEN';
                                else if (val.includes('smith') || val.includes('blue')) st = 'PRIMARY_BLUE';
                                else if (val.includes('taylor') || val.includes('pt')) st = 'PT_GOLD';
                                return { data: { role: 'provider', service_type: st }, error: null };
                            }
                            return { data: { role: 'member' }, error: null };
                        }
                        return { data: { role: 'member' }, error: null };
                    },
                    gte: () => ({
                        lte: () => ({
                            order: () => ({ data: [], error: null }) // Generic Empty List
                        })
                    })
                }),
                order: () => ({ data: [], error: null }),
                // Provider query specific:
                gte: () => ({
                    lte: () => ({
                        order: () => ({ data: [], error: null })
                    })
                })
            }),
            update: () => ({
                eq: () => ({
                    select: () => ({ single: () => ({ data: {}, error: null }) })
                })
            }),
            insert: () => ({
                select: () => ({ single: () => ({ data: {}, error: null }) })
            })
        };
    },
    rpc: async (fn: string, args: any) => {
        console.log(`[MOCK] RPC Call: ${fn}`, args);
        return { data: null, error: null };
    }
};

export const supabase = IS_MOCK ? (mockSupabase as any) : createClient(supabaseUrl, supabaseAnonKey);

if (IS_MOCK) {
    console.warn('⚠️ RUNNING IN MOCK MODE: Supabase keys missing. Using fake backend.');
}
