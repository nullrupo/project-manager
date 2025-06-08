import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { SharedData } from '@/types/project-manager';

export interface TaskDisplayPreferences {
    show_urgency: boolean;
    show_notes: boolean;
    show_deadline: boolean;
    show_checklist_progress: boolean;
    show_assignee: boolean;
    show_status: boolean;
}

export function useTaskDisplayPreferences() {
    const { auth } = usePage<SharedData>().props;
    const userPreferences = auth.user?.task_display_preferences;

    // Default preferences when none exist
    const defaultPreferences: TaskDisplayPreferences = {
        show_urgency: true,
        show_notes: true,
        show_deadline: true,
        show_checklist_progress: true,
        show_assignee: true,
        show_status: true,
    };

    const [preferences, setPreferences] = useState<TaskDisplayPreferences>(() =>
        userPreferences ? { ...defaultPreferences, ...userPreferences } : defaultPreferences
    );

    const [isLoading, setIsLoading] = useState(false);

    // Load preferences from server
    const loadPreferences = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(route('task-display-preferences.show'));
            const serverPreferences = await response.json();
            setPreferences({ ...defaultPreferences, ...serverPreferences });
        } catch (error) {
            console.error('Failed to load task display preferences:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Update preferences on server
    const updatePreferences = async (newPreferences: Partial<TaskDisplayPreferences>) => {
        setIsLoading(true);
        try {
            const response = await fetch(route('task-display-preferences.update'), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(newPreferences),
            });

            if (response.ok) {
                setPreferences(prev => ({ ...prev, ...newPreferences }));
            }
        } catch (error) {
            console.error('Failed to update task display preferences:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Load preferences on mount if not available from props
    useEffect(() => {
        if (!userPreferences) {
            loadPreferences();
        }
    }, [userPreferences]);

    return {
        preferences,
        updatePreferences,
        isLoading,
        loadPreferences,
    };
}

// Page-specific task display preferences hook
export function usePageTaskDisplayPreferences(pageKey: string) {
    const { auth } = usePage<SharedData>().props;
    const globalPreferences = auth.user?.task_display_preferences;

    // Default preferences when none exist
    const defaultPreferences: TaskDisplayPreferences = {
        show_urgency: true,
        show_notes: true,
        show_deadline: true,
        show_checklist_progress: true,
        show_assignee: true,
        show_status: true,
    };

    // Get page-specific preferences from localStorage
    const getPagePreferences = (): TaskDisplayPreferences => {
        // If no pageKey provided, just return global preferences or defaults
        if (!pageKey || !pageKey.trim()) {
            return globalPreferences ? { ...defaultPreferences, ...globalPreferences } : defaultPreferences;
        }

        try {
            const stored = localStorage.getItem(`task-display-${pageKey}`);
            if (stored) {
                const parsed = JSON.parse(stored);
                return { ...defaultPreferences, ...parsed };
            }
        } catch (error) {
            console.error('Failed to load page-specific task display preferences:', error);
        }

        // Fall back to global preferences or defaults
        return globalPreferences ? { ...defaultPreferences, ...globalPreferences } : defaultPreferences;
    };

    const [preferences, setPreferences] = useState<TaskDisplayPreferences>(getPagePreferences);
    const [updateCounter, setUpdateCounter] = useState(0);

    // Update preferences when pageKey changes
    useEffect(() => {
        setPreferences(getPagePreferences());
    }, [pageKey]);

    // Listen for localStorage changes to update immediately
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === `task-display-${pageKey}`) {
                setPreferences(getPagePreferences());
                setUpdateCounter(prev => prev + 1);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [pageKey]);

    // Update page-specific preferences in localStorage
    const updatePreferences = (newPreferences: Partial<TaskDisplayPreferences>) => {
        // Don't save if no pageKey provided
        if (!pageKey || !pageKey.trim()) {
            console.warn('Cannot update page-specific preferences without a valid pageKey');
            return;
        }

        try {
            const updatedPreferences = { ...preferences, ...newPreferences };
            localStorage.setItem(`task-display-${pageKey}`, JSON.stringify(updatedPreferences));
            // Force a new object reference to trigger re-renders
            setPreferences({ ...updatedPreferences });
            // Force update counter to trigger re-renders in components
            setUpdateCounter(prev => prev + 1);

            // Dispatch custom event to notify all components
            window.dispatchEvent(new CustomEvent('taskDisplayPreferencesChanged', {
                detail: { pageKey, preferences: updatedPreferences }
            }));
        } catch (error) {
            console.error('Failed to save page-specific task display preferences:', error);
        }
    };

    // Reset to global preferences
    const resetToGlobal = () => {
        try {
            localStorage.removeItem(`task-display-${pageKey}`);
            const globalPrefs = globalPreferences ? { ...defaultPreferences, ...globalPreferences } : defaultPreferences;
            setPreferences(globalPrefs);
        } catch (error) {
            console.error('Failed to reset page-specific task display preferences:', error);
        }
    };

    return {
        preferences,
        updatePreferences,
        resetToGlobal,
        isPageSpecific: Boolean(pageKey && pageKey.trim() && localStorage.getItem(`task-display-${pageKey}`) !== null),
        updateCounter, // Include update counter to force re-renders
    };
}
