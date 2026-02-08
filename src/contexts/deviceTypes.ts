/**
 * Device Detection Types
 * 
 * Shared types for the DeviceContext
 */

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

export interface DeviceState {
    /** Auto-detected device type based on screen width */
    device: DeviceType;
    /** Current screen orientation */
    orientation: Orientation;
    /** Whether the device supports touch input */
    isTouchDevice: boolean;
    /** User's manual override (null = auto-detect) */
    overrideDevice: DeviceType | null;
    /** Current screen width in pixels */
    screenWidth: number;
    /** Current screen height in pixels */
    screenHeight: number;
}

export interface DeviceContextValue extends DeviceState {
    /** Effective device type (override or auto-detected) */
    effectiveDevice: DeviceType;
    /** Convenience: Is the effective device mobile? */
    isMobile: boolean;
    /** Convenience: Is the effective device tablet? */
    isTablet: boolean;
    /** Convenience: Is the effective device desktop? */
    isDesktop: boolean;
    /** Set manual device override */
    setOverride: (device: DeviceType | null) => void;
}
