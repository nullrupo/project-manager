import { useState, useCallback } from 'react';
import { router } from '@inertiajs/react';

interface Task {
    id: number;
    title: string;
    description?: string | null;
    status: 'to_do' | 'in_progress' | 'done';
    priority?: 'low' | 'medium' | 'high';
    due_date?: string | null;
    created_by?: number;
    assignees?: Array<{ id: number; name: string }>;
    [key: string]: any; // Allow additional properties
}

interface BatchOperationOptions {
    preserveSelection?: boolean;
    onSuccess?: () => void;
    onError?: (error: any) => void;
}

export function useBatchTaskOperations(
    tasks: Task[],
    selectedTasks: Set<number>,
    setSelectedTasks: (tasks: Set<number>) => void,
    setShowBulkActions: (show: boolean) => void,
    routePrefix: string = 'inbox.tasks' // Default to inbox, can be overridden
) {
    const [isProcessing, setIsProcessing] = useState(false);

    // Get completion state of selected tasks
    const getSelectedTasksCompletionState = useCallback(() => {
        const selectedTasksList = Array.from(selectedTasks)
            .map(id => tasks.find(t => t.id === id))
            .filter((task): task is Task => task !== undefined);
        const completedTasks = selectedTasksList.filter(task => task.status === 'done');
        const incompleteTasks = selectedTasksList.filter(task => task.status !== 'done');
        
        return {
            allCompleted: completedTasks.length === selectedTasksList.length && selectedTasksList.length > 0,
            hasIncomplete: incompleteTasks.length > 0,
            completedCount: completedTasks.length,
            totalCount: selectedTasksList.length
        };
    }, [selectedTasks, tasks]);

    // Smart batch completion toggle using flexible completion logic
    const bulkToggleCompletion = useCallback((options: BatchOperationOptions = {}) => {
        if (isProcessing) return;

        const taskIds = Array.from(selectedTasks);

        setIsProcessing(true);
        let completedUpdates = 0;
        const totalUpdates = taskIds.length;

        taskIds.forEach(taskId => {
            // Use the toggle completion endpoint for flexible behavior
            router.post(route(`${routePrefix}.toggle-completion`, { task: taskId }), {}, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    completedUpdates++;
                    if (completedUpdates === totalUpdates) {
                        setIsProcessing(false);
                        if (!options.preserveSelection) {
                            setSelectedTasks(new Set());
                            setShowBulkActions(false);
                        }
                        options.onSuccess?.();
                    }
                },
                onError: (errors) => {
                    setIsProcessing(false);
                    console.error('Failed to toggle task completion:', taskId, errors);
                    options.onError?.(errors);
                }
            });
        });
    }, [selectedTasks, routePrefix, isProcessing, setSelectedTasks, setShowBulkActions]);

    // Batch delete
    const bulkDelete = useCallback((options: BatchOperationOptions = {}) => {
        if (isProcessing) return;
        
        const taskIds = Array.from(selectedTasks);
        setIsProcessing(true);
        let completedDeletes = 0;
        const totalDeletes = taskIds.length;

        taskIds.forEach(taskId => {
            router.delete(route(`${routePrefix}.destroy`, { task: taskId }), { 
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    completedDeletes++;
                    if (completedDeletes === totalDeletes) {
                        setIsProcessing(false);
                        if (!options.preserveSelection) {
                            setSelectedTasks(new Set());
                            setShowBulkActions(false);
                        }
                        options.onSuccess?.();
                    }
                },
                onError: (errors) => {
                    setIsProcessing(false);
                    console.error('Failed to delete task:', taskId, errors);
                    options.onError?.(errors);
                }
            });
        });
    }, [selectedTasks, routePrefix, isProcessing, setSelectedTasks, setShowBulkActions]);

    // Batch status update (generic)
    const bulkUpdateStatus = useCallback((newStatus: string, options: BatchOperationOptions = {}) => {
        if (isProcessing) return;
        
        const taskIds = Array.from(selectedTasks);
        setIsProcessing(true);
        let completedUpdates = 0;
        const totalUpdates = taskIds.length;

        taskIds.forEach(taskId => {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                router.put(route(`${routePrefix}.update`, { task: taskId }), {
                    ...task,
                    status: newStatus,
                }, { 
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        completedUpdates++;
                        if (completedUpdates === totalUpdates) {
                            setIsProcessing(false);
                            if (!options.preserveSelection) {
                                setSelectedTasks(new Set());
                                setShowBulkActions(false);
                            }
                            options.onSuccess?.();
                        }
                    },
                    onError: (errors) => {
                        setIsProcessing(false);
                        console.error('Failed to update task:', taskId, errors);
                        options.onError?.(errors);
                    }
                });
            }
        });
    }, [selectedTasks, tasks, routePrefix, isProcessing, setSelectedTasks, setShowBulkActions]);

    return {
        isProcessing,
        getSelectedTasksCompletionState,
        bulkToggleCompletion,
        bulkDelete,
        bulkUpdateStatus
    };
}
