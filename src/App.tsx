/**
 * App - Root application component
 * 
 * @component
 * @description The main application entry point with routing, authentication,
 * and theme management. Features a new landing page for user type selection.
 * 
 * Routes:
 * - / → LandingPage (user type selection)
 * - /login → LoginPage (token/email auth)
 * - /register → RegisterPage
 * - /dashboard → Dashboard (protected)
 * 
 * @troubleshooting
 * - Auth not working: Verify Supabase configuration in lib/supabase.ts
 * - Theme not applying: Check ThemeProvider and localStorage
 * - Dark mode not default: Verify defaultTheme="dark" in ThemeProvider
 */

import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DeviceProvider } from './contexts/DeviceContext';
import { PWAManager } from './components/ui/PWAManager';
import { SystemStatusBar } from './components/SystemStatusBar';
import { FeedbackWidget } from './components/ui/FeedbackWidget';
import { OnboardingProvider } from './contexts/OnboardingContext';
import { OfflineProvider } from './contexts/OfflineContext';
import { TourTooltip } from './components/onboarding/TourTooltip';
import { LoadingState } from './components/ui/LoadingState';
import { AnnouncerProvider } from './components/ui/ScreenReaderAnnouncer';

// --- LAZY-LOADED PAGES ---
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

/**
 * Standard Loading Spinner for Suspense fallbacks
 */
const LoadingFallback = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <LoadingState message="CONNECTING TO CORE..." />
  </div>
);

/**
 * Protected route wrapper - redirects to landing if not authenticated
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, pinVerified } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingState message="AUTHENTICATING OPERATOR..." />
      </div>
    );
  }

  if (!session || !pinVerified) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

/**
 * Main App component with routing
 */
function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <DeviceProvider>
          <AuthProvider>
            <OfflineProvider>
              <OnboardingProvider>
                <AnnouncerProvider>
                  <SystemStatusBar />
                  <PWAManager />
                  <FeedbackWidget />
                  <TourTooltip />
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />

                      {/* Protected Routes */}
                      <Route path="/dashboard" element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      } />

                      {/* Fallback - redirect unknown routes to landing */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </AnnouncerProvider>
              </OnboardingProvider>
            </OfflineProvider>
          </AuthProvider>
        </DeviceProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
