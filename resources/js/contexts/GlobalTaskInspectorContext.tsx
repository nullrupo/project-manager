import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';

interface Task {
    id: number;
    title: string;
    description?: string;
    priority: string;
    status: string;
    due_date?: string;
    estimate?: string;
    list_id?: number;
    project_id?: number;
    project?: {
        id: number;
        name: string;
        can_edit?: boolean;
        can_manage_tasks?: boolean;
    };
    list?: {
        id: number;
        name: string;
    };
    assignees?: any[];
    labels?: any[];
    is_archived?: boolean;
    is_inbox?: boolean;
}

interface GlobalTaskInspectorContextType {
    isOpen: boolean;
    task: Task | null;
    project: any | null;
    openInspector: (task: Task, project?: any) => void;
    closeInspector: () => void;
    saveAndCloseInspector: () => Promise<void>;
    saveInspectorRef: React.MutableRefObject<(() => Promise<void>) | null>;
}

const GlobalTaskInspectorContext = createContext<GlobalTaskInspectorContextType | undefined>(undefined);

interface GlobalTaskInspectorProviderProps {
    children: ReactNode;
}

export function GlobalTaskInspectorProvider({ children }: GlobalTaskInspectorProviderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [task, setTask] = useState<Task | null>(null);
    const [project, setProject] = useState<any | null>(null);
    const saveInspectorRef = useRef<(() => Promise<void>) | null>(null);

    const openInspector = (taskToOpen: Task, projectContext?: any) => {
        setTask(taskToOpen);

        // Handle inbox tasks differently
        if (taskToOpen.is_inbox) {
            // For inbox tasks, create a minimal project context
            setProject({
                id: null, // No project ID for inbox tasks
                name: 'Inbox',
                can_edit: true,
                can_manage_tasks: true
            });
        } else if (projectContext) {
            // Use provided project context
            setProject(projectContext);
        } else if (taskToOpen.project) {
            // Use task's project information
            setProject(taskToOpen.project);
        } else {
            // Fallback: create minimal project object from task data
            setProject({
                id: taskToOpen.project_id,
                name: 'Unknown Project',
                can_edit: true,
                can_manage_tasks: true
            });
        }

        setIsOpen(true);
    };

    const closeInspector = () => {
        setIsOpen(false);
        setTask(null);
        setProject(null);
        saveInspectorRef.current = null;
    };

    const saveAndCloseInspector = async () => {
        // Save any pending changes before closing
        if (saveInspectorRef.current) {
            try {
                await saveInspectorRef.current();
            } catch (error) {
                console.error('Failed to save task before closing inspector:', error);
            }
        }
        closeInspector();
    };

    // Listen for navigation events to close inspector
    useEffect(() => {
        const handleNavigationStart = () => {
            if (isOpen) {
                // Save and close inspector when navigation starts
                saveAndCloseInspector();
            }
        };

        // Listen for Inertia navigation events
        const removeListener = router.on('start', handleNavigationStart);

        return () => {
            removeListener();
        };
    }, [isOpen]);

    // Listen for click outside to close inspector
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen) {
                const target = event.target as Element;
                const inspectorElement = document.querySelector('[data-global-inspector]');

                // Check if click is outside the inspector
                if (inspectorElement && !inspectorElement.contains(target)) {
                    // Don't close if clicking on a task (which would open the inspector)
                    const isTaskClick = target.closest('[data-task-clickable]');
                    if (!isTaskClick) {
                        saveAndCloseInspector();
                    }
                }
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const value: GlobalTaskInspectorContextType = {
        isOpen,
        task,
        project,
        openInspector,
        closeInspector,
        saveAndCloseInspector,
        saveInspectorRef
    };

    return (
        <GlobalTaskInspectorContext.Provider value={value}>
            {children}
        </GlobalTaskInspectorContext.Provider>
    );
}

export function useGlobalTaskInspector() {
    const context = useContext(GlobalTaskInspectorContext);
    if (context === undefined) {
        throw new Error('useGlobalTaskInspector must be used within a GlobalTaskInspectorProvider');
    }
    return context;
}
