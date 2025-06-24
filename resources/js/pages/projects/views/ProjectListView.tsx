import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Menu, Plus, ChevronDown, ChevronRight, Layers, ListTodo, Sparkles, Clock, Archive, CheckCircle2 } from 'lucide-react';
import { Project } from '@/types/project-manager';
import ListTaskItem from '../components/ListTaskItem';
import { getOrganizedTasks, getAllTasksFromSections, toggleSectionCollapse } from '../utils/projectUtils';
import { TaskDisplayCustomizer } from '@/components/task/TaskDisplayCustomizer';
import QuickAddTask from '@/components/project/QuickAddTask';

import { useTags } from '@/hooks/useTags';
import { router } from '@inertiajs/react';
import { BulkActionsPanel } from '@/components/BulkActionsPanel';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

interface ProjectListViewProps {
    project: Project;
    state: any;
    sensors: any;
    onDragStart: (event: any) => void;
    onDragOver: (event: any) => void;
    onDragEnd: (event: any) => void;
    onTaskClick: (task: any) => void;
    onEditTask: (task: any) => void;
    onViewTask?: (task: any) => void;
    onAssignTask?: (task: any) => void;
    onCreateSection: () => void;
    onEditSection: (section: any) => void;
    onDeleteSection: (section: any) => void;
    onCreateTask?: (sectionId?: string, status?: string) => void;
}

export default function ProjectListView({
    project,
    state,
    sensors,
    onDragStart,
    onDragOver,
    onDragEnd,
    onTaskClick,
    onEditTask,
    onViewTask,
    onAssignTask,
    onCreateSection,
    onEditSection,
    onDeleteSection,
    onCreateTask
}: ProjectListViewProps) {
    const { tags } = useTags();
    const taskListRef = useRef<HTMLDivElement>(null);
    const [isCleaningUp, setIsCleaningUp] = useState(false);
    const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
    const sections = getOrganizedTasks(project, state.listViewMode);
    const allTasks = getAllTasksFromSections(sections);
    const [moveSectionModalOpen, setMoveSectionModalOpen] = useState(false);
    const [sectionToMove, setSectionToMove] = useState<any>(null);
    const [targetProjectId, setTargetProjectId] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Cleanup state
    const cleanupEligibleTasks = useMemo(() => {
        return allTasks.filter(task => task.status === 'done');
    }, [allTasks]);

    const handleSectionToggle = (sectionId: string) => {
        toggleSectionCollapse(sectionId, state.collapsedSections, state.setCollapsedSections);
    };

    // Clear selection when tasks change if focused task no longer exists
    useEffect(() => {
        if (allTasks.length === 0) {
            if (state.selectedTasks.size !== 0 || state.currentFocusedTaskId !== null || state.lastSelectedTaskId !== null) {
                state.setSelectedTasks(new Set());
                state.setCurrentFocusedTaskId(null);
                state.setLastSelectedTaskId(null);
            }
        } else if (state.currentFocusedTaskId && !allTasks.find(t => t.id === state.currentFocusedTaskId)) {
            if (state.selectedTasks.size !== 0 || state.currentFocusedTaskId !== null || state.lastSelectedTaskId !== null) {
                state.setSelectedTasks(new Set());
                state.setCurrentFocusedTaskId(null);
                state.setLastSelectedTaskId(null);
            }
        }
    }, [allTasks, state.currentFocusedTaskId, state.selectedTasks, state.lastSelectedTaskId]);

    // Clear selection when switching view modes
    useEffect(() => {
        state.setSelectedTasks(new Set());
        state.setCurrentFocusedTaskId(null);
        state.setLastSelectedTaskId(null);
        state.setShowBulkActions(false);
    }, [state.listViewMode]);

    // Task selection function
    const toggleTaskSelection = useCallback((taskId: number, event?: React.MouseEvent) => {
        const newSelected = new Set(state.selectedTasks);

        if (event?.shiftKey && state.lastSelectedTaskId !== null) {
            // Shift+click: select range
            const currentIndex = allTasks.findIndex(t => t.id === taskId);
            const lastIndex = allTasks.findIndex(t => t.id === state.lastSelectedTaskId);

            if (currentIndex !== -1 && lastIndex !== -1) {
                const start = Math.min(currentIndex, lastIndex);
                const end = Math.max(currentIndex, lastIndex);

                // Clear existing selection and add range
                newSelected.clear();
                for (let i = start; i <= end; i++) {
                    newSelected.add(allTasks[i].id);
                }
            }
        } else if (event?.ctrlKey || event?.metaKey) {
            // Ctrl/Cmd+click: toggle individual task (multi-select)
            if (newSelected.has(taskId)) {
                newSelected.delete(taskId);
            } else {
                newSelected.add(taskId);
            }
        } else {
            // Regular click: single selection
            newSelected.clear();
            newSelected.add(taskId);
        }

        state.setSelectedTasks(newSelected);
        state.setCurrentFocusedTaskId(taskId);
        state.setLastSelectedTaskId(taskId);
        state.setShowBulkActions(newSelected.size > 0);
    }, [allTasks, state.selectedTasks, state.lastSelectedTaskId]);

    // Keyboard navigation functions
    const moveSelection = (direction: 'up' | 'down', shiftKey: boolean = false) => {
        if (allTasks.length === 0) return;

        const currentIndex = state.currentFocusedTaskId
            ? allTasks.findIndex(t => t.id === state.currentFocusedTaskId)
            : -1;

        let newIndex;
        if (direction === 'up') {
            newIndex = currentIndex <= 0 ? allTasks.length - 1 : currentIndex - 1;
        } else {
            newIndex = currentIndex >= allTasks.length - 1 ? 0 : currentIndex + 1;
        }

        const newTaskId = allTasks[newIndex]?.id;
        if (newTaskId) {
            if (shiftKey && state.currentFocusedTaskId) {
                // Shift + Arrow: Add to selection
                const newSelected = new Set(state.selectedTasks);
                newSelected.add(newTaskId);
                state.setSelectedTasks(newSelected);
            } else {
                // Regular Arrow: Single task focus
                state.setSelectedTasks(new Set([newTaskId]));
            }
            state.setCurrentFocusedTaskId(newTaskId);
            state.setLastSelectedTaskId(newTaskId);
            state.setShowBulkActions(state.selectedTasks.size > 0 || shiftKey);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        // Only handle keyboard navigation when not in an input field, textarea, or dropdown
        if (event.target instanceof HTMLInputElement ||
            event.target instanceof HTMLTextAreaElement ||
            event.target instanceof HTMLSelectElement) {
            return;
        }

        // Don't handle if modals are open
        if (state.taskCreateModalOpen || state.taskEditModalOpen || state.taskViewModalOpen) {
            return;
        }

        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                moveSelection('up', event.shiftKey);
                break;
            case 'ArrowDown':
                event.preventDefault();
                moveSelection('down', event.shiftKey);
                break;
            case ' ':
                event.preventDefault();
                // Toggle completion for all selected tasks
                if (state.selectedTasks.size > 0) {
                    bulkToggleCompletion();
                }
                break;
        }
    };

    // Custom batch operations for project tasks (need project parameter)
    const getSelectedTasksCompletionState = useCallback(() => {
        const selectedTasksList = allTasks.filter(task => state.selectedTasks.has(task.id));
        const completedCount = selectedTasksList.filter(task => task.status === 'done').length;
        const totalCount = selectedTasksList.length;
        const allCompleted = totalCount > 0 && completedCount === totalCount;
        const hasIncomplete = completedCount < totalCount;

        return {
            allCompleted,
            hasIncomplete,
            completedCount,
            totalCount
        };
    }, [allTasks, state.selectedTasks]);

    const bulkToggleCompletion = useCallback(async () => {
        if (isProcessing) return;

        const taskIds = Array.from(state.selectedTasks);
        setIsProcessing(true);

        try {
            // Process all tasks concurrently
            await Promise.all(taskIds.map(async (taskId) => {
                try {
                    const response = await fetch(route('tasks.toggle-completion', {
                        project: project.id,
                        task: taskId
                    }), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                            'Accept': 'application/json',
                        },
                        body: JSON.stringify({})
                    });

                    if (!response.ok) {
                        console.error('Failed to toggle task completion:', taskId);
                    }
                } catch (error) {
                    console.error('Failed to toggle task completion:', taskId, error);
                }
            }));

            // Reload the page to reflect changes
            router.reload();
        } finally {
            setIsProcessing(false);
            state.setSelectedTasks(new Set());
            state.setShowBulkActions(false);
        }
    }, [state.selectedTasks, project.id, isProcessing]);

    const bulkDelete = useCallback(async () => {
        if (isProcessing) return;

        const taskIds = Array.from(state.selectedTasks);
        setIsProcessing(true);

        try {
            // Process all tasks concurrently
            await Promise.all(taskIds.map(async (taskId) => {
                try {
                    const response = await fetch(route('tasks.destroy', {
                        project: project.id,
                        task: taskId
                    }), {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                            'Accept': 'application/json',
                        }
                    });

                    if (!response.ok) {
                        console.error('Failed to delete task:', taskId);
                    }
                } catch (error) {
                    console.error('Failed to delete task:', taskId, error);
                }
            }));

            // Reload the page to reflect changes
            router.reload();
        } finally {
            setIsProcessing(false);
            state.setSelectedTasks(new Set());
            state.setShowBulkActions(false);
        }
    }, [state.selectedTasks, project.id, isProcessing]);

    // Perform cleanup of completed tasks
    const performCleanup = () => {
        if (isCleaningUp) return; // Prevent double-clicks

        setIsCleaningUp(true);
        router.post(route('projects.cleanup', { project: project.id }), {}, {
            onSuccess: () => {
                setIsCleaningUp(false);
                // Success message will be shown via Inertia flash message
            },
            onError: () => {
                setIsCleaningUp(false);
            }
        });
    };

    // Enhanced task click handler that supports selection
    const handleTaskClick = useCallback((task: any, event?: React.MouseEvent) => {
        if (event && (event.ctrlKey || event.metaKey || event.shiftKey)) {
            // Multi-select behavior with modifier keys
            toggleTaskSelection(task.id, event);
        } else {
            // Single click opens inspector (existing behavior)
            onTaskClick(task);
        }
    }, [toggleTaskSelection, onTaskClick]);

    const handleCreateTask = (sectionId?: string, status?: string) => {
        if (onCreateTask) {
            // Handle special "no-section" case
            const actualSectionId = sectionId === 'no-section' ? undefined : sectionId;
            onCreateTask(actualSectionId, status);
        }
    };

    const handleSectionDragStart = (event: any) => {
        setDraggedSectionId(event.active.id);
    };

    const handleSectionDragEnd = (event: any) => {
        setDraggedSectionId(null);
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = sections.findIndex((s: any) => s.id === active.id);
        const newIndex = sections.findIndex((s: any) => s.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        const newOrder = [...sections];
        newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, sections[oldIndex]);
        // Call backend to persist order
        router.post(route('sections.reorder', { project: project.id }), {
            section_ids: newOrder.map((s: any) => s.id)
        }, { preserveScroll: true });
    };

    // All projects for dropdown (excluding current)
    const allProjects = useMemo(() => {
        return project.all_projects?.filter((p: any) => p.id !== project.id) || [];
    }, [project]);

    const handleMoveSection = (section: any) => {
        setSectionToMove(section);
        setMoveSectionModalOpen(true);
    };

    const confirmMoveSection = () => {
        if (!sectionToMove || !targetProjectId) return;
        router.post(route('sections.move', { section: sectionToMove.id }), {
            target_project_id: targetProjectId
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setMoveSectionModalOpen(false);
                setSectionToMove(null);
                setTargetProjectId('');
            }
        });
    };

    // Now handle the empty state after all hooks
    if (sections.length === 0) {
        return (
            <div className="text-center py-16 flex flex-col items-center gap-4">
                <p className="text-muted-foreground">No sections or tasks in this project yet.</p>
                <Button onClick={() => onCreateTask ? onCreateTask() : state.setTaskCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Task
                </Button>
            </div>
        );
    }

    return (
        <div
            className="flex h-[calc(100vh-200px)] mt-0"
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            {/* Main List Content */}
            <div className={`flex-1 ${state.inspectorOpen ? 'mr-0' : ''}`}>
                <Card className="rounded-t-none border-t-0 h-full">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Menu className="h-5 w-5" />
                                    Task List
                                </CardTitle>
                                <CardDescription>
                                    Hierarchical outline view with inspector panel
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <TaskDisplayCustomizer pageKey={`project-list-${project.id}`} />
                                <Separator orientation="vertical" className="h-6" />
                                {project.can_manage_tasks && (
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => handleCreateTask()}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        New Task
                                    </Button>
                                )}
                                {state.listViewMode === 'sections' && project.can_manage_tasks && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onCreateSection}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Section
                                    </Button>
                                )}

                                {/* Cleanup button */}
                                {project.can_manage_tasks && cleanupEligibleTasks.length > 0 && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={performCleanup}
                                                    disabled={isCleaningUp}
                                                    className="flex items-center gap-2"
                                                >
                                                    {isCleaningUp ? (
                                                        <>
                                                            <Clock className="h-4 w-4 animate-spin" />
                                                            Cleaning...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="h-4 w-4" />
                                                            Clean Up ({cleanupEligibleTasks.length})
                                                        </>
                                                    )}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Archive all completed tasks in this project</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}

                                {/* Archive button */}
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.visit(route('projects.archive', project.id))}
                                                className="flex items-center gap-2"
                                            >
                                                <Archive className="h-4 w-4" />
                                                Archive
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>View archived tasks for this project</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <Separator orientation="vertical" className="h-6" />
                                <Button
                                    variant={state.listViewMode === 'sections' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => state.setListViewMode('sections')}
                                >
                                    <Layers className="h-4 w-4 mr-2" />
                                    Sections
                                </Button>
                                <Button
                                    variant={state.listViewMode === 'status' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => state.setListViewMode('status')}
                                >
                                    <ListTodo className="h-4 w-4 mr-2" />
                                    Status
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto">
                        {project.boards && project.boards.length > 0 ? (
                            <>
                                {/* Quick Add Task - Always visible at top */}
                                {project.can_manage_tasks && (
                                    <div className="mb-4">
                                        <QuickAddTask
                                            project={project}
                                            sectionId={null}
                                            status="to_do"
                                            placeholder="Quick add a task (no section)..."
                                        />
                                    </div>
                                )}

                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragStart={handleSectionDragStart}
                                    onDragEnd={handleSectionDragEnd}
                                >
                                    <SortableContext items={sections.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-4" ref={taskListRef}>
                                            {sections.map((section: any) => {
                                                const isCollapsed = state.collapsedSections.has(section.id);
                                                const taskIds = section.tasks.map((task: any) => `list-task-${task.id}`);
                                                // Section-level drag detection for pulse effects
                                                const isSectionTargeted = state.listDragFeedback?.isTaskDrag &&
                                                    state.listDragFeedback?.draggedTaskSectionId === section.id &&
                                                    section.tasks?.some((task: any) => `list-task-${task.id}` === state.listDragFeedback?.overId);
                                                return (
                                                    <div key={section.id} className={`space-y-2 transition-all duration-300 ${
                                                        isSectionTargeted ? 'bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/30 border-2 border-purple-300 dark:border-purple-600 rounded-lg p-2 shadow-lg shadow-purple-200/20 dark:shadow-purple-900/20' : ''
                                                    }`}>
                                                        {/* Section Header */}
                                                        <div
                                                            className="flex items-center justify-between p-1 bg-muted/30 rounded-md border border-dashed border-muted-foreground/30 hover:bg-muted/50 transition-colors cursor-pointer"
                                                            onClick={() => handleSectionToggle(section.id)}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0"
                                                                >
                                                                    {isCollapsed ? (
                                                                        <ChevronRight className="h-4 w-4" />
                                                                    ) : (
                                                                        <ChevronDown className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                                <h3 className="font-semibold text-foreground">
                                                                    {section.name}
                                                                </h3>
                                                                <span className="text-sm text-muted-foreground">
                                                                    ({section.tasks.length})
                                                                </span>
                                                            </div>
                                                            {project.can_manage_tasks && (
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleCreateTask(
                                                                                state.listViewMode === 'sections' ? section.id : undefined,
                                                                                state.listViewMode === 'status' ? section.id : undefined
                                                                            );
                                                                        }}
                                                                        title="Add Task"
                                                                    >
                                                                        <Plus className="h-4 w-4" />
                                                                    </Button>
                                                                    {section.type === 'section' && (
                                                                        <>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    onEditSection(section);
                                                                                }}
                                                                            >
                                                                                Edit
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    onDeleteSection(section);
                                                                                }}
                                                                            >
                                                                                Delete
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleMoveSection(section);
                                                                                }}
                                                                            >
                                                                                Move
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {/* Section Tasks */}
                                                        {!isCollapsed && (
                                                            <SortableContext
                                                                items={taskIds}
                                                                strategy={verticalListSortingStrategy}
                                                            >
                                                                <div className="space-y-1">
                                                                    {section.tasks && section.tasks.length > 0 ? (
                                                                        section.tasks.map((task: any) => (
                                                                            <ListTaskItem
                                                                                key={task.id}
                                                                                task={task}
                                                                                project={project}
                                                                                sectionId={section.id}
                                                                                onTaskClick={handleTaskClick}
                                                                                onEditTask={onEditTask}
                                                                                onViewTask={onViewTask}
                                                                                onAssignTask={onAssignTask}
                                                                                currentView={state.activeView}
                                                                                isSelected={state.selectedTasks.has(task.id)}
                                                                                onToggleSelection={toggleTaskSelection}
                                                                                currentBoardId={state.currentBoardId}
                                                                                dragFeedback={state.listDragFeedback}
                                                                            />
                                                                        ))
                                                                    ) : (
                                                                        <div className="text-center py-3 text-muted-foreground text-sm ml-4">
                                                                            No tasks in this section yet.
                                                                        </div>
                                                                    )}
                                                                    {/* Quick Add for this section */}
                                                                    {project.can_manage_tasks && (
                                                                        <div className="mt-1">
                                                                            <QuickAddTask
                                                                                project={project}
                                                                                sectionId={section.id}
                                                                                status={state.listViewMode === 'status' ? section.id : 'to_do'}
                                                                                placeholder={`Add task to ${section.name}...`}
                                                                                className="border-dashed"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </SortableContext>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </SortableContext>
                                    {/* Drag Overlay for smooth visual feedback */}
                                    <DragOverlay>
                                        {state.listActiveItem?.type === 'task' && state.listActiveItem.task && (
                                            <div className="rounded-lg border bg-card p-3 shadow-xl border-2 border-purple-500/50 opacity-95 cursor-grabbing max-w-md">
                                                <div className="space-y-2">
                                                    <div className="font-medium text-sm truncate">
                                                        {state.listActiveItem.task.title}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        {state.listActiveItem.task.status === 'done' && (
                                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                                        )}
                                                        {state.listActiveItem.task.assignees && state.listActiveItem.task.assignees.length > 0 && (
                                                            <span>{state.listActiveItem.task.assignees[0].name}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </DragOverlay>
                                </DndContext>
                            </>
                        ) : (
                            <div className="text-center py-16">
                                <p className="text-muted-foreground">No board available for this project.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Bulk Actions Panel */}
            <BulkActionsPanel
                selectedTasks={state.selectedTasks}
                onClearSelection={() => {
                    state.setSelectedTasks(new Set());
                    state.setCurrentFocusedTaskId(null);
                    state.setShowBulkActions(false);
                }}
                onToggleCompletion={() => bulkToggleCompletion()}
                onDelete={() => bulkDelete()}
                getCompletionState={getSelectedTasksCompletionState}
                isProcessing={isProcessing}
            />

            {/* Move Section Modal */}
            <Dialog open={moveSectionModalOpen} onOpenChange={setMoveSectionModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Move Section to Another Project</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Target Project</label>
                            <Select value={targetProjectId} onValueChange={setTargetProjectId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a project..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {allProjects.map((p: any) => (
                                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setMoveSectionModalOpen(false)}>Cancel</Button>
                        <Button onClick={confirmMoveSection} disabled={!targetProjectId}>Move</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
