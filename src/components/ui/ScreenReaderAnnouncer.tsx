/**
 * ScreenReaderAnnouncer - Announces dynamic content changes to screen readers
 * 
 * @component
 * @description Creates an ARIA live region for screen reader announcements.
 * Use the `announce` function to notify users of dynamic content changes,
 * such as booking confirmations, errors, or navigation updates.
 * 
 * This is essential for WCAG 2.1 AA compliance when content changes
 * dynamically without a full page reload.
 * 
 * @example
 * // Using the hook
 * const { announce } = useAnnouncer();
 * announce('Appointment booked successfully');
 * 
 * // For assertive announcements (interrupts current speech)
 * announce('Error: Unable to book appointment', 'assertive');
 * 
 * @troubleshooting
 * - Announcements not heard: Ensure AnnouncerProvider is at app root
 * - Multiple announcements: Add small delays between rapid announcements
 * - Not working in Safari: VoiceOver may need additional testing
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface AnnouncerContextType {
    announce: (message: string, politeness?: 'polite' | 'assertive') => void;
}

const AnnouncerContext = createContext<AnnouncerContextType | null>(null);

/**
 * Hook to access the screen reader announcer
 * @returns Object containing the announce function
 */
export function useAnnouncer() {
    const context = useContext(AnnouncerContext);
    if (!context) {
        // Return a no-op if used outside provider (graceful degradation)
        return { announce: () => { } };
    }
    return context;
}

interface AnnouncerProviderProps {
    children: ReactNode;
}

/**
 * Provider component that creates ARIA live regions for screen reader announcements.
 * Should wrap the entire application, typically in App.tsx or main.tsx
 */
export function AnnouncerProvider({ children }: AnnouncerProviderProps) {
    const [politeMessage, setPoliteMessage] = useState('');
    const [assertiveMessage, setAssertiveMessage] = useState('');

    const announce = useCallback((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
        // Clear first to ensure screen readers pick up the new message
        // even if it's the same as the previous one
        if (politeness === 'assertive') {
            setAssertiveMessage('');
            setTimeout(() => setAssertiveMessage(message), 100);
        } else {
            setPoliteMessage('');
            setTimeout(() => setPoliteMessage(message), 100);
        }
    }, []);

    return (
        <AnnouncerContext.Provider value={{ announce }}>
            {children}

            {/* Screen Reader Only Live Regions */}
            {/* Polite - waits for current speech to finish */}
            <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
                style={{
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    padding: 0,
                    margin: '-1px',
                    overflow: 'hidden',
                    clip: 'rect(0, 0, 0, 0)',
                    whiteSpace: 'nowrap',
                    border: 0,
                }}
            >
                {politeMessage}
            </div>

            {/* Assertive - interrupts current speech */}
            <div
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
                className="sr-only"
                style={{
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    padding: 0,
                    margin: '-1px',
                    overflow: 'hidden',
                    clip: 'rect(0, 0, 0, 0)',
                    whiteSpace: 'nowrap',
                    border: 0,
                }}
            >
                {assertiveMessage}
            </div>
        </AnnouncerContext.Provider>
    );
}

export default AnnouncerProvider;
