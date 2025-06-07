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
