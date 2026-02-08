/**
 * Card Component - Enterprise-grade container with glassmorphism
 * 
 * @component
 * @description Versatile container component for Project Vector featuring
 * glassmorphism effects, gradient borders, and various elevation levels.
 * Used throughout the application for content grouping.
 * 
 * @example
 * // Basic card
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Upcoming Appointments</CardTitle>
 *     <CardDescription>Your next 3 scheduled visits</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     {appointments.map(apt => <AppointmentRow key={apt.id} {...apt} />)}
 *   </CardContent>
 * </Card>
 * 
 * @example
 * // Glass variant with gradient border
 * <Card variant="glass" withGradientBorder>
 *   <CardContent>Premium feature content</CardContent>
 * </Card>
 * 
 * @troubleshooting
 * - Glass effect not visible: Check backdrop-filter browser support
 * - Gradient border missing: Ensure ::before pseudo-element not overridden
 * - Card too dark/light: Verify dark mode class on html element
 */

import * as React from "react"
import { cn } from "./Button"

/* ============================================================
   CARD VARIANTS
   ============================================================ */

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Visual style variant */
    variant?: 'default' | 'elevated' | 'glass' | 'outline';
    /** Adds animated gradient border effect */
    withGradientBorder?: boolean;
    /** Adds subtle glow effect on hover */
    withGlow?: boolean;
}

/**
 * Main Card container component
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', withGradientBorder, withGlow, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                // Base styles
                "rounded-xl transition-all duration-200",

                // Variant styles
                {
                    // Default - Standard card
                    'bg-card text-card-foreground border border-border shadow-sm':
                        variant === 'default',

                    // Elevated - More prominent shadow
                    'bg-card text-card-foreground border border-border shadow-lg dark:shadow-2xl dark:shadow-black/20':
                        variant === 'elevated',

                    // Glass - Glassmorphism effect
                    'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 shadow-xl':
                        variant === 'glass',

                    // Outline - Border only, no fill
                    'bg-transparent border-2 border-border':
                        variant === 'outline',
                },

                // Gradient border modifier
                withGradientBorder && 'vector-gradient-border',

                // Glow effect modifier
                withGlow && 'hover:vector-glow',

                className
            )}
            {...props}
        />
    )
)
Card.displayName = "Card"

/* ============================================================
   CARD HEADER
   ============================================================ */

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Reduces padding for compact layouts */
    compact?: boolean;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
    ({ className, compact, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "flex flex-col space-y-1.5",
                compact ? "p-4" : "p-6",
                className
            )}
            {...props}
        />
    )
)
CardHeader.displayName = "CardHeader"

/* ============================================================
   CARD TITLE
   ============================================================ */

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
    /** Use gradient text effect */
    gradient?: boolean;
}

const CardTitle = React.forwardRef<HTMLParagraphElement, CardTitleProps>(
    ({ className, gradient, children, ...props }, ref) => (
        <h3
            ref={ref}
            className={cn(
                "text-lg font-bold leading-none tracking-tight",
                gradient && "vector-gradient-text",
                className
            )}
            {...props}
        >
            {children}
        </h3>
    )
)
CardTitle.displayName = "CardTitle"

/* ============================================================
   CARD DESCRIPTION
   ============================================================ */

const CardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn(
            "text-sm text-muted-foreground",
            className
        )}
        {...props}
    />
))
CardDescription.displayName = "CardDescription"

/* ============================================================
   CARD CONTENT
   ============================================================ */

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Removes default padding */
    noPadding?: boolean;
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
    ({ className, noPadding, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                noPadding ? "p-0" : "p-6 pt-0",
                className
            )}
            {...props}
        />
    )
)
CardContent.displayName = "CardContent"

/* ============================================================
   CARD FOOTER
   ============================================================ */

const CardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "flex items-center p-6 pt-0",
            className
        )}
        {...props}
    />
))
CardFooter.displayName = "CardFooter"

/* ============================================================
   EXPORTS
   ============================================================ */

export {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
}

export type {
    CardProps,
    CardHeaderProps,
    CardTitleProps,
    CardContentProps,
}
