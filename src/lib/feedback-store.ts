export interface FeedbackEntry {
    id: string;
    rating: number;
    category: 'bug' | 'feature' | 'perf' | 'ui' | 'general';
    message: string;
    page: string;
    timestamp: string;
    userAgent: string;
}

const STORAGE_KEY = 'vector_feedback';

/**
 * Utility to retrieve stored feedback (for admin view)
 */
export function getFeedbackEntries(): FeedbackEntry[] {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

/**
 * Utility to save a new feedback entry
 */
export function addFeedbackEntry(entry: FeedbackEntry): void {
    const existing = getFeedbackEntries();
    existing.push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

/**
 * Utility to clear all feedback (for testing)
 */
export function clearFeedbackEntries(): void {
    localStorage.removeItem(STORAGE_KEY);
}
