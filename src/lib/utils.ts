import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes.
 * Combines clsx for conditional classes and tailwind-merge for deduplication.
 * 
 * @example
 * cn('p-4', condition && 'bg-blue-500', className)
 * cn('text-red-500', 'text-blue-500') // Returns 'text-blue-500'
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Basic text sanitization to remove common XSS patterns
 * Used for clinical notes and feedback comments.
 */
export function sanitizeText(text: string): string {
    if (!text) return '';
    return text
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
        .replace(/[<>]/g, (tag) => ({
            '<': '&lt;',
            '>': '&gt;'
        }[tag as '<' | '>'] || tag));
}
