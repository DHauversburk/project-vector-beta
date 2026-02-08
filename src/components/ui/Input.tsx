/**
 * Input Component - Enterprise-grade text input field
 * 
 * @component
 * @description Standard input component for Project Vector with enhanced
 * focus states featuring glow effects consistent with the Vector Dark theme.
 * Supports all standard HTML input attributes.
 * 
 * @example
 * // Standard text input
 * <Input 
 *   type="text" 
 *   placeholder="Enter token..."
 *   value={token}
 *   onChange={(e) => setToken(e.target.value)}
 * />
 * 
 * @example
 * // Token input with centered styling
 * <Input 
 *   type="text"
 *   variant="token"
 *   placeholder="M-XXXX-XX"
 *   className="text-center text-2xl tracking-widest"
 * />
 * 
 * @troubleshooting
 * - Focus glow not appearing: Ensure index.css styles are loaded
 * - Border color wrong: Check if dark mode class is applied to html element
 * - Placeholder invisible: Verify contrast in current theme mode
 */

import * as React from "react"
import { cn } from "./Button"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    /** Visual variant for different input contexts */
    variant?: 'default' | 'token' | 'search';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, variant = 'default', ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    // Base styles
                    "flex w-full rounded-lg border bg-background",
                    "text-sm text-foreground font-medium",
                    "ring-offset-background transition-all duration-200",
                    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                    "placeholder:text-muted-foreground",
                    "disabled:cursor-not-allowed disabled:opacity-50",

                    // Focus styles with glow effect
                    "focus-visible:outline-none",
                    "focus-visible:ring-2 focus-visible:ring-primary/50",
                    "focus-visible:border-primary",
                    "focus-visible:shadow-[0_0_0_3px_hsla(217,91%,60%,0.1)]",

                    // Variant styles
                    {
                        // Default - Standard input
                        'h-10 px-3 py-2 border-input': variant === 'default',

                        // Token - Large, centered for token entry
                        'h-14 px-4 py-3 text-center text-xl tracking-[0.15em] font-black uppercase border-2 border-input':
                            variant === 'token',

                        // Search - With rounded ends
                        'h-10 px-4 py-2 rounded-full border-input pl-10': variant === 'search',
                    },

                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)

Input.displayName = "Input"

export { Input }
