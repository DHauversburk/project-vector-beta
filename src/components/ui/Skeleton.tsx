import { cn } from '../../lib/utils';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circle' | 'card' | 'default';
    width?: string | number;
    height?: string | number;
    lines?: number;
}

/**
 * Skeleton loading component for placeholder content.
 * Uses CSS-based shimmer animation for smooth loading states.
 * 
 * @example
 * // Single skeleton
 * <Skeleton className="h-4 w-48" />
 * 
 * // Text skeleton with multiple lines
 * <Skeleton variant="text" lines={3} />
 * 
 * // Card skeleton
 * <Skeleton variant="card" className="h-32" />
 * 
 * // Avatar skeleton
 * <Skeleton variant="circle" width={40} height={40} />
 */
export function Skeleton({
    className,
    variant = 'default',
    width,
    height,
    lines = 1
}: SkeletonProps) {
    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    // Text variant: multiple lines with varying widths
    if (variant === 'text' && lines > 1) {
        return (
            <div className="space-y-2">
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            'skeleton skeleton-text',
                            // Last line is shorter for natural look
                            i === lines - 1 ? 'w-3/4' : 'w-full',
                            className
                        )}
                        style={style}
                    />
                ))}
            </div>
        );
    }

    const variantClasses = {
        text: 'skeleton skeleton-text',
        circle: 'skeleton skeleton-circle',
        card: 'skeleton skeleton-card',
        default: 'skeleton'
    };

    return (
        <div
            className={cn(variantClasses[variant], className)}
            style={style}
        />
    );
}

/**
 * Pre-built skeleton patterns for common use cases
 */
export function SkeletonCard({ className }: { className?: string }) {
    return (
        <div className={cn('ent-card p-4 space-y-4', className)}>
            <div className="flex items-center gap-3">
                <Skeleton variant="circle" width={40} height={40} />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                </div>
            </div>
            <Skeleton variant="text" lines={3} />
            <div className="flex gap-2">
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
        </div>
    );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-2">
            {/* Header */}
            <div className="flex gap-4 p-3 border-b border-slate-200 dark:border-slate-800">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/6" />
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 p-3">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/6" />
                </div>
            ))}
        </div>
    );
}

export function SkeletonList({ items = 3 }: { items?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 ent-card">
                    <Skeleton variant="circle" width={32} height={32} />
                    <div className="flex-1">
                        <Skeleton className="h-4 w-1/2 mb-1" />
                        <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded" />
                </div>
            ))}
        </div>
    );
}
