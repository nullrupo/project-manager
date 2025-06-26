import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TaskCreateModal from '@/components/task-create-modal';
import TaskDetailModal from '@/components/task-detail-modal';
import { Project } from '@/types/project-manager';
import { router } from '@inertiajs/react';
import { Plus, Users, ListTodo, Tag, Calendar, BarChart3, Clock, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, GripVertical, Settings, Crown, Trash2, Lock, Edit, Filter } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useSensor, useSensors, PointerSensor, MouseSensor } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import axios from 'axios';
import React from 'react';

interface ProjectCalendarViewProps {
    project: Project;
    state: any;
}

const avatarColors = ['#F87171', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA', '#F472B6', '#FCD34D', '#6EE7B7', '#818CF8', '#F9A8D4'];
function getColorForIndex(index: number, prevColorIndex: number = -1) {
    let colorIndex = index % avatarColors.length;
    if (colorIndex === prevColorIndex) {
        colorIndex = (colorIndex + 1) % avatarColors.length;
    }
    return colorIndex;
}

// Helper to map JS getDay() to Monday=0, ..., Sunday=6
function getMondayFirstDayIndex(date: Date) {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
}

export default function ProjectCalendarView({ project, state }: ProjectCalendarViewProps) {
    const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'week' | 'day'>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    // Drag and drop state
    const [activeTask, setActiveTask] = useState<any>(null);
    const [draggedTask, setDraggedTask] = useState<any>(null);
    const [isUpdatingTask, setIsUpdatingTask] = useState(false);
    const [isDragInProgress, setIsDragInProgress] = useState(false);

    // Local state for optimistic updates
    const [localTaskUpdates, setLocalTaskUpdates] = useState<{[key: number]: any}>({});

    // Track if any resize handle is being used
    const [isAnyHandleResizing, setIsAnyHandleResizing] = useState(false);

    // Track if component is mounted to prevent hydration issues
    const [isMounted, setIsMounted] = useState(false);

    // Use ref to track recent drag operations
    const recentDragRef = useRef(false);

    // 1. Add state for hidden days and filter UI
    const [hiddenDays, setHiddenDays] = useState<{ sat: boolean; sun: boolean }>({ sat: false, sun: false });
    const visibleDays = [0, 1, 2, 3, 4, 5, 6].filter(
        d => !(d === 5 && hiddenDays.sat) && !(d === 6 && hiddenDays.sun)
    ); // 0=Mon, ..., 6=Sun
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const reorderedDayLabels = [dayLabels[0], dayLabels[1], dayLabels[2], dayLabels[3], dayLabels[4], dayLabels[5], dayLabels[6]];

    // Shared priority color function
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-l-red-500';
            case 'high': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-l-orange-500';
            case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-l-yellow-500';
            case 'low': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-l-green-500';
            default: return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-l-blue-500';
        }
    };

    // Calendar utility functions
    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonthMonday = (date: Date) => {
        // Returns 0 for Monday, 6 for Sunday
        const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return (day === 0 ? 6 : day - 1);
    };

    // Place these at the top of the function body, before generateCalendarDays
    const getAllProjectTasks = () => {
        const tasks: any[] = [];
        project.boards?.forEach(board => {
            board.lists?.forEach(list => {
                list.tasks?.forEach(task => {
                    // Apply local updates if they exist
                    const updatedTask = localTaskUpdates[task.id]
                        ? { ...task, ...localTaskUpdates[task.id] }
                        : task;
                    tasks.push({
                        ...updatedTask,
                        boardName: board.name,
                        listName: list.name
                    });
                });
            });
        });
        return tasks;
    };
    const getTasksForDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        const allTasks = getAllProjectTasks();
        if (!allTasks || allTasks.length === 0) return [];
        return allTasks.filter(task => {
            if (!task || !task.due_date) return false;
            const taskDueDate = task.due_date.split('T')[0];
            // Only include single-day tasks that aren't already rendered as strips
            // Multi-day tasks and tasks with start_date are rendered as strips
            const isRenderedAsStrip = task.start_date && task.duration_days && task.duration_days >= 1;
            return taskDueDate === dateStr && !isRenderedAsStrip;
        });
    };

    // Utility to always calculate due_date from start_date and duration_days
    function calculateDueDate(startDate: string, durationDays: number) {
        const start = new Date(startDate);
        start.setDate(start.getDate() + durationDays - 1);
        return start.toISOString().split('T')[0];
    }

    // Fix week calculation logic
    const generateCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonthMonday(currentDate); // Use Monday as first day
        const days = [];
        // Calculate offset for Monday as first day
        const offset = firstDay;
        // Previous month's trailing days
        if (offset > 0) {
            const prevMonthYear = month === 0 ? year - 1 : year;
            const prevMonthIndex = month === 0 ? 11 : month - 1;
            const daysInPrevMonth = new Date(prevMonthYear, prevMonthIndex + 1, 0).getDate();
            for (let i = offset - 1; i >= 0; i--) {
                days.push({
                    date: new Date(prevMonthYear, prevMonthIndex, daysInPrevMonth - i),
                    isCurrentMonth: false,
                    tasks: []
                });
            }
        }
        // Current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            days.push({
                date,
                isCurrentMonth: true,
                tasks: getTasksForDate(date)
            });
        }
        // Next month's leading days
        let totalDays = days.length;
        while (totalDays % 7 !== 0) {
            const nextMonthYear = month === 11 ? year + 1 : year;
            const nextMonthIndex = month === 11 ? 0 : month + 1;
            days.push({
                date: new Date(nextMonthYear, nextMonthIndex, totalDays - daysInMonth - offset + 1),
                isCurrentMonth: false,
                tasks: []
            });
            totalDays++;
        }
        // Always split into weeks of 7 for robust grid
        const weeks: any[][] = [];
        for (let i = 0; i < days.length; i += 7) {
            weeks.push(days.slice(i, i + 7));
        }
        // For each week, filter out hidden days (but keep week grouping)
        const filteredWeeks: any[][] = weeks.map(week => week.filter(dayObj => visibleDays.includes(getMondayFirstDayIndex(dayObj.date))));
        return filteredWeeks;
    };

    // Use the new weeks structure directly
    const numCols = visibleDays.length;
    const weeks: any[][] = generateCalendarDays();

    // 1. Add a ref to measure the cell width
    const cellRef = useRef<HTMLDivElement>(null);
    const [cellWidth, setCellWidth] = useState(0);
    useEffect(() => {
        if (cellRef.current) {
            setCellWidth(cellRef.current.offsetWidth);
        }
    }, [numCols, weeks]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Task assignment modal state
    const [assignTaskModalOpen, setAssignTaskModalOpen] = useState(false);
    const [taskToAssignId, setTaskToAssignId] = useState<number | null>(null);

    // Task duration modal state
    const [durationModalOpen, setDurationModalOpen] = useState(false);
    const [taskToExtend, setTaskToExtend] = useState<any>(null);

    // Task detail modal state
    const [taskDetailModalOpen, setTaskDetailModalOpen] = useState(false);
    const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<any>(null);

    // Member panel state
    const [memberPanelOpen, setMemberPanelOpen] = useState(false);

    // Task create modal state
    const [taskCreateModalOpen, setTaskCreateModalOpen] = useState(false);

    // --- Normalized members list: always includes owner, deduplicated ---
    const normalizedMembers = [
        ...(project.members || []),
        ...(project.owner ? [project.owner] : [])
    ].filter((m, i, arr) => m && arr.findIndex(x => x.id === m.id) === i);

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (direction === 'prev') {
                newDate.setMonth(prev.getMonth() - 1);
            } else {
                newDate.setMonth(prev.getMonth() + 1);
            }
            return newDate;
        });
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const formatMonthYear = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    // Get all tasks from project boards
    const getAllTasksAsStrips = () => {
        const allTasks = getAllProjectTasks();
        if (!allTasks || allTasks.length === 0) return [];
        return allTasks
            .filter(task => !!task && (!!task.due_date || !!task.start_date))
            .map(task => {
                const start_date = task.start_date || task.due_date;
                const duration_days = task.duration_days || 1;
                const due_date = calculateDueDate(start_date, duration_days);
                return {
                    ...task,
                    start_date,
                    due_date,
                    duration_days
                };
            });
    };

    // Calculate row positions for all tasks to prevent overlapping
    const getAllTasksWithRows = () => {
        const allTasks = getAllTasksAsStrips();
        if (!allTasks.length) return [];

        // Sort tasks by start date, then by duration (longer tasks first for better packing)
        const sortedTasks = [...allTasks].sort((a, b) => {
            const dateA = new Date(a.start_date.split('T')[0]);
            const dateB = new Date(b.start_date.split('T')[0]);
            const dateDiff = dateA.getTime() - dateB.getTime();

            // If same start date, prioritize longer tasks
            if (dateDiff === 0) {
                return (b.duration_days || 1) - (a.duration_days || 1);
            }
            return dateDiff;
        });

        // Track occupied rows for each date
        const occupiedRows: { [dateKey: string]: Set<number> } = {};

        // Assign row positions to tasks
        const tasksWithRows = sortedTasks.map(task => {
            const startDate = new Date(task.start_date.split('T')[0]);
            let endDate: Date;

            // Calculate end date properly
            if (task.due_date) {
                endDate = new Date(task.due_date.split('T')[0]);
            } else if (task.duration_days) {
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + task.duration_days - 1);
            } else {
                endDate = new Date(startDate);
            }

            // Find the first available row for this task's entire duration
            let assignedRow = 0;
            let rowFound = false;

            while (!rowFound && assignedRow < 10) { // Safety limit
                let canUseRow = true;

                // Check if this row is available for the entire task duration
                const currentDate = new Date(startDate);
                while (currentDate <= endDate) {
                    const dateKey = currentDate.toISOString().split('T')[0];

                    if (!occupiedRows[dateKey]) {
                        occupiedRows[dateKey] = new Set();
                    }

                    if (occupiedRows[dateKey].has(assignedRow)) {
                        canUseRow = false;
                        break;
                    }

                    currentDate.setDate(currentDate.getDate() + 1);
                }

                if (canUseRow) {
                    // Mark this row as occupied for the entire task duration
                    const currentDate = new Date(startDate);
                    while (currentDate <= endDate) {
                        const dateKey = currentDate.toISOString().split('T')[0];
                        occupiedRows[dateKey].add(assignedRow);
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                    rowFound = true;

                } else {
                    assignedRow++;
                }
            }

            return {
                ...task,
                taskRow: assignedRow
            };
        });

        return tasksWithRows;
    };

    // Check if a task spans multiple days (now all tasks are treated as strips)
    const isMultiDayTask = (task: any) => {
        return task.duration_days && task.duration_days > 1;
    };

    // Get the position of a date within a multi-day task
    const getTaskDatePosition = (task: any, date: Date) => {
        if (!isMultiDayTask(task)) return 'single';

        const dateStr = date.toISOString().split('T')[0];
        const startDateStr = task.start_date.split('T')[0];
        const endDateStr = task.due_date.split('T')[0];

        if (dateStr === startDateStr) return 'start';
        if (dateStr === endDateStr) return 'end';
        return 'middle';
    };

    // Drag and drop handlers
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3,
            },
        }),
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 3,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;

        // Prevent dragging if a resize handle is being used
        if (isAnyHandleResizing) {
            return;
        }

        setIsDragInProgress(true);
        recentDragRef.current = true;

        // Check if dragging a member
        if (active.id.toString().startsWith('member-')) {
            const memberId = active.id.toString().split('-')[1];
            const member = normalizedMembers.find(m => m.id.toString() === memberId);
            setActiveTask({ type: 'member', ...member });
            setDraggedTask({ type: 'member', ...member });
            return;
        }

        let task;
        if (active.id.toString().startsWith('multiday-task-')) {
            // Dragging task strip (both single day and multi-day)
            const taskId = active.id.toString().split('-')[2];
            task = getAllProjectTasks().find(t => t.id.toString() === taskId);
        } else {
            // Dragging from task list
            task = getAllProjectTasks().find(t => t.id.toString() === active.id);
        }

        setActiveTask(task);
        setDraggedTask(task);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        // Always reset drag state with longer delay to prevent click events
        setTimeout(() => {
            setIsDragInProgress(false);
            recentDragRef.current = false;
        }, 300); // Longer delay to prevent click events

        if (!over) {
            setActiveTask(null);
            setDraggedTask(null);
            return;
        }

        // Handle member assignment to tasks
        if (active.id.toString().startsWith('member-')) {
            const memberId = active.id.toString().split('-')[1];
            const member = normalizedMembers.find(m => m.id.toString() === memberId);

            if (!member) {
                setActiveTask(null);
                setDraggedTask(null);
                return;
            }

            // Check if dropped on a task
            let targetTask = null;
            if (over.id.toString().startsWith('multiday-task-drop-')) {
                const taskId = over.id.toString().split('-')[3];
                targetTask = getAllProjectTasks().find(t => t.id.toString() === taskId);
            } else if (over.id.toString().startsWith('side-task-drop-')) {
                const taskId = over.id.toString().split('-')[3];
                targetTask = getAllProjectTasks().find(t => t.id.toString() === taskId);
            } else if (over.id.toString().startsWith('day-task-drop-')) {
                const taskId = over.id.toString().split('-')[3];
                targetTask = getAllProjectTasks().find(t => t.id.toString() === taskId);
            }

            if (targetTask) {
                // Directly assign member to task without modal
                const currentAssignees = targetTask.assignees?.map((a: any) => a.id) || [];
                const newAssignees = currentAssignees.includes(member.id)
                    ? currentAssignees.filter((id: number) => id !== member.id) // Remove if already assigned
                    : [...currentAssignees, member.id]; // Add if not assigned

                // Update task with new assignees
                router.put(route('tasks.update', { project: project.id, task: targetTask.id }), {
                    title: targetTask.title,
                    description: targetTask.description || '',
                    priority: targetTask.priority,
                    status: targetTask.status,
                    estimate: targetTask.estimate,
                    due_date: targetTask.due_date,
                    start_date: targetTask.start_date,
                    duration_days: targetTask.duration_days,
                    list_id: targetTask.list_id,
                    assignee_ids: newAssignees,
                    label_ids: targetTask.labels?.map((l: any) => l.id) || [],
                    is_archived: targetTask.is_archived || false,
                }, {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        console.log(`Successfully ${currentAssignees.includes(member.id) ? 'removed' : 'assigned'} ${member.name} ${currentAssignees.includes(member.id) ? 'from' : 'to'} task: ${targetTask.title}`);
                    },
                    onError: (errors) => {
                        console.error('Failed to assign task:', errors);
                    }
                });
            }

            setActiveTask(null);
            setDraggedTask(null);
            return;
        }

        // Get the task being dragged
        let task = draggedTask;
        let isFromCalendar = false;

        // Check if dragging from calendar
        if (active.id.toString().startsWith('multiday-task-')) {
            const taskId = active.id.toString().split('-')[2];
            task = getAllProjectTasks().find(t => t.id.toString() === taskId);
            isFromCalendar = true;
        }

        if (!task) {
            setActiveTask(null);
            setDraggedTask(null);
            return;
        }

        // Check if dropped on a calendar day
        if (over.id.toString().startsWith('calendar-day-')) {
            const dateStr = over.id.toString().replace('calendar-day-', '');
            const newStartDate = new Date(dateStr).toISOString().split('T')[0];
            let durationDays = 1;
            if (task.duration_days) {
                durationDays = task.duration_days;
            }
            const newDueDate = calculateDueDate(newStartDate, durationDays);

            setIsUpdatingTask(true);
            setLocalTaskUpdates(prev => ({
                ...prev,
                [task.id]: {
                    start_date: newStartDate,
                    due_date: newDueDate,
                    duration_days: durationDays
                }
            }));
            axios.patch(route('tasks.update-due-date', { project: project.id, task: task.id }), {
                start_date: newStartDate,
                due_date: newDueDate,
                duration_days: durationDays
            })
            .then(response => {
                setIsUpdatingTask(false);
            })
            .catch(error => {
                setLocalTaskUpdates(prev => {
                    const updated = { ...prev };
                    delete updated[task.id];
                    return updated;
                });
                setIsUpdatingTask(false);
            });
        }

        setActiveTask(null);
        setDraggedTask(null);
    };

    const handleDragCancel = () => {
        setIsDragInProgress(false);
        recentDragRef.current = false;
        setActiveTask(null);
        setDraggedTask(null);
    };

    // Handle task resize
    const handleTaskResize = async (task: any, newDuration: number) => {
        const currentTask = { ...task, ...(localTaskUpdates[task.id] || {}) };
        if (newDuration === currentTask.duration_days) return;
        const startDate = new Date(currentTask.start_date.split('T')[0]);
        const newDueDate = calculateDueDate(currentTask.start_date, newDuration);
        setLocalTaskUpdates(prev => ({
            ...prev,
            [task.id]: {
                ...prev[task.id],
                duration_days: newDuration,
                due_date: newDueDate
            }
        }));
        router.put(route('tasks.update', { project: project.id, task: task.id }), {
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            status: task.status,
            estimate: task.estimate,
            start_date: currentTask.start_date,
            due_date: newDueDate,
            duration_days: newDuration,
            list_id: task.list_id,
            assignee_ids: task.assignees?.map((a: any) => a.id) || [],
            label_ids: task.labels?.map((l: any) => l.id) || [],
            is_archived: task.is_archived || false,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Enhanced Resize Handle Component with colored edges
    const ResizeHandle = ({ task, direction, onResize }: { task: any; direction: 'start' | 'end'; onResize: (newDuration: number) => void }) => {
        const [isResizing, setIsResizing] = useState(false);

        const handleMouseDown = (e: React.MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            e.nativeEvent.stopImmediatePropagation();

            console.log(`Starting resize: direction=${direction}, currentDuration=${task.duration_days}`);

            const startXPos = e.clientX;
            const originalDur = task.duration_days || 1;

            setIsResizing(true);
            setIsAnyHandleResizing(true);

            const mouseMoveHandler = (e: MouseEvent) => {
                const deltaX = e.clientX - startXPos;
                const calendarElement = document.querySelector('.grid.grid-cols-7');
                if (!calendarElement) return;

                const calendarWidth = calendarElement.getBoundingClientRect().width;
                const dayWidth = calendarWidth / 7;
                const daysDelta = Math.round(deltaX / dayWidth);

                let newDuration = originalDur;
                if (direction === 'end') {
                    // For end handle: positive delta = extend, negative delta = shrink
                    newDuration = Math.max(1, originalDur + daysDelta);
                } else {
                    // For start handle: negative delta = extend backward, positive delta = shrink from start
                    newDuration = Math.max(1, originalDur - daysDelta);
                }

                if (newDuration !== originalDur) {
                    console.log(`Mouse move: ${originalDur} -> ${newDuration} (delta: ${daysDelta}, direction: ${direction})`);
                    onResize(newDuration);
                }
            };

            const mouseUpHandler = (e: MouseEvent) => {
                const deltaX = e.clientX - startXPos;
                const calendarElement = document.querySelector('.grid.grid-cols-7');
                if (!calendarElement) return;

                const calendarWidth = calendarElement.getBoundingClientRect().width;
                const dayWidth = calendarWidth / 7;
                const daysDelta = Math.round(deltaX / dayWidth);

                let newDuration = originalDur;
                if (direction === 'end') {
                    // For end handle: positive delta = extend, negative delta = shrink
                    newDuration = Math.max(1, originalDur + daysDelta);
                } else {
                    // For start handle: negative delta = extend backward, positive delta = shrink from start
                    newDuration = Math.max(1, originalDur - daysDelta);
                }

                if (newDuration !== originalDur) {
                    console.log(`Resize complete: ${originalDur} -> ${newDuration} days (direction: ${direction})`);
                    onResize(newDuration);
                }

                setIsResizing(false);
                setIsAnyHandleResizing(false);
                document.removeEventListener('mousemove', mouseMoveHandler);
                document.removeEventListener('mouseup', mouseUpHandler);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            };

            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        };

        // Get priority-based colors for the resize handles - clean and simple
        const getHandleColor = (priority: string) => {
            switch (priority) {
                case 'urgent': return 'bg-red-500/90 hover:bg-red-500';
                case 'high': return 'bg-orange-500/90 hover:bg-orange-500';
                case 'medium': return 'bg-yellow-500/90 hover:bg-yellow-500';
                case 'low': return 'bg-green-500/90 hover:bg-green-500';
                default: return 'bg-blue-500/90 hover:bg-blue-500';
            }
        };

        return (
            <div
                className={`resize-handle absolute ${direction === 'start' ? 'left-0' : 'right-0'} top-0 bottom-0 w-2 cursor-col-resize transition-all duration-200 ease-out ${isResizing ? 'opacity-100 bg-white/40' : 'opacity-0 group-hover:opacity-60 hover:bg-white/20'} ${direction === 'start' ? 'rounded-l' : 'rounded-r'}`}
                onMouseDown={handleMouseDown}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                title={`Drag to ${direction === 'start' ? 'move start date' : 'extend/shrink duration'}`}
                style={{
                    background: isResizing ? 'rgba(255,255,255,0.4)' : undefined,
                }}
            >
                {/* Colored edge indicator */}
                <div className={`absolute ${direction === 'start' ? 'left-0' : 'right-0'} top-0 bottom-0 w-0.5 ${getHandleColor(task.priority)} transition-all duration-200 ${isResizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-80'}`} />
            </div>
        );
    };

    // Early return for loading state
    if (!isMounted) {
        return (
            <Card className="rounded-t-none border-t-0 mt-0">
                <CardContent className="flex items-center justify-center h-64">
                    <div className="text-muted-foreground">Loading calendar...</div>
                </CardContent>
            </Card>
        );
    }

    // Draggable Member Component
    const DraggableMember = ({ member, idx }: { member: any; idx: number }) => {
        const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
            id: `member-${member.id}`,
            data: { member, type: 'member' },
            disabled: isAnyHandleResizing
        });

        const style = {
            transform: CSS.Translate.toString(transform),
            opacity: isDragging ? 0.5 : 1,
        };

        return (
            <div
                ref={setNodeRef}
                style={style}
                {...listeners}
                {...attributes}
                className={`flex items-center gap-2 p-2 bg-background border rounded-lg cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${isDragging ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
                title={`Drag ${member.name} to assign to tasks`}
            >
                <Avatar className="h-8 w-8 border">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="text-sm font-medium" style={{ backgroundColor: avatarColors[getColorForIndex(idx)], color: '#fff' }}>
                        {member.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">{member.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{member.email}</span>
                </div>
            </div>
        );
    };

    // Draggable Task Component
    const DraggableTask = ({ task }: { task: any }) => {
        const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
            id: task.id.toString(),
            data: { task },
            disabled: isAnyHandleResizing
        });

        const { setNodeRef: setDropRef, isOver } = useDroppable({
            id: `side-task-drop-${task.id}`,
            data: { task, type: 'task' }
        });

        const style = {
            transform: CSS.Translate.toString(transform),
            opacity: isDragging ? 0.5 : 1,
        };

        // Combine refs
        const setNodeRef = (node: HTMLElement | null) => {
            setDragRef(node);
            setDropRef(node);
        };

        return (
            <div
                ref={setNodeRef}
                style={style}
                {...listeners}
                {...attributes}
                className={`p-2 border-l-4 rounded-md transition-all duration-150 group relative cursor-grab active:cursor-grabbing hover:shadow-md ${getPriorityColor(task.priority)} ${isDragging ? 'ring-2 ring-blue-500 shadow-lg' : ''} ${isOver ? 'ring-2 ring-green-400 bg-green-50 dark:bg-green-950/20' : ''}`}
                title={`Drag to calendar (ID: ${task.id}) - Click and drag me! | Right-click to assign`}
                onClick={(e) => {
                    if (task && task.id) {
                        setTaskToAssignId(task.id);
                        setAssignTaskModalOpen(true);
                    }
                }}
                onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setTaskToAssignId(task.id);
                    setAssignTaskModalOpen(true);
                }}
            >
                <div className="flex items-start justify-between mb-1 pr-8">
                    <h4 className="font-medium text-xs truncate flex-1">{task.title}</h4>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {task.assignees?.slice(0, 2).map((assignee: any) => {
                            const memberIndex = normalizedMembers.findIndex(m => m.id === assignee.id);
                            const colorIndex = getColorForIndex(memberIndex);
                            return (
                                <Avatar key={assignee.id} className="h-4 w-4 border">
                                    <AvatarImage src={assignee.avatar} />
                                    <AvatarFallback className="text-xs" style={{ backgroundColor: avatarColors[colorIndex], color: '#fff' }}>
                                        {assignee.name?.charAt(0).toUpperCase() || '?'}
                                    </AvatarFallback>
                                </Avatar>
                            );
                        })}
                        {task.assignees?.length > 2 && (
                            <div className="h-4 w-4 rounded-full bg-muted text-xs flex items-center justify-center">
                                +{task.assignees.length - 2}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pr-8">
                    <span className="truncate flex-1 mr-2">{task.boardName} • {task.listName}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {task.duration_days && task.duration_days > 1 && (
                            <Badge variant="secondary" className="text-xs">
                                {task.duration_days}d
                            </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                            {task.priority}
                        </Badge>
                    </div>
                </div>

                {/* Assignment button */}
                <button
                    className="absolute top-0 right-0 h-full w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-background to-transparent hover:bg-muted/50 rounded-r-md"
                    onClick={(e) => {
                        e.stopPropagation();
                        setTaskToAssignId(task.id);
                        setAssignTaskModalOpen(true);
                    }}
                    title="Assign task"
                >
                    <Users className="h-3 w-3" />
                </button>
            </div>
        );
    };

    // Droppable Calendar Day Component
    const DroppableCalendarDay = React.forwardRef<HTMLDivElement, { day: any; className?: string }>(
        ({ day, className = "" }, ref) => {
            const dropId = `calendar-day-${day.date.toISOString().split('T')[0]}`;
            const { setNodeRef, isOver } = useDroppable({ id: dropId });
            const dayTasks = getTasksForDate(day.date);

            return (
                <div
                    ref={node => { setNodeRef(node); if (typeof ref === 'function') ref(node); else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node; }}
                    className={`min-h-[140px] p-1 border border-border transition-all duration-200 overflow-hidden ${
                        !day.isCurrentMonth
                            ? 'bg-muted/20 text-muted-foreground'
                            : 'bg-background hover:bg-muted/30'
                    } ${isToday(day.date) ? 'bg-primary/10 border-primary/20' : ''} ${isOver ? 'ring-2 ring-blue-400 bg-blue-100/30 dark:bg-blue-900/20' : ''} ${className}`}
                >
                    <div className={`text-sm font-medium mb-1 ${
                        isToday(day.date) ? 'text-primary' : day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                        {day.date.getDate()}
                    </div>

                    <div className="space-y-0.5 relative">
                        {/* Show small task strips for this day */}
                        {dayTasks.slice(0, 4).map((task, index) => {
                            const { setNodeRef: setTaskDropRef, isOver: isTaskOver } = useDroppable({
                                id: `day-task-drop-${task.id}`,
                                data: { task, type: 'task' }
                            });

                            const taskDropFeedback = isTaskOver && draggedTask?.type === 'member';

                            return (
                                <div
                                    key={`day-task-${task.id}-${day.date.toISOString()}`}
                                    ref={setTaskDropRef}
                                    className={`group relative mb-0.5 rounded-sm border-l-2 cursor-pointer transition-all duration-150 ${getPriorityColor(task.priority)} ${taskDropFeedback ? 'ring-2 ring-green-400 bg-green-50 dark:bg-green-950/20' : ''}`}
                                    style={{
                                        height: '16px', // Slightly larger for better visibility
                                        zIndex: 10 + index // Ensure proper stacking
                                    }}
                                    title={`${task.title} - ${task.priority} priority${task.assignees?.length ? ` | Assigned to: ${task.assignees.map((a: any) => a.name).join(', ')}` : ' | Unassigned'} | Right-click to assign`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!isDragInProgress && !recentDragRef.current) {
                                            setSelectedTaskForDetail(task);
                                            setTaskDetailModalOpen(true);
                                        }
                                    }}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setTaskToAssignId(task.id);
                                        setAssignTaskModalOpen(true);
                                    }}
                                >
                                    {/* Main content - always visible */}
                                    <div className="flex items-center h-full px-1.5 relative">
                                        <span className="text-xs truncate flex-1 opacity-90">
                                            {task.title}
                                        </span>

                                        {/* Show assignee count if any */}
                                        {task.assignees?.length > 0 && (
                                            <div className="flex items-center gap-0.5 ml-1 flex-shrink-0">
                                                <Users className="h-2 w-2 opacity-60" />
                                                <span className="text-xs opacity-60">{task.assignees.length}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {dayTasks.length > 4 && (
                            <div className="text-xs text-muted-foreground opacity-60 px-1">
                                +{dayTasks.length - 4} more
                            </div>
                        )}
                    </div>
                </div>
            );
        }
    );

    type MultiDayTaskStripProps = { task: any; calendarDays: any[]; numCols: number; cellWidth: number };
    const MultiDayTaskStrip = ({ task, calendarDays, numCols, cellWidth }: MultiDayTaskStripProps) => {
        const localUpdate = localTaskUpdates[task.id] || {};
        const currentTask = {
            ...task,
            ...localUpdate,
            taskRow: task.taskRow
        };
        if (!currentTask || !currentTask.start_date || !currentTask.duration_days || !calendarDays || calendarDays.length === 0) {
            return null;
        }
        const startDateStr = currentTask.start_date.split('T')[0];
        const duration = currentTask.duration_days;
        if (!startDateStr || !duration) {
            return null;
        }
        const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
            id: `multiday-task-${currentTask.id}`,
            data: { task: currentTask, source: 'calendar' },
            disabled: isAnyHandleResizing
        });
        const { setNodeRef: setDropRef, isOver } = useDroppable({
            id: `multiday-task-drop-${currentTask.id}`,
            data: { task: currentTask, type: 'task' }
        });
        const showDropFeedback = isOver && draggedTask?.type === 'member';
        const style = {
            transform: CSS.Translate.toString(transform),
            opacity: isDragging ? 0.5 : 1,
        };
        const setNodeRef = (node: HTMLElement | null) => {
            setDragRef(node);
            setDropRef(node);
        };
        const startDate = new Date(startDateStr);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + duration - 1); // always match duration_days
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return null;
        }
        // Find all visible days in the task's range (inclusive)
        const visibleDayIndices: number[] = [];
        const startDateISO = startDate.toISOString().split('T')[0];
        const endDateISO = endDate.toISOString().split('T')[0];
        for (let i = 0; i < calendarDays.length; i++) {
            const dISO = calendarDays[i].date.toISOString().split('T')[0];
            if (dISO >= startDateISO && dISO <= endDateISO) {
                visibleDayIndices.push(i);
            }
        }
        if (visibleDayIndices.length === 0) return null;
        // Split into contiguous segments by week
        const segments: { start: number, end: number }[] = [];
        let segStart = visibleDayIndices[0];
        for (let i = 1; i < visibleDayIndices.length; i++) {
            // If not consecutive or not in the same week, start a new segment
            const prevIdx = visibleDayIndices[i - 1];
            const currIdx = visibleDayIndices[i];
            const prevRow = Math.floor(prevIdx / numCols);
            const currRow = Math.floor(currIdx / numCols);
            if (currIdx !== prevIdx + 1 || currRow !== prevRow) {
                segments.push({ start: segStart, end: prevIdx });
                segStart = currIdx;
            }
        }
        segments.push({ start: segStart, end: visibleDayIndices[visibleDayIndices.length - 1] });
        // Render each segment
        return (
            <>
                {segments.map((segment, index) => {
                    const row = Math.floor(segment.start / numCols);
                    const startCol = segment.start % numCols;
                    const span = segment.end - segment.start + 1;
                    return (
                        <div
                            key={`${currentTask.id}-segment-${index}-${currentTask.start_date}-${currentTask.due_date}`}
                            ref={index === 0 ? setNodeRef : undefined}
                            className={`group absolute h-6 ${getPriorityColor(currentTask.priority)} border-l-2 text-xs flex items-center cursor-grab active:cursor-grabbing transition-all duration-150 ease-out shadow-sm ${
                                segments.length === 1 ? 'rounded' :
                                index === 0 ? 'rounded-l' :
                                index === segments.length - 1 ? 'rounded-r' : ''
                            } ${isDragging ? 'ring-2 ring-blue-400 shadow-lg scale-105' : 'hover:shadow-md hover:z-30'} ${showDropFeedback && index === 0 ? 'ring-2 ring-green-400 bg-green-50 dark:bg-green-950/20' : ''}`}
                            style={{
                                top: `${row * 140 + 40 + (currentTask.taskRow || 0) * 22}px`,
                                left: cellWidth ? startCol * cellWidth + 4 : `calc(${(startCol / numCols) * 100}% + 4px)`,
                                width: cellWidth ? span * cellWidth - 8 : `calc(${(span / numCols) * 100}% - 8px)`,
                                ...(index === 0 ? style : {}),
                                zIndex: 20 + (currentTask.taskRow || 0)
                            }}
                            {...(index === 0 && !isAnyHandleResizing ? { ...listeners, ...attributes } : {})}
                            onClick={(e) => {
                                if (!isDragging && !isDragInProgress && !recentDragRef.current && !(e.target as HTMLElement).closest('.resize-handle')) {
                                    setSelectedTaskForDetail(task);
                                    setTaskDetailModalOpen(true);
                                }
                            }}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setTaskToAssignId(task.id);
                                setAssignTaskModalOpen(true);
                            }}
                            title={`${currentTask.title} - ${currentTask.priority} (${currentTask.duration_days}d) | ${currentTask.assignees?.length ? `Assigned to: ${currentTask.assignees.map((a: any) => a.name).join(', ')}` : 'Unassigned'} | Drag to move, resize handles to extend/shrink | Right-click to assign`}
                        >
                            {/* Task content - only show on first segment */}
                            {index === 0 && (
                                <div className="flex items-center gap-1 flex-1 min-w-0 px-2 pr-8">
                                    <div className="flex items-center gap-1 flex-1 min-w-0 group-hover:hidden">
                                        <span className="font-medium truncate text-xs">
                                            {currentTask.title}
                                        </span>
                                        {currentTask.duration_days > 1 && (
                                            <span className="text-xs opacity-60">({currentTask.duration_days}d)</span>
                                        )}
                                    </div>
                                    <div className="hidden group-hover:flex items-center gap-1 flex-1 min-w-0">
                                        {currentTask.assignees?.[0] && (() => {
                                            const assignee = currentTask.assignees[0];
                                            const memberIndex = normalizedMembers.findIndex(m => m.id === assignee.id);
                                            const colorIndex = getColorForIndex(memberIndex);
                                            return (
                                                <Avatar className="h-4 w-4 flex-shrink-0 border border-white/20">
                                                    <AvatarImage src={assignee.avatar} />
                                                    <AvatarFallback className="text-xs font-medium" style={{ backgroundColor: avatarColors[colorIndex], color: '#fff' }}>
                                                        {assignee.name.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            );
                                        })()}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate text-xs">
                                                {currentTask.title}
                                            </div>
                                        </div>
                                        <div className="text-xs opacity-75 flex items-center gap-1 flex-shrink-0">
                                            {currentTask.assignees?.length > 1 && (
                                                <span>+{currentTask.assignees.length - 1}</span>
                                            )}
                                            {currentTask.duration_days > 1 && (
                                                <span>({currentTask.duration_days}d)</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* Resize handles - only on first and last segments */}
                            {index === 0 && (
                                <ResizeHandle
                                    task={currentTask}
                                    direction="start"
                                    onResize={(newDuration) => handleTaskResize(currentTask, newDuration)}
                                />
                            )}
                            {index === segments.length - 1 && (
                                <ResizeHandle
                                    task={currentTask}
                                    direction="end"
                                    onResize={(newDuration) => handleTaskResize(currentTask, newDuration)}
                                />
                            )}
                        </div>
                    );
                })}
            </>
        );
    };

    // Place this at the end of ProjectCalendarView, after all helper components
    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <Card className="rounded-t-none border-t-0">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Project Calendar
                            </CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setMemberPanelOpen(!memberPanelOpen)}
                                className="flex items-center gap-2"
                            >
                                <Users className="h-4 w-4" />
                                <span className="hidden sm:inline">Team</span>
                                {memberPanelOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                            <Separator orientation="vertical" className="h-6" />
                            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                                Today
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="text-center text-lg font-semibold text-primary">
                        {formatMonthYear(currentDate)}
                    </div>
                    {/* Filters: view mode + weekend hide */}
                    <div className="mt-4">
                        <div className="bg-muted/60 rounded border px-4 py-2 flex items-center gap-4">
                            <Filter className="h-4 w-4 text-muted-foreground mr-1" />
                            <span className="text-xs font-semibold text-muted-foreground mr-2">Filters</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">View:</span>
                                <Select value={calendarViewMode} onValueChange={v => setCalendarViewMode(v as any)}>
                                    <SelectTrigger className="w-[110px] h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="day">Day</SelectItem>
                                        <SelectItem value="week">Week</SelectItem>
                                        <SelectItem value="month">Month</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="h-6 w-px bg-border mx-3" />
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">Hide weekends:</span>
                                <div className="flex items-center gap-2 bg-muted/40 rounded-full px-2 py-1">
                                    <label className="flex items-center gap-1 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={hiddenDays.sat}
                                            disabled={hiddenDays.sun && visibleDays.length <= 1}
                                            onChange={e => {
                                                if (e.target.checked && visibleDays.length <= 1) return;
                                                setHiddenDays(h => ({ ...h, sat: e.target.checked }));
                                            }}
                                            className="peer sr-only"
                                        />
                                        <span className="w-9 h-5 bg-gray-300 peer-checked:bg-primary rounded-full relative transition-colors duration-200">
                                            <span className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 peer-checked:translate-x-4`} />
                                        </span>
                                        <span className="ml-1 text-xs">Sat</span>
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={hiddenDays.sun}
                                            disabled={hiddenDays.sat && visibleDays.length <= 1}
                                            onChange={e => {
                                                if (e.target.checked && visibleDays.length <= 1) return;
                                                setHiddenDays(h => ({ ...h, sun: e.target.checked }));
                                            }}
                                            className="peer sr-only"
                                        />
                                        <span className="w-9 h-5 bg-gray-300 peer-checked:bg-primary rounded-full relative transition-colors duration-200">
                                            <span className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 peer-checked:translate-x-4`} />
                                        </span>
                                        <span className="ml-1 text-xs">Sun</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    {memberPanelOpen && (
                        <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
                            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Team Members - Drag to assign tasks
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {normalizedMembers.map((member, idx) => (
                                    <DraggableMember key={member.id} member={member} idx={idx} />
                                ))}
                                {(!normalizedMembers || normalizedMembers.length === 0) && (
                                    <div className="text-sm text-muted-foreground">
                                        No team members in this project
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Task List - Left Side */}
                        <div className="lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        Project Tasks
                                        {isUpdatingTask && (
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                        )}
                                    </CardTitle>
                                    <CardDescription>
                                        Drag tasks to calendar days to set deadlines
                                    </CardDescription>
                                    <Button className="mt-2" onClick={() => setTaskCreateModalOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Task
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 max-h-[880px] overflow-y-auto scrollbar-hide">
                                        {(() => {
                                            const tasksWithoutDueDate = getAllProjectTasks().filter(task => !task.due_date);
                                            const tasksWithDueDate = getAllProjectTasks().filter(task => task.due_date);
                                            if (getAllProjectTasks().length === 0) {
                                                return (
                                                    <div className="text-center py-8 text-muted-foreground">
                                                        <ListTodo className="h-8 w-8 mx-auto mb-2" />
                                                        <p>No tasks in this project</p>
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div className="space-y-3">
                                                    {/* Tasks without due dates */}
                                                    {tasksWithoutDueDate.length > 0 && (
                                                        <div>
                                                            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                                                <Clock className="h-4 w-4" />
                                                                Unscheduled ({tasksWithoutDueDate.length})
                                                            </h4>
                                                            <div className="space-y-1">
                                                                {tasksWithoutDueDate.map((task) => (
                                                                    <DraggableTask key={task.id} task={task} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {/* Tasks with due dates */}
                                                    {tasksWithDueDate.length > 0 && (
                                                        <div>
                                                            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                                                <Calendar className="h-4 w-4" />
                                                                Scheduled ({tasksWithDueDate.length})
                                                            </h4>
                                                            <div className="space-y-1">
                                                                {tasksWithDueDate
                                                                    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                                                                    .map((task) => (
                                                                        <DraggableTask key={task.id} task={task} />
                                                                    ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        {/* Calendar - Right Side */}
                        <div className="lg:col-span-3">
                            <div className="w-full max-w-5xl mx-auto">
                                <div className="border rounded-lg overflow-hidden bg-background">
                                    {/* Week days header */}
                                    <div className={`grid grid-cols-${numCols} bg-muted/50`} style={{ gridTemplateColumns: `repeat(${numCols}, 1fr)` }}>
                                        {reorderedDayLabels.filter((_, idx) => visibleDays.includes(idx + 1 > 6 ? 0 : idx + 1)).map((day, i) => (
                                            <div
                                                key={day}
                                                className={`p-2 text-center text-sm font-medium border-r border-border last:border-r-0
                                                    ${(day === 'Sat' && hiddenDays.sat) || (day === 'Sun' && hiddenDays.sun)
                                                        ? 'hidden'
                                                        : day === 'Sat' || day === 'Sun'
                                                            ? 'bg-muted/80 text-muted-foreground/80'
                                                            : 'text-muted-foreground'
                                                    }`}
                                            >
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                    {/* Calendar weeks and overlay */}
                                    <div className={`border border-border bg-muted/10 relative`} style={{ gridTemplateColumns: `repeat(${numCols}, 1fr)` }}>
                                        {visibleDays.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                Cannot hide all days. At least one day must be visible.
                                            </div>
                                        ) : (
                                            <>
                                                {weeks.map((week, weekIndex) => (
                                                    <div
                                                        key={`week-${weekIndex}`}
                                                        className={`grid grid-cols-${numCols}`}
                                                        style={{ gridTemplateColumns: `repeat(${numCols}, 1fr)` }}
                                                    >
                                                        {week.map((day: any, dayIndex: any) => (
                                                            <DroppableCalendarDay
                                                                key={`day-${day?.date?.toISOString() || `${weekIndex}-${dayIndex}`}`}
                                                                day={day}
                                                                className={`min-h-[140px] border border-border bg-background transition-all duration-200 overflow-hidden
                                                                    ${!day.isCurrentMonth
                                                                        ? 'bg-muted/20 text-muted-foreground'
                                                                        : day.date.getDay() === 6 || day.date.getDay() === 0
                                                                            ? 'bg-muted/80 text-muted-foreground/80'
                                                                            : 'bg-background hover:bg-muted/30'}
                                                                    ${isToday(day.date) ? 'bg-primary/10 border-primary/20' : ''}`}
                                                                ref={weekIndex === 0 && dayIndex === 0 ? (cellRef as React.RefObject<HTMLDivElement>) : undefined}
                                                            />
                                                        ))}
                                                    </div>
                                                ))}
                                                {/* All task strips overlay */}
                                                {weeks && weeks.length > 0 && getAllTasksWithRows().map((task) => (
                                                    <MultiDayTaskStrip
                                                        key={`task-strip-${task.id}`}
                                                        task={task}
                                                        calendarDays={weeks.flat()}
                                                        numCols={numCols}
                                                        cellWidth={cellWidth}
                                                    />
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            {/* Task Create Modal */}
            <TaskCreateModal
                open={taskCreateModalOpen}
                onOpenChange={setTaskCreateModalOpen}
                project={project}
                members={normalizedMembers}
                labels={project.boards?.flatMap(board => board.lists?.flatMap(list => list.tasks?.flatMap(task => task.labels || []) || []) || [])?.filter((v, i, a) => v && a.findIndex(t => t.id === v.id) === i) || []}
                tags={[]}
                sections={[]}
            />
            {/* Task Assignment Modal */}
            {taskToAssignId && (
                <TaskAssignmentModal
                    task={getAllProjectTasks().find(t => t.id === taskToAssignId)}
                    project={project}
                    open={assignTaskModalOpen}
                    onOpenChange={setAssignTaskModalOpen}
                />
            )}
            {/* Task Duration Modal */}
            <TaskDurationModal
                task={taskToExtend}
                project={project}
                open={durationModalOpen}
                onOpenChange={setDurationModalOpen}
            />
            {/* Task Detail Modal */}
            <TaskDetailModal
                task={selectedTaskForDetail}
                project={project}
                open={taskDetailModalOpen}
                onOpenChange={setTaskDetailModalOpen}
                availableLists={project.boards?.flatMap(board => board.lists || []) || []}
            />
            {/* Drag Overlay */}
            <DragOverlay>
                {activeTask ? (
                    activeTask.type === 'member' ? (
                        // Member drag overlay
                        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border rounded-lg shadow-lg opacity-90">
                            <Avatar className="h-8 w-8 border">
                                <AvatarImage src={activeTask.avatar} />
                                <AvatarFallback className="text-sm font-medium">
                                    {activeTask.name?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium truncate">{activeTask.name}</span>
                                <span className="text-xs text-muted-foreground truncate">Drag to assign to task</span>
                            </div>
                        </div>
                    ) : (
                        // Task drag overlay
                        <div className="p-3 border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/20 rounded-lg shadow-lg opacity-90">
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-sm">{activeTask.title}</h4>
                                <div className="flex items-center gap-1">
                                    {activeTask.assignees?.slice(0, 2).map((assignee: any, idx: number) => {
                                        const colorIndex = getColorForIndex(idx);
                                        return (
                                            <Avatar key={assignee.id} className="h-4 w-4 border">
                                                <AvatarImage src={assignee.avatar} />
                                                <AvatarFallback className="text-xs" style={{ backgroundColor: avatarColors[colorIndex], color: '#fff' }}>
                                                    {assignee.name?.charAt(0).toUpperCase() || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{activeTask.boardName} • {activeTask.listName}</span>
                                <Badge variant="outline" className="text-xs">
                                    {activeTask.priority}
                                </Badge>
                            </div>
                        </div>
                    )
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

// Task Assignment Modal Component
function TaskAssignmentModal({ task, project, open, onOpenChange }: {
    task: any;
    project: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    if (!task || !open) return null;

    const handleAssigneeToggle = (e: React.MouseEvent, memberId: number) => {
        e.preventDefault();
        e.stopPropagation();
        const currentAssignees = task.assignees?.map((a: any) => a.id) || [];
        const newAssignees = currentAssignees.includes(memberId)
            ? currentAssignees.filter((id: number) => id !== memberId)
            : [...currentAssignees, memberId];
        onOpenChange(false);
        // Update task with new assignees using Inertia router
        const updateUrl = route('tasks.update', { project: project.id, task: task.id });
        const updateData = {
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            status: task.status,
            estimate: task.estimate,
            due_date: task.due_date,
            start_date: task.start_date,
            duration_days: task.duration_days,
            list_id: task.list_id,
            position: task.position,
            assignee_ids: newAssignees,
            label_ids: task.labels?.map((l: any) => l.id) || [],
            is_archived: task.is_archived || false,
        };
        router.put(updateUrl, updateData, {
            preserveState: true,
            preserveScroll: true,
        });
    };
    const handleClose = () => {
        onOpenChange(false);
        setTimeout(() => {
            const overlays = document.querySelectorAll('.fixed.inset-0.z-50');
            overlays.forEach(overlay => {
                if (overlay.querySelector('.bg-black\/50') || overlay.classList.contains('bg-black')) {
                    overlay.remove();
                }
            });
        }, 300);
    };
    return (
        <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background border rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                    Assign Task: {task.title}
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
                    {project.members?.map((member: any) => {
                        const isAssigned = task.assignees?.some((a: any) => a.id === member.id);
                        return (
                            <div
                                key={member.id}
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                                    isAssigned
                                        ? 'bg-primary/10 border border-primary/20 hover:bg-primary/20'
                                        : 'hover:bg-muted/50 hover:shadow-md'
                                }`}
                                onClick={(e) => handleAssigneeToggle(e, member.id)}
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={member.avatar} />
                                    <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="font-medium">{member.name}</div>
                                    <div className="text-sm text-muted-foreground">{member.email}</div>
                                </div>
                                {isAssigned && <CheckCircle2 className="h-5 w-5 text-primary" />}
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Task Duration Modal (placeholder, implement as needed)
function TaskDurationModal({ task, project, open, onOpenChange }: { task: any; project: any; open: boolean; onOpenChange: (open: boolean) => void }) {
    if (!task || !open) return null;
    // Implement your modal UI here
    return null;
}
