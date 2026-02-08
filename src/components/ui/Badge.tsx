/**
 * Badge Component - Status and label indicators
 * 
 * @component
 * @description Compact label component for status indicators, tags, and
 * small pieces of information. Supports multiple color variants aligned
 * with the Vector design system.
 * 
 * @example
 * // Status badges
 * <Badge variant="success">CONFIRMED</Badge>
 * <Badge variant="warning">PENDING</Badge>
 * <Badge variant="danger">CANCELLED</Badge>
 * 
 * @example
 * // With dot indicator
 * <Badge variant="success" withDot>ONLINE</Badge>
 * 
 * @example
 * // Outline style
 * <Badge variant="outline">BETA</Badge>
 * 
 * @troubleshooting
 * - Badge colors incorrect: Verify CSS variables are loaded
 * - Dot not visible: Check if withDot prop is passed
 * - Text hard to read: Badge automatically adjusts text color for contrast
 */

import * as React from "react"
import { cn } from "./Button"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** Color variant matching status semantics */
    variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'gradient';
    /** Size of the badge */
    size?: 'sm' | 'default' | 'lg';
    /** Shows animated dot indicator */
    withDot?: boolean;
    /** Makes the dot pulse */
    pulseDot?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = 'default', size = 'default', withDot, pulseDot, children, ...props }, ref) => {
        return (
            <span
                ref={ref}
                className={cn(
                    // Base styles
                    "inline-flex items-center font-bold uppercase tracking-wider",
                    "rounded-full transition-colors",

                    // Size styles
                    {
                        'px-2 py-0.5 text-[9px]': size === 'sm',
                        'px-2.5 py-1 text-[10px]': size === 'default',
                        'px-3 py-1.5 text-xs': size === 'lg',
                    },

                    // Variant styles
                    {
                        // Default - Primary color
                        'bg-primary/10 text-primary dark:bg-primary/20':
                            variant === 'default',

                        // Secondary - Muted appearance
                        'bg-secondary text-secondary-foreground':
                            variant === 'secondary',

                        // Success - Green tones
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400':
                            variant === 'success',

                        // Warning - Amber tones
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400':
                            variant === 'warning',

                        // Danger - Red tones
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400':
                            variant === 'danger',

                        // Info - Blue tones
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400':
                            variant === 'info',

                        // Outline - Border only
                        'bg-transparent border border-current':
                            variant === 'outline',

                        // Gradient - Premium look
                        'vector-gradient text-white':
                            variant === 'gradient',
                    },

                    className
                )}
                {...props}
            >
                {/* Optional dot indicator */}
                {withDot && (
                    <span
                        className={cn(
                            "w-1.5 h-1.5 rounded-full mr-1.5",
                            pulseDot && "animate-pulse",
                            {
                                'bg-primary': variant === 'default',
                                'bg-slate-500': variant === 'secondary',
                                'bg-emerald-500': variant === 'success',
                                'bg-amber-500': variant === 'warning',
                                'bg-red-500': variant === 'danger',
                                'bg-blue-500': variant === 'info',
                                'bg-current': variant === 'outline',
                                'bg-white': variant === 'gradient',
                            }
                        )}
                        aria-hidden="true"
                    />
                )}
                {children}
            </span>
        )
    }
)

Badge.displayName = "Badge"

/* ============================================================
   STATUS BADGE PRESETS
   Convenience components for common statuses
   ============================================================ */

interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
    status: 'online' | 'offline' | 'busy' | 'away' | 'pending' | 'confirmed' | 'blocked';
}

/**
 * Pre-configured badge for common status values
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({ status, ...props }) => {
    const config = {
        online: { variant: 'success' as const, label: 'ONLINE', dot: true, pulse: true },
        offline: { variant: 'secondary' as const, label: 'OFFLINE', dot: true, pulse: false },
        busy: { variant: 'danger' as const, label: 'BUSY', dot: true, pulse: true },
        away: { variant: 'warning' as const, label: 'AWAY', dot: true, pulse: false },
        pending: { variant: 'warning' as const, label: 'PENDING', dot: false, pulse: false },
        confirmed: { variant: 'success' as const, label: 'CONFIRMED', dot: false, pulse: false },
        blocked: { variant: 'danger' as const, label: 'BLOCKED', dot: false, pulse: false },
    }

    const { variant, label, dot, pulse } = config[status]

    return (
        <Badge variant={variant} withDot={dot} pulseDot={pulse} {...props}>
            {label}
        </Badge>
    )
}

StatusBadge.displayName = "StatusBadge"

export { Badge, StatusBadge }
export type { BadgeProps, StatusBadgeProps }
