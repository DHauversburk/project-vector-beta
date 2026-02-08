import { useEffect, useRef, useCallback } from 'react';

/**
 * useFocusTrap - Traps tab focus within a container element
 * 
 * WCAG 2.1 AA Requirement: 2.1.2 No Keyboard Trap (with intentional exception for modals)
 * This hook ensures users can navigate within modals but not accidentally leave them.
 * Pressing Escape allows exiting (handled by onEscape callback).
 * 
 * @param isActive - Whether the focus trap should be active
 * @param options - Configuration options
 */
export function useFocusTrap(
    isActive: boolean,
    options?: {
        onEscape?: () => void;
        initialFocusRef?: React.RefObject<HTMLElement | null>;
        returnFocusOnDeactivate?: boolean;
    }
) {
    const containerRef = useRef<HTMLDivElement>(null);
    const previousActiveElementRef = useRef<Element | null>(null);

    const { onEscape, initialFocusRef, returnFocusOnDeactivate = true } = options || {};

    // Get all focusable elements within container
    const getFocusableElements = useCallback(() => {
        if (!containerRef.current) return [];

        const focusableSelectors = [
            'a[href]:not([disabled]):not([tabindex="-1"])',
            'button:not([disabled]):not([tabindex="-1"])',
            'textarea:not([disabled]):not([tabindex="-1"])',
            'input:not([disabled]):not([tabindex="-1"]):not([type="hidden"])',
            'select:not([disabled]):not([tabindex="-1"])',
            '[tabindex]:not([tabindex="-1"]):not([disabled])',
            '[contenteditable="true"]'
        ].join(', ');

        return Array.from(
            containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
        ).filter(el => {
            // Ensure element is visible
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden';
        });
    }, []);

    // Handle tab key navigation
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!isActive || !containerRef.current) return;

        // Handle Escape key
        if (event.key === 'Escape' && onEscape) {
            event.preventDefault();
            event.stopPropagation();
            onEscape();
            return;
        }

        // Handle Tab key
        if (event.key === 'Tab') {
            const focusableElements = getFocusableElements();
            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            // Shift + Tab: wrap to last element
            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
                return;
            }

            // Tab: wrap to first element
            if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
                return;
            }
        }
    }, [isActive, onEscape, getFocusableElements]);

    // Set up focus trap when active
    useEffect(() => {
        if (!isActive) return;

        // Store the currently focused element
        previousActiveElementRef.current = document.activeElement;

        // Focus the initial element or first focusable element
        const focusInitialElement = () => {
            if (initialFocusRef?.current) {
                initialFocusRef.current.focus();
            } else {
                const focusableElements = getFocusableElements();
                if (focusableElements.length > 0) {
                    focusableElements[0].focus();
                } else if (containerRef.current) {
                    containerRef.current.focus();
                }
            }
        };

        // Delay focus to ensure modal is rendered
        const timeoutId = setTimeout(focusInitialElement, 10);

        // Add event listeners
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('keydown', handleKeyDown);

            // Return focus to previous element
            if (returnFocusOnDeactivate && previousActiveElementRef.current instanceof HTMLElement) {
                previousActiveElementRef.current.focus();
            }
        };
    }, [isActive, handleKeyDown, initialFocusRef, getFocusableElements, returnFocusOnDeactivate]);

    return containerRef;
}

/**
 * FocusTrap Component - Wrapper component for focus trap functionality
 * 
 * Usage:
 * <FocusTrap isActive={isModalOpen} onEscape={closeModal}>
 *   <ModalContent />
 * </FocusTrap>
 */
interface FocusTrapProps {
    isActive: boolean;
    onEscape?: () => void;
    initialFocusRef?: React.RefObject<HTMLElement | null>;
    children: React.ReactNode;
    className?: string;
}

export function FocusTrap({
    isActive,
    onEscape,
    initialFocusRef,
    children,
    className
}: FocusTrapProps) {
    const containerRef = useFocusTrap(isActive, { onEscape, initialFocusRef });

    return (
        <div
            ref={containerRef}
            tabIndex={-1}
            className={className}
            role="dialog"
            aria-modal="true"
        >
            {children}
        </div>
    );
}
