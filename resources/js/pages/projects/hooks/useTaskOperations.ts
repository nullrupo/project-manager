import { router } from '@inertiajs/react';
import { Project } from '@/types/project-manager';

/**
 * Custom hook for task operations
 */
export const useTaskOperations = (project: Project) => {
    
    /**
     * Toggle task completion status
     */
    const toggleTaskCompletion = async (taskId: number) => {
        try {
            const response = await fetch(route('tasks.toggle-completion', { project: project.id, task: taskId }), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({})
            });
            
            const data = await response.json();
            if (data.success) {
                router.reload();
            } else {
                console.error('Failed to toggle task completion:', data);
            }
        } catch (error) {
            console.error('Failed to toggle task completion:', error);
        }
    };

    /**
     * Delete a task
     */
    const deleteTask = (taskId: number) => {
        if (confirm('Are you sure you want to delete this task?')) {
            router.delete(route('tasks.destroy', { project: project.id, task: taskId }));
        }
    };

    /**
     * Move task to different list/section
     */
    const moveTask = async (taskId: number, updates: any) => {
        try {
            const response = await fetch(route('tasks.move', { project: project.id, task: taskId }), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(updates)
            });
            
            const data = await response.json();
            if (data.success) {
                router.reload();
            } else {
                console.error('Failed to move task:', data);
            }
        } catch (error) {
            console.error('Failed to move task:', error);
        }
    };

    /**
     * Update task positions for reordering
     */
    const updateTaskPositions = async (tasks: any[]) => {
        try {
            const response = await fetch(route('tasks.positions', { project: project.id }), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ tasks })
            });
            
            const data = await response.json();
            if (data.success) {
                router.reload();
            } else {
                console.error('Failed to update task positions:', data);
            }
        } catch (error) {
            console.error('Failed to update task positions:', error);
        }
    };

    /**
     * Update task with new data
     */
    const updateTask = (taskId: number, taskData: any, options: any = {}) => {
        router.put(route('tasks.update', { project: project.id, task: taskId }), taskData, {
            preserveState: true,
            preserveScroll: true,
            ...options
        });
    };

    /**
     * Assign/unassign member to task
     */
    const toggleTaskAssignment = (taskId: number, memberId: number, currentAssignees: number[]) => {
        const newAssignees = currentAssignees.includes(memberId)
            ? currentAssignees.filter(id => id !== memberId) // Remove if already assigned
            : [...currentAssignees, memberId]; // Add if not assigned

        // Find the task to get its current data
        const allTasks = project.boards?.[0]?.lists?.flatMap(list => list.tasks || []) || [];
        const task = allTasks.find(t => t.id === taskId);
        
        if (!task) {
            console.error('Task not found');
            return;
        }

        updateTask(taskId, {
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            status: task.status,
            due_date: task.due_date,
            assignee_ids: newAssignees
        }, {
            onSuccess: () => {
                console.log(`Successfully ${currentAssignees.includes(memberId) ? 'removed' : 'assigned'} member ${currentAssignees.includes(memberId) ? 'from' : 'to'} task: ${task.title}`);
            },
            onError: (errors: any) => {
                console.error('Failed to assign task:', errors);
            }
        });
    };

    return {
        toggleTaskCompletion,
        deleteTask,
        moveTask,
        updateTaskPositions,
        updateTask,
        toggleTaskAssignment,
    };
};
