/**
 * DeviceContext - Adaptive Device Detection & Layout Management
 * 
 * @component
 * @description Automatically detects the user's device type (mobile, tablet, desktop)
 * and screen orientation to provide context for adaptive layouts throughout the app.
 * 
 * Features:
 * - Auto-detection based on screen width and user agent
 * - Real-time updates on resize/orientation change
 * - Touch device detection
 * - Manual override option for user preference
 * 
 * @example
 * // In a component
 * const { device, isMobile, isTouch } = useDevice();
 * 
 * return isMobile ? <MobileLayout /> : <DesktopLayout />;
 * 
 * @troubleshooting
 * - If device is always 'desktop': Check if window is defined (SSR issue)
 * - If changes aren't detected: Ensure DeviceProvider wraps your app
 */

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useLayoutEffect, useCallback, type ReactNode } from 'react';
import type { DeviceType, Orientation, DeviceState, DeviceContextValue } from './deviceTypes';

// Re-export types for convenience (needed for consumers who import from this file)
export type { DeviceType, Orientation, DeviceState, DeviceContextValue } from './deviceTypes';

// --- Breakpoints (aligned with Tailwind defaults) ---
const BREAKPOINTS = {
    mobile: 640,   // < 640px = mobile
    tablet: 1024,  // 640-1024px = tablet
    desktop: 1024, // > 1024px = desktop
} as const;

// --- Storage Key ---
const STORAGE_KEY = 'vector-device-override';

// --- Context ---
const DeviceContext = createContext<DeviceContextValue | null>(null);

// --- Helper Functions ---

/**
 * Detect device type from screen width
 */
function detectDeviceFromWidth(width: number): DeviceType {
    if (width < BREAKPOINTS.mobile) return 'mobile';
    if (width < BREAKPOINTS.tablet) return 'tablet';
    return 'desktop';
}

/**
 * Detect if device supports touch input
 */
function detectTouchDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Detect orientation from screen dimensions
 */
function detectOrientation(width: number, height: number): Orientation {
    return width >= height ? 'landscape' : 'portrait';
}

/**
 * Get stored override from localStorage
 */
function getStoredOverride(): DeviceType | null {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && ['mobile', 'tablet', 'desktop'].includes(stored)) {
            return stored as DeviceType;
        }
    } catch {
        // localStorage might be blocked
    }
    return null;
}

/**
 * Store override in localStorage
 */
function storeOverride(device: DeviceType | null): void {
    if (typeof window === 'undefined') return;
    try {
        if (device) {
            localStorage.setItem(STORAGE_KEY, device);
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    } catch {
        // localStorage might be blocked
    }
}

// --- Provider Component ---

interface DeviceProviderProps {
    children: ReactNode;
}

export function DeviceProvider({ children }: DeviceProviderProps) {
    // Initialize state with current window dimensions (or defaults for SSR)
    const [state, setState] = useState<DeviceState>(() => {
        const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
        const height = typeof window !== 'undefined' ? window.innerHeight : 768;

        return {
            device: detectDeviceFromWidth(width),
            orientation: detectOrientation(width, height),
            isTouchDevice: detectTouchDevice(),
            overrideDevice: getStoredOverride(),
            screenWidth: width,
            screenHeight: height,
        };
    });

    // Handle window resize
    const handleResize = useCallback(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        setState(prev => ({
            ...prev,
            device: detectDeviceFromWidth(width),
            orientation: detectOrientation(width, height),
            screenWidth: width,
            screenHeight: height,
        }));
    }, []);

    // Set up resize listener
    useEffect(() => {
        // Debounced resize handler for performance
        let timeoutId: ReturnType<typeof setTimeout>;

        const debouncedResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(handleResize, 100);
        };

        window.addEventListener('resize', debouncedResize);
        window.addEventListener('orientationchange', handleResize);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', debouncedResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, [handleResize]);

    // Initial detection - use layout effect to sync before paint
    useLayoutEffect(() => {
        handleResize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Override setter
    const setOverride = useCallback((device: DeviceType | null) => {
        storeOverride(device);
        setState(prev => ({ ...prev, overrideDevice: device }));
    }, []);

    // Compute derived values
    const effectiveDevice = state.overrideDevice ?? state.device;
    const isMobile = effectiveDevice === 'mobile';
    const isTablet = effectiveDevice === 'tablet';
    const isDesktop = effectiveDevice === 'desktop';

    const value: DeviceContextValue = {
        ...state,
        effectiveDevice,
        isMobile,
        isTablet,
        isDesktop,
        setOverride,
    };

    return (
        <DeviceContext.Provider value={value}>
            {children}
        </DeviceContext.Provider>
    );
}

// --- Hook ---

/**
 * Access device detection context
 * 
 * @returns DeviceContextValue with device info and helpers
 * @throws Error if used outside DeviceProvider
 * 
 * @example
 * const { isMobile, isTouch, effectiveDevice } = useDevice();
 */
export function useDevice(): DeviceContextValue {
    const context = useContext(DeviceContext);

    if (!context) {
        throw new Error('useDevice must be used within a DeviceProvider');
    }

    return context;
}

// --- Export default for lazy loading ---
export default DeviceProvider;
