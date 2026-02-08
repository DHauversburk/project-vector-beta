import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

// Tour step definition
export interface TourStep {
    id: string;
    targetSelector: string;
    title: string;
    description: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

// Pre-defined tour sequences for each role
// eslint-disable-next-line react-refresh/only-export-components
export const TOUR_SEQUENCES: Record<string, TourStep[]> = {
    member: [
        {
            id: 'welcome',
            targetSelector: '[data-tour="dashboard-title"]',
            title: 'Welcome to Project Vector! 👋',
            description: 'This is your secure patient portal. Let\'s take a quick tour to help you get started.',
            position: 'bottom'
        },
        {
            id: 'nav-overview',
            targetSelector: '[data-tour="nav-overview"]',
            title: 'Dashboard Overview',
            description: 'Here you can see your upcoming appointments and quick actions at a glance.',
            position: 'right'
        },
        {
            id: 'nav-book',
            targetSelector: '[data-tour="nav-book"]',
            title: 'Book an Appointment',
            description: 'Click here to find and book available appointment slots.',
            position: 'right'
        },
        {
            id: 'nav-appointments',
            targetSelector: '[data-tour="nav-appointments"]',
            title: 'Your Appointments',
            description: 'View all your scheduled appointments here.',
            position: 'right'
        },
        {
            id: 'feedback',
            targetSelector: '[data-tour="feedback-button"]',
            title: 'Send Us Feedback',
            description: 'Found an issue or have a suggestion? Click this button anytime to let us know!',
            position: 'left'
        }
    ],
    provider: [
        {
            id: 'welcome',
            targetSelector: '[data-tour="dashboard-title"]',
            title: 'Welcome, Provider! 🩺',
            description: 'This is your clinical management dashboard. Let\'s explore your tools for managing appointments and patient care.',
            position: 'bottom'
        },
        {
            id: 'nav-overview',
            targetSelector: '[data-tour="nav-overview"]',
            title: 'Dashboard Overview',
            description: 'Your home base. See today\'s schedule, upcoming appointments, and quick stats at a glance.',
            position: 'right'
        },
        {
            id: 'nav-schedule',
            targetSelector: '[data-tour="nav-schedule"]',
            title: '📅 Schedule Management',
            description: 'Create and manage your availability. Use Auto-Generate to quickly create slots for multiple days.',
            position: 'right'
        },
        {
            id: 'nav-patients',
            targetSelector: '[data-tour="nav-patients"]',
            title: '👥 Patient List',
            description: 'View all your assigned patients and their appointment history. Generate new patient tokens here.',
            position: 'right'
        },
        {
            id: 'nav-logs',
            targetSelector: '[data-tour="nav-logs"]',
            title: '📝 Clinical Logs',
            description: 'Access all your quick notes and encounter documentation in one place.',
            position: 'right'
        },
        {
            id: 'nav-analytics',
            targetSelector: '[data-tour="nav-analytics"]',
            title: '📊 Analytics Dashboard',
            description: 'Track your appointment metrics, completion rates, and patient satisfaction scores.',
            position: 'right'
        },
        {
            id: 'nav-security',
            targetSelector: '[data-tour="nav-security"]',
            title: '🔒 Security Settings',
            description: 'Manage your security preferences, session settings, and access logs.',
            position: 'right'
        },
        {
            id: 'quick-note',
            targetSelector: '[data-tour="quick-note"]',
            title: '⚡ Quick Notes',
            description: 'Click this button anytime to create a quick clinical note. Notes are encrypted and stored securely.',
            position: 'left'
        },
        {
            id: 'feedback',
            targetSelector: '[data-tour="feedback-button"]',
            title: '💬 Beta Feedback',
            description: 'Help us improve! Share your feedback on the interface, features, or any issues you encounter.',
            position: 'left'
        }
    ],
    admin: [
        {
            id: 'welcome',
            targetSelector: '[data-tour="dashboard-title"]',
            title: 'Admin Command Center 🎛️',
            description: 'Full system control at your fingertips.',
            position: 'bottom'
        },
        {
            id: 'tokens',
            targetSelector: '[data-tour="nav-tokens"]',
            title: 'Token Station',
            description: 'Generate and manage patient access tokens here.',
            position: 'right'
        },
        {
            id: 'logs',
            targetSelector: '[data-tour="nav-logs"]',
            title: 'Audit Logs',
            description: 'View all system activity and security events.',
            position: 'right'
        }
    ]
};

interface OnboardingContextType {
    // State
    isActive: boolean;
    currentStep: number;
    currentTour: TourStep[];

    // Actions
    startTour: (role: string) => void;
    nextStep: () => void;
    prevStep: () => void;
    skipTour: () => void;
    completeTour: () => void;

    // Utils
    hasCompletedTour: (role: string) => boolean;
    resetTourProgress: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

const STORAGE_KEY = 'vector_onboarding_completed';

/**
 * Onboarding Provider - Manages tour state and progress
 * 
 * Wrap your app with this provider to enable onboarding tours.
 */
export function OnboardingProvider({ children }: { children: ReactNode }) {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [currentTour, setCurrentTour] = useState<TourStep[]>([]);
    const [completedTours, setCompletedTours] = useState<Set<string>>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch {
            return new Set();
        }
    });

    // Persist completed tours
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...completedTours]));
    }, [completedTours]);

    const hasCompletedTour = useCallback((role: string): boolean => {
        return completedTours.has(role);
    }, [completedTours]);

    const startTour = useCallback((role: string) => {
        const steps = TOUR_SEQUENCES[role];
        if (!steps || steps.length === 0) return;

        setCurrentTour(steps);
        setCurrentStep(0);
        setIsActive(true);
    }, []);

    const nextStep = useCallback(() => {
        if (currentStep < currentTour.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            // Tour complete
            setIsActive(false);
        }
    }, [currentStep, currentTour.length]);

    const prevStep = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    }, [currentStep]);

    const skipTour = useCallback(() => {
        setIsActive(false);
        setCurrentStep(0);
    }, []);

    const completeTour = useCallback(() => {
        if (currentTour.length > 0) {
            // Find which role this tour belongs to
            for (const [role, steps] of Object.entries(TOUR_SEQUENCES)) {
                if (steps === currentTour) {
                    setCompletedTours(prev => new Set([...prev, role]));
                    break;
                }
            }
        }
        setIsActive(false);
        setCurrentStep(0);
    }, [currentTour]);

    const resetTourProgress = useCallback(() => {
        setCompletedTours(new Set());
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return (
        <OnboardingContext.Provider
            value={{
                isActive,
                currentStep,
                currentTour,
                startTour,
                nextStep,
                prevStep,
                skipTour,
                completeTour,
                hasCompletedTour,
                resetTourProgress
            }}
        >
            {children}
        </OnboardingContext.Provider>
    );
}

/**
 * Hook to access onboarding context
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error('useOnboarding must be used within OnboardingProvider');
    }
    return context;
}
