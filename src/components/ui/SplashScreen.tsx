/**
 * SplashScreen - Cinematic introduction animation
 * 
 * @component
 * @description A dramatic, military-styled boot sequence that plays for
 * first-time visitors or on app initialization. Creates anticipation and
 * establishes the premium, secure nature of the application.
 * 
 * Features:
 * - Animated logo reveal with glow effect
 * - "System initialization" text sequence
 * - Progress bar with gradient fill
 * - Smooth transition to main content
 * 
 * @troubleshooting
 * - Animation not playing: Check if prefers-reduced-motion is enabled
 * - Stuck on splash: Verify onComplete callback is properly connected
 * - Performance issues: Reduce blur intensity on lower-end devices
 */

import React, { useState, useEffect } from 'react';
import { Shield, Lock, CheckCircle2, Zap } from 'lucide-react';
import { TACTICAL_TIPS } from '../../lib/constants';

interface SplashScreenProps {
    /** Callback when splash animation completes */
    onComplete: () => void;
    /** Minimum display time in ms (default: 3000) */
    minDuration?: number;
    /** Skip animation if user has seen it before */
    skipIfSeen?: boolean;
}

interface BootMessage {
    text: string;
    delay: number;
    icon?: 'shield' | 'lock' | 'check' | 'zap';
}

const bootSequence: BootMessage[] = [
    { text: 'INITIALIZING SECURE CONNECTION...', delay: 0, icon: 'shield' },
    { text: 'LOADING ENCRYPTION PROTOCOLS...', delay: 400, icon: 'lock' },
    { text: 'VERIFYING SYSTEM INTEGRITY...', delay: 800, icon: 'check' },
    { text: 'ESTABLISHING ZERO-TRUST LAYER...', delay: 1200, icon: 'zap' },
];

export const SplashScreen: React.FC<SplashScreenProps> = ({
    onComplete,
    minDuration = 2200, // Reduced from 3200
    skipIfSeen = false
}) => {
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);
    const [isExiting, setIsExiting] = useState(false);
    const [showLogo, setShowLogo] = useState(false);
    const [tipIndex] = useState(() => Math.floor(Math.random() * TACTICAL_TIPS.length));

    // Check if user has seen splash before
    useEffect(() => {
        if (skipIfSeen && localStorage.getItem('VECTOR_SPLASH_SEEN')) {
            onComplete();
            return;
        }
    }, [skipIfSeen, onComplete]);

    // Logo reveal animation
    useEffect(() => {
        const timer = setTimeout(() => setShowLogo(true), 200);
        return () => clearTimeout(timer);
    }, []);

    // Progress bar animation
    useEffect(() => {
        const duration = minDuration;
        const interval = 30;
        const steps = duration / interval;
        let currentProgress = 0;

        const timer = setInterval(() => {
            currentProgress += 100 / steps;
            setProgress(Math.min(currentProgress, 100));

            if (currentProgress >= 100) {
                clearInterval(timer);
            }
        }, interval);

        return () => clearInterval(timer);
    }, [minDuration]);

    // Boot sequence messages
    useEffect(() => {
        bootSequence.forEach((msg, index) => {
            setTimeout(() => {
                setCurrentStep(index + 1);
            }, msg.delay);
        });
    }, []);

    // Exit animation and callback
    useEffect(() => {
        const exitTimer = setTimeout(() => {
            setIsExiting(true);
            localStorage.setItem('VECTOR_SPLASH_SEEN', 'true');

            setTimeout(() => {
                onComplete();
            }, 500);
        }, minDuration);

        return () => clearTimeout(exitTimer);
    }, [minDuration, onComplete]);

    const getIcon = (icon?: string) => {
        switch (icon) {
            case 'shield': return <Shield className="w-3 h-3" />;
            case 'lock': return <Lock className="w-3 h-3" />;
            case 'check': return <CheckCircle2 className="w-3 h-3" />;
            case 'zap': return <Zap className="w-3 h-3" />;
            default: return null;
        }
    };

    return (
        <div
            className={`
                fixed inset-0 z-[9999] flex flex-col items-center justify-center
                bg-slate-950 transition-opacity duration-500
                ${isExiting ? 'opacity-0' : 'opacity-100'}
            `}
        >
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Scanning line effect */}
                <div
                    className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"
                    style={{
                        top: `${(progress * 1.2) % 120}%`,
                        transition: 'top 0.1s linear'
                    }}
                />

                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}
                />

                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-blue-500/30" />
                <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-blue-500/30" />
                <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-purple-500/30" />
                <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-purple-500/30" />
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center">

                {/* Logo with glow */}
                <div
                    className={`
                        relative mb-8 transition-all duration-1000
                        ${showLogo ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
                    `}
                >
                    {/* Glow effect */}
                    <div className="absolute inset-0 vector-gradient rounded-3xl blur-2xl opacity-40 animate-pulse" style={{ animationDuration: '2s' }} />

                    {/* Logo container */}
                    <div className="relative w-24 h-24 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 flex items-center justify-center shadow-2xl">
                        <img
                            src="/pwa-192x192.png"
                            alt="Project Vector"
                            className="w-14 h-14 drop-shadow-lg"
                        />
                    </div>
                </div>

                {/* Title */}
                <h1
                    className={`
                        text-4xl font-black tracking-[0.3em] uppercase mb-2
                        vector-gradient-text transition-all duration-700 delay-300
                        ${showLogo ? 'opacity-100' : 'opacity-0'}
                    `}
                >
                    VECTOR
                </h1>

                <p
                    className={`
                        text-xs font-bold uppercase tracking-[0.4em] text-slate-500 mb-12
                        transition-all duration-700 delay-500
                        ${showLogo ? 'opacity-100' : 'opacity-0'}
                    `}
                >
                    Secure Clinical Platform
                </p>

                {/* Progress Bar */}
                <div className="w-64 mb-8">
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full vector-gradient rounded-full transition-all duration-100 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2">
                        <span className="text-[10px] font-mono text-slate-600">
                            {Math.round(progress)}%
                        </span>
                        <span className="text-[10px] font-mono text-slate-600">
                            LOADING
                        </span>
                    </div>
                </div>

                {/* Boot Sequence Messages */}
                <div className="w-80 space-y-2">
                    {bootSequence.slice(0, currentStep).map((msg, index) => (
                        <div
                            key={index}
                            className={`
                                flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider
                                animate-fade-in
                                ${index === currentStep - 1 ? 'text-blue-400' : 'text-slate-600'}
                            `}
                        >
                            <span className={index === currentStep - 1 ? 'text-blue-400' : 'text-emerald-500'}>
                                {getIcon(msg.icon)}
                            </span>
                            <span>{msg.text}</span>
                            {index < currentStep - 1 && (
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 ml-auto" />
                            )}
                            {index === currentStep - 1 && (
                                <span className="ml-auto flex gap-1">
                                    <span className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-4">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-500">
                    <p className="max-w-xs text-center text-[10px] font-bold uppercase tracking-widest text-blue-400/80 leading-relaxed px-4">
                        <span className="text-blue-500 mr-2">PRO-TIP:</span>
                        {TACTICAL_TIPS[tipIndex]}
                    </p>
                </div>

                <div className="flex items-center gap-6 text-[9px] font-mono uppercase tracking-widest text-slate-700">
                    <span>FIPS-140 COMPLIANT</span>
                    <span className="w-1 h-1 bg-slate-700 rounded-full" />
                    <span>ZERO PHI ARCHITECTURE</span>
                    <span className="w-1 h-1 bg-slate-700 rounded-full" />
                    <span>AES-256 ENCRYPTION</span>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
