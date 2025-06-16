/**
 * Utility functions for mapping between column names and task statuses
 */

// Standard status mappings
const STATUS_MAPPINGS = {
    // Common "To Do" variations
    'to do': 'to_do',
    'todo': 'to_do',
    'backlog': 'to_do',
    'planned': 'to_do',
    'new': 'to_do',
    'open': 'to_do',
    'pending': 'to_do',
    'not started': 'to_do',
    
    // Common "In Progress" variations
    'in progress': 'in_progress',
    'in-progress': 'in_progress',
    'inprogress': 'in_progress',
    'doing': 'in_progress',
    'active': 'in_progress',
    'working': 'in_progress',
    'started': 'in_progress',
    'development': 'in_progress',
    'dev': 'in_progress',
    
    // Common "Done" variations
    'done': 'done',
    'completed': 'done',
    'complete': 'done',
    'finished': 'done',
    'closed': 'done',
    'resolved': 'done',
    'deployed': 'done',
    'live': 'done',
    
    // Common "Review" variations
    'review': 'in_review',
    'in review': 'in_review',
    'in-review': 'in_review',
    'testing': 'in_review',
    'qa': 'in_review',
    'quality assurance': 'in_review',
    'code review': 'in_review',
    'peer review': 'in_review',
    
    // Common "Blocked" variations
    'blocked': 'blocked',
    'on hold': 'blocked',
    'waiting': 'blocked',
    'paused': 'blocked',
    'stuck': 'blocked',
    'impediment': 'blocked',
};

/**
 * Map a column name to a task status
 */
export function getStatusFromColumnName(columnName: string): string {
    if (!columnName) return 'to_do';

    const normalized = columnName.toLowerCase().trim();

    // Check direct mappings first
    if (STATUS_MAPPINGS[normalized]) {
        return STATUS_MAPPINGS[normalized];
    }

    // Check if the column name contains any of the keywords (exact word matches first)
    for (const [keyword, status] of Object.entries(STATUS_MAPPINGS)) {
        // Try exact word match first
        const wordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (wordRegex.test(normalized)) {
            return status;
        }
    }

    // Then check for partial matches
    for (const [keyword, status] of Object.entries(STATUS_MAPPINGS)) {
        if (normalized.includes(keyword)) {
            return status;
        }
    }

    // Default fallback based on common patterns
    if (normalized.includes('do') || normalized.includes('start') || normalized.includes('plan')) {
        return 'to_do';
    }

    if (normalized.includes('progress') || normalized.includes('work') || normalized.includes('dev')) {
        return 'in_progress';
    }

    if (normalized.includes('done') || normalized.includes('complete') || normalized.includes('finish')) {
        return 'done';
    }

    if (normalized.includes('review') || normalized.includes('test') || normalized.includes('qa')) {
        return 'in_review';
    }

    if (normalized.includes('block') || normalized.includes('hold') || normalized.includes('wait')) {
        return 'blocked';
    }

    // Default to to_do if no pattern matches
    return 'to_do';
}

/**
 * Map a task status to a default column name
 */
export function getColumnNameFromStatus(status: string): string {
    switch (status) {
        case 'to_do':
            return 'To Do';
        case 'in_progress':
            return 'In Progress';
        case 'in_review':
            return 'In Review';
        case 'done':
            return 'Done';
        case 'blocked':
            return 'Blocked';
        default:
            return 'To Do';
    }
}

/**
 * Get all valid task statuses
 */
export function getValidStatuses(): string[] {
    return ['to_do', 'in_progress', 'in_review', 'blocked', 'done'];
}

/**
 * Check if a status is valid
 */
export function isValidStatus(status: string): boolean {
    return getValidStatuses().includes(status);
}
