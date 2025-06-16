import { useState, useRef, useEffect } from 'react';
import { type DragStartEvent, type DragEndEvent } from '@dnd-kit/core';
import axios from 'axios';
import { Project } from '@/types/project-manager';
import { 
    generateCalendarDays, 
    groupDaysIntoWeeks, 
    isMultiDayTask,
    navigateToPreviousMonth,
    navigateToNextMonth 
} from '../utils/calendarUtils';

/**
 * Custom hook for calendar logic and operations
 */
export const useCalendarLogic = (project: Project, state: any) => {
    const [isMounted, setIsMounted] = useState(false);
    const recentDragRef = useRef(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Generate calendar data
    const allTasks = project.boards?.[0]?.lists?.flatMap(list => list.tasks || []) || [];
    const calendarDays = generateCalendarDays(state.currentDate, allTasks);
    const weeks = groupDaysIntoWeeks(calendarDays);

    // Calendar navigation
    const navigateToPrevMonth = () => {
        state.setCurrentDate(navigateToPreviousMonth(state.currentDate));
    };

    const navigateToNextMonth = () => {
        state.setCurrentDate(navigateToNextMonth(state.currentDate));
    };

    // Calendar drag handlers
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;

        // Prevent dragging if a resize handle is being used
        if (state.isAnyHandleResizing) {
            return;
        }

        state.setIsDragInProgress(true);

        // Handle dragging from member panel
        if (active.id.toString().startsWith('member-')) {
            const memberId = parseInt(active.id.toString().replace('member-', ''));
            const member = project.members?.find(m => m.id === memberId);
            if (member) {
                state.setActiveTask({ type: 'member', member });
            }
            return;
        }

        // Handle dragging tasks from calendar
        if (active.id.toString().startsWith('multiday-task-')) {
            const taskId = parseInt(active.id.toString().replace('multiday-task-', ''));
            const task = allTasks.find(t => t.id === taskId);
            if (task) {
                state.setActiveTask(task);
                state.setDraggedTask(task);
            }
            return;
        }

        // Handle dragging single-day tasks
        const taskId = parseInt(active.id.toString().replace('task-', ''));
        const task = allTasks.find(t => t.id === taskId);
        if (task) {
            state.setActiveTask(task);
            state.setDraggedTask(task);
        }
    };

    const handleDragCancel = () => {
        state.setActiveTask(null);
        state.setDraggedTask(null);
        state.setIsDragInProgress(false);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        // Always reset drag state with longer delay to prevent click events
        setTimeout(() => {
            recentDragRef.current = false;
        }, 200);

        state.setActiveTask(null);
        state.setIsDragInProgress(false);

        if (!over) {
            state.setDraggedTask(null);
            return;
        }

        const overId = over.id.toString();

        // Handle member assignment to tasks
        if (active.id.toString().startsWith('member-') && overId.startsWith('task-')) {
            const memberId = parseInt(active.id.toString().replace('member-', ''));
            const taskId = parseInt(overId.replace('task-', ''));
            const member = project.members?.find(m => m.id === memberId);
            const targetTask = allTasks.find(t => t.id === taskId);

            if (member && targetTask) {
                // Directly assign member to task without modal
                const currentAssignees = targetTask.assignees?.map((a: any) => a.id) || [];
                const newAssignees = currentAssignees.includes(member.id)
                    ? currentAssignees.filter((id: number) => id !== member.id) // Remove if already assigned
                    : [...currentAssignees, member.id]; // Add if not assigned

                // Update task with new assignees using the task operations hook
                // This would be handled by the parent component
                console.log('Assign member to task:', { memberId, taskId, newAssignees });
            }

            state.setDraggedTask(null);
            return;
        }

        // Handle task date changes
        if (overId.startsWith('day-')) {
            const targetDateStr = overId.replace('day-', '');
            const targetDate = new Date(targetDateStr);

            // Get the task being dragged
            let task = state.draggedTask;
            let isFromCalendar = false;

            // Check if dragging from calendar
            if (active.id.toString().startsWith('multiday-task-')) {
                isFromCalendar = true;
            }

            if (task && isMounted) {
                state.setIsUpdatingTask(true);

                // Calculate new dates
                let startDate = task.start_date ? new Date(task.start_date) : new Date(task.due_date || targetDate);
                let dueDate = new Date(task.due_date || targetDate);

                // Calculate duration in days
                const originalDuration = isMultiDayTask(task) 
                    ? Math.ceil((dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                    : 0;

                // Set new start date to target date
                startDate = new Date(targetDate);
                
                // Calculate new due date maintaining duration
                const durationDays = Math.max(0, originalDuration);
                const finalDueDate = new Date(startDate);
                finalDueDate.setDate(finalDueDate.getDate() + durationDays);

                // Optimistically update local state
                state.setLocalTaskUpdates((prev: any) => ({
                    ...prev,
                    [task.id]: {
                        ...task,
                        start_date: startDate.toISOString().split('T')[0],
                        due_date: finalDueDate.toISOString().split('T')[0],
                        duration_days: durationDays
                    }
                }));

                // Send update to server to persist changes
                axios.patch(route('tasks.update-due-date', { project: project.id, task: task.id }), {
                    start_date: startDate.toISOString().split('T')[0],
                    due_date: finalDueDate.toISOString().split('T')[0],
                    duration_days: durationDays
                })
                .then(() => {
                    console.log('Task date updated successfully on server');
                    state.setIsUpdatingTask(false);
                })
                .catch((error: any) => {
                    console.error('Failed to update task date on server:', error);
                    // Revert optimistic update on error
                    state.setLocalTaskUpdates((prev: any) => {
                        const updated = { ...prev };
                        delete updated[task.id];
                        return updated;
                    });
                    state.setIsUpdatingTask(false);
                });
            }
        }

        state.setDraggedTask(null);
    };

    // Get all tasks with their row positions for rendering
    const getAllTasksWithRows = () => {
        const tasksWithRows: any[] = [];
        const rowTracker: { [key: string]: number } = {};

        allTasks.forEach(task => {
            if (!isMultiDayTask(task) || !task.start_date || !task.due_date) return;

            const startDate = new Date(task.start_date);
            const endDate = new Date(task.due_date);
            
            // Find available row for this task
            let row = 0;
            const taskKey = `${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}`;
            
            // Check for conflicts with existing tasks
            while (true) {
                let hasConflict = false;
                
                for (const existingTask of tasksWithRows) {
                    if (existingTask.row === row) {
                        const existingStart = new Date(existingTask.start_date);
                        const existingEnd = new Date(existingTask.due_date);
                        
                        // Check for overlap
                        if (!(endDate < existingStart || startDate > existingEnd)) {
                            hasConflict = true;
                            break;
                        }
                    }
                }
                
                if (!hasConflict) break;
                row++;
            }

            tasksWithRows.push({
                ...task,
                row
            });
        });

        return tasksWithRows;
    };

    return {
        isMounted,
        calendarDays,
        weeks,
        navigateToPrevMonth,
        navigateToNextMonth,
        handleDragStart,
        handleDragCancel,
        handleDragEnd,
        getAllTasksWithRows,
        allTasks,
    };
};
