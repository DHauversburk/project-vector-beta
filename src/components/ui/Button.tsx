/**
 * Button Component - Enterprise-grade action button
 * 
 * @component
 * @description Primary interaction component used throughout Project Vector.
 * Supports multiple variants including gradient styling, loading states,
 * and various sizes optimized for both desktop and touch interfaces.
 * 
 * @example
 * // Primary gradient button
 * <Button variant="gradient" onClick={handleSubmit}>
 *   Confirm Booking
 * </Button>
 * 
 * @example
 * // With loading state
 * <Button isLoading={isSubmitting} variant="default">
 *   Processing...
 * </Button>
 * 
 * @example
 * // Outline variant
 * <Button variant="outline" size="lg">
 *   Cancel
 * </Button>
 * 
 * @troubleshooting
 * - Button appears unstyled: Ensure Tailwind CSS is properly configured
 * - Gradient not showing: Check that index.css gradient utilities are loaded
 * - Click handler not firing: Verify button is not disabled or in loading state
 * - For accessibility: Always provide descriptive text or aria-label
 */

import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

/**
 * Utility function to merge Tailwind classes safely
 * @param inputs - Class values to merge
 * @returns Merged class string
 */
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** Visual style variant */
    variant?: 'default' | 'gradient' | 'outline' | 'ghost' | 'link' | 'secondary' | 'destructive';
    /** Button size - affects padding and height */
    size?: 'default' | 'sm' | 'lg' | 'icon';
    /** Shows loading spinner and disables interaction */
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', isLoading, children, disabled, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={isLoading || disabled}
                className={cn(
                    // Base styles
                    "inline-flex items-center justify-center whitespace-nowrap rounded-lg",
                    "text-sm font-bold uppercase tracking-wider",
                    "ring-offset-background transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:pointer-events-none disabled:opacity-50",
                    "active:scale-[0.98]",

                    // Variant styles
                    {
                        // Default - Solid primary color
                        'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md':
                            variant === 'default',

                        // Gradient - Premium look with glow
                        'vector-gradient text-white shadow-lg hover:shadow-xl vector-glow hover:vector-glow-strong':
                            variant === 'gradient',

                        // Secondary - Subdued action
                        'bg-secondary text-secondary-foreground hover:bg-secondary/80':
                            variant === 'secondary',

                        // Outline - Bordered style
                        'border-2 border-primary/30 bg-transparent text-foreground hover:bg-primary/10 hover:border-primary/50':
                            variant === 'outline',

                        // Ghost - Minimal style
                        'bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground':
                            variant === 'ghost',

                        // Link - Text-only with underline
                        'text-primary underline-offset-4 hover:underline bg-transparent':
                            variant === 'link',

                        // Destructive - Danger actions
                        'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm':
                            variant === 'destructive',
                    },

                    // Size styles
                    {
                        'h-10 px-5 py-2': size === 'default',
                        'h-8 rounded-md px-3 text-xs': size === 'sm',
                        'h-12 rounded-xl px-8 text-base': size === 'lg',
                        'h-10 w-10 p-0': size === 'icon',
                    },

                    className
                )}
                {...props}
            >
                {isLoading && (
                    <Loader2
                        className="mr-2 h-4 w-4 animate-spin"
                        aria-hidden="true"
                    />
                )}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

// eslint-disable-next-line react-refresh/only-export-components
export { Button, cn };
export type { ButtonProps };
