import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

interface TaskDisplayPreferencesContextType {
    getPreferences: (pageKey: string) => TaskDisplayPreferences;
    initializePreferences: (pageKey: string) => void;
    updatePreferences: (pageKey: string, newPreferences: Partial<TaskDisplayPreferences>) => void;
    resetToGlobal: (pageKey: string) => void;
    isPageSpecific: (pageKey: string) => boolean;
}

const TaskDisplayPreferencesContext = createContext<TaskDisplayPreferencesContextType | undefined>(undefined);

interface TaskDisplayPreferencesProviderProps {
    children: ReactNode;
}

export function TaskDisplayPreferencesProvider({ children }: TaskDisplayPreferencesProviderProps) {
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

    // State to track all page-specific preferences
    const [pagePreferences, setPagePreferences] = useState<Record<string, TaskDisplayPreferences>>({});
    const [updateTrigger, setUpdateTrigger] = useState(0);

    // Load preferences from localStorage for a specific page
    const loadPagePreferences = (pageKey: string): TaskDisplayPreferences => {
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

    // Get preferences for a specific page
    const getPreferences = (pageKey: string): TaskDisplayPreferences => {
        if (pagePreferences[pageKey]) {
            return pagePreferences[pageKey];
        }

        // Return loaded preferences without setting state during render
        return loadPagePreferences(pageKey);
    };

    // Initialize preferences for a page (to be called in useEffect)
    const initializePreferences = (pageKey: string) => {
        if (!pagePreferences[pageKey]) {
            const prefs = loadPagePreferences(pageKey);
            setPagePreferences(prev => ({ ...prev, [pageKey]: prefs }));
        }
    };

    // Update preferences for a specific page
    const updatePreferences = (pageKey: string, newPreferences: Partial<TaskDisplayPreferences>) => {
        if (!pageKey || !pageKey.trim()) {
            console.warn('Cannot update page-specific preferences without a valid pageKey');
            return;
        }

        try {
            const currentPrefs = getPreferences(pageKey);
            const updatedPreferences = { ...currentPrefs, ...newPreferences };
            
            // Save to localStorage
            localStorage.setItem(`task-display-${pageKey}`, JSON.stringify(updatedPreferences));
            
            // Update state
            setPagePreferences(prev => ({ ...prev, [pageKey]: updatedPreferences }));
            
            // Trigger re-render
            setUpdateTrigger(prev => prev + 1);
        } catch (error) {
            console.error('Failed to save page-specific task display preferences:', error);
        }
    };

    // Reset to global preferences
    const resetToGlobal = (pageKey: string) => {
        try {
            localStorage.removeItem(`task-display-${pageKey}`);
            const globalPrefs = globalPreferences ? { ...defaultPreferences, ...globalPreferences } : defaultPreferences;
            setPagePreferences(prev => ({ ...prev, [pageKey]: globalPrefs }));
            setUpdateTrigger(prev => prev + 1);
        } catch (error) {
            console.error('Failed to reset page-specific task display preferences:', error);
        }
    };

    // Check if page has specific preferences
    const isPageSpecific = (pageKey: string): boolean => {
        return Boolean(pageKey && pageKey.trim() && localStorage.getItem(`task-display-${pageKey}`) !== null);
    };

    const value: TaskDisplayPreferencesContextType = {
        getPreferences,
        initializePreferences,
        updatePreferences,
        resetToGlobal,
        isPageSpecific,
    };

    return (
        <TaskDisplayPreferencesContext.Provider value={value}>
            {children}
        </TaskDisplayPreferencesContext.Provider>
    );
}

export function useTaskDisplayPreferencesContext() {
    const context = useContext(TaskDisplayPreferencesContext);
    if (context === undefined) {
        throw new Error('useTaskDisplayPreferencesContext must be used within a TaskDisplayPreferencesProvider');
    }
    return context;
}
