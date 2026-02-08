/**
 * LandingPage - Entry point with clear user type selection
 * 
 * @component
 * @description The first page users see, helping them identify the right
 * login flow based on their role. Mobile-first responsive design.
 * 
 * User Types:
 * - Patients: Have an appointment card with a token
 * - Providers: Healthcare staff with email credentials
 * - Admins: System administrators
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CreditCard,
    Stethoscope,
    Shield,
    ChevronRight,
    Activity,
    HelpCircle
} from 'lucide-react';

// Boot sequence for landing page
const bootSteps = [
    { id: 'background', delay: 0 },
    { id: 'logo', delay: 200 },
    { id: 'title', delay: 400 },
    { id: 'cards', delay: 600 },
    { id: 'footer', delay: 900 },
];

export default function LandingPage() {
    const navigate = useNavigate();
    const [loadedElements, setLoadedElements] = useState<Set<string>>(new Set());
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);

    // Check if boot has been seen this session
    useEffect(() => {
        const hasBooted = sessionStorage.getItem('VECTOR_LANDING_BOOTED');
        if (hasBooted) {
            bootSteps.forEach(step => {
                setLoadedElements(prev => new Set([...prev, step.id]));
            });
        } else {
            bootSteps.forEach(step => {
                setTimeout(() => {
                    setLoadedElements(prev => new Set([...prev, step.id]));
                }, step.delay);
            });
            sessionStorage.setItem('VECTOR_LANDING_BOOTED', 'true');
        }
    }, []);

    const isLoaded = (id: string) => loadedElements.has(id);

    // Entry point cards configuration
    const entryPoints = [
        {
            id: 'patient',
            title: 'Patient Access',
            subtitle: 'I have an Appointment Card',
            description: 'Enter with your Clinical Identity Token',
            icon: CreditCard,
            gradient: 'from-blue-600 to-cyan-500',
            bgHover: 'hover:bg-blue-950/40',
            borderColor: 'border-blue-500/30 hover:border-blue-400',
            primary: true,
            route: '/login?mode=patient',
            badge: 'Most Common',
        },
        {
            id: 'provider',
            title: 'Healthcare Provider',
            subtitle: 'Staff & Clinical Team',
            description: 'Sign in with your credentials',
            icon: Stethoscope,
            gradient: 'from-emerald-600 to-teal-500',
            bgHover: 'hover:bg-emerald-950/40',
            borderColor: 'border-emerald-500/30 hover:border-emerald-400',
            primary: false,
            route: '/login?mode=staff',
            badge: null,
        },
        {
            id: 'admin',
            title: 'Administration',
            subtitle: 'System Management',
            description: 'Access admin portal',
            icon: Shield,
            gradient: 'from-purple-600 to-pink-500',
            bgHover: 'hover:bg-purple-950/40',
            borderColor: 'border-purple-500/30 hover:border-purple-400',
            primary: false,
            route: '/login?mode=admin',
            badge: null,
        },
    ];

    return (
        <div className="min-h-screen relative flex flex-col items-center justify-center p-6 overflow-hidden bg-slate-950">
            {/* Background */}
            <div className={`absolute inset-0 transition-opacity duration-700 ${isLoaded('background') ? 'opacity-100' : 'opacity-0'}`}>
                {/* Gradient orbs */}
                <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full opacity-30 blur-3xl bg-blue-600" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl bg-purple-600" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10 blur-3xl bg-cyan-500" />

                {/* Grid */}
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}
                />

                {/* Top bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />
            </div>

            {/* Main Content */}
            <div className="w-full max-w-lg relative z-10 my-auto">

                {/* Logo */}
                <div className={`text-center mb-8 transition-all duration-500 ${isLoaded('logo') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-50" />
                        <div className="relative w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center shadow-2xl">
                            <img
                                src="/pwa-192x192.png"
                                alt="Vector"
                                className="w-10 h-10"
                            />
                        </div>
                    </div>
                </div>

                {/* Title */}
                <div className={`text-center mb-10 transition-all duration-500 ${isLoaded('title') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <h1 className="text-3xl font-black tracking-[0.15em] uppercase mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Project Vector
                    </h1>
                    <p className="text-slate-400 text-sm font-medium mb-4">
                        Secure Clinical Scheduling Platform
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <span className="h-px w-8 bg-slate-700" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                            Select Access Type
                        </span>
                        <span className="h-px w-8 bg-slate-700" />
                    </div>
                </div>

                {/* Entry Point Cards - Vertical Stack */}
                <div className={`space-y-4 mb-8 transition-all duration-500 ${isLoaded('cards') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    {entryPoints.map((entry) => {
                        const isHovered = hoveredCard === entry.id;
                        const Icon = entry.icon;

                        return (
                            <button
                                key={entry.id}
                                onClick={() => navigate(entry.route)}
                                onMouseEnter={() => setHoveredCard(entry.id)}
                                onMouseLeave={() => setHoveredCard(null)}
                                className={`
                                    w-full relative flex items-center gap-4 p-5 rounded-xl 
                                    bg-slate-900/80 backdrop-blur-sm border transition-all duration-200
                                    ${entry.borderColor} ${entry.bgHover}
                                    ${isHovered ? 'scale-[1.02] shadow-xl' : 'shadow-lg'}
                                    ${entry.primary ? 'ring-1 ring-blue-500/20' : ''}
                                `}
                            >
                                {/* Badge */}
                                {entry.badge && (
                                    <span className="absolute -top-2 right-4 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full">
                                        {entry.badge}
                                    </span>
                                )}

                                {/* Icon */}
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${entry.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 text-left min-w-0">
                                    <h3 className="text-base font-bold text-white mb-0.5">
                                        {entry.title}
                                    </h3>
                                    <p className="text-xs text-slate-400 truncate">
                                        {entry.subtitle} • {entry.description}
                                    </p>
                                </div>

                                {/* Arrow */}
                                <ChevronRight className={`w-5 h-5 text-slate-500 flex-shrink-0 transition-transform duration-200 ${isHovered ? 'translate-x-1 text-white' : ''}`} />
                            </button>
                        );
                    })}
                </div>

                {/* Help Link */}
                <div className={`text-center transition-all duration-500 ${isLoaded('footer') ? 'opacity-100' : 'opacity-0'}`}>
                    <button
                        onClick={() => navigate('/login?help=token')}
                        className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-blue-400 transition-colors mb-6"
                    >
                        <HelpCircle className="w-4 h-4" />
                        <span>I don't know which option to choose</span>
                    </button>

                    {/* Security Footer */}
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Activity className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                            Zero PHI • FIPS-140 • AES-256
                        </span>
                    </div>
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider">
                        Authorized Use Only • v2.0.0-beta
                    </p>
                </div>
            </div>
        </div>
    );
}
