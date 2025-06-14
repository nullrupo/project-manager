import React, { useState, useEffect, useRef } from 'react';
import { SortableContext, horizontalListSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { DndContext, closestCenter, closestCorners, pointerWithin, rectIntersection, DragOverlay, CollisionDetection } from '@dnd-kit/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListTodo, CheckCircle2, Plus, Settings, Users, ZoomIn, ZoomOut, RotateCcw, Move, Save, Edit } from 'lucide-react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Project } from '@/types/project-manager';
import { SortableList, SortableTask } from '@/components/project/board/BoardComponents';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { TaskDisplayCustomizer } from '@/components/task/TaskDisplayCustomizer';
import { TaskDisplay } from '@/components/task/TaskDisplay';
import CreateBoardModal from '@/components/project/board/CreateBoardModal';
import CreateColumnModal from '@/components/project/board/CreateColumnModal';
import EditColumnModal from '@/components/project/board/EditColumnModal';
import DeleteColumnModal from '@/components/project/board/DeleteColumnModal';
import BoardSwitcher from '@/components/project/board/BoardSwitcher';
import ManageBoardsModal from '@/components/project/board/ManageBoardsModal';
import TaskCreateModal from '@/components/project/TaskCreateModal';
import BoardTaskCreateModal from '@/components/project/board/BoardTaskCreateModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cleanupAllModalOverlays } from '@/utils/modalCleanup';

interface ProjectBoardViewProps {
    project: Project;
    state: any;
    sensors: any;
    onDragStart: (event: any) => void;
    onDragOver: (event: any) => void;
    onDragEnd: (event: any) => void;
    onViewTask: (task: any) => void;
    onEditTask: (task: any) => void;
    onTaskClick?: (task: any) => void;
}

export default function ProjectBoardView({
    project,
    state,
    sensors,
    onDragStart,
    onDragOver,
    onDragEnd,
    onViewTask,
    onEditTask,
    onTaskClick
}: ProjectBoardViewProps) {
    const [createBoardModalOpen, setCreateBoardModalOpen] = useState(false);
    const [createColumnModalOpen, setCreateColumnModalOpen] = useState(false);
    const [editColumnModalOpen, setEditColumnModalOpen] = useState(false);
    const [deleteColumnModalOpen, setDeleteColumnModalOpen] = useState(false);
    const [selectedColumn, setSelectedColumn] = useState<any>(null);
    const [manageBoardsModalOpen, setManageBoardsModalOpen] = useState(false);

    // Task creation modal state
    const [taskCreateModalOpen, setTaskCreateModalOpen] = useState(false);
    const [selectedListForTask, setSelectedListForTask] = useState<any>(null);

    // Task assignment modal state
    const [assignTaskModalOpen, setAssignTaskModalOpen] = useState(false);
    const [taskToAssign, setTaskToAssign] = useState<any>(null);

    // Zoom state
    const [zoomLevel, setZoomLevel] = useState(1);
    const minZoom = 0.5;
    const maxZoom = 1.5;
    const zoomStep = 0.1;

    // Column resizing state
    const [isResizingEnabled, setIsResizingEnabled] = useState(false);
    const [columnWidths, setColumnWidths] = useState<Record<number, number>>(() => {
        // Load saved layout from localStorage
        const saved = localStorage.getItem(`project-${project.id}-column-widths`);
        return saved ? JSON.parse(saved) : {};
    });
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
    const defaultColumnWidth = 240;



    // Handle task assignment
    const handleAssignTask = (task: any) => {
        setTaskToAssign(task);
        setAssignTaskModalOpen(true);
    };

    // Handle create task
    const handleCreateTask = (list: any) => {
        setSelectedListForTask(list);
        setTaskCreateModalOpen(true);
    };

    // Zoom control functions
    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + zoomStep, maxZoom));
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - zoomStep, minZoom));
    };

    const handleZoomReset = () => {
        setZoomLevel(1);
    };

    // Auto-save timer ref
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Column resizing functions
    const handleColumnWidthChange = (listId: number, width: number) => {
        setColumnWidths(prev => ({
            ...prev,
            [listId]: width
        }));
        setHasUnsavedChanges(true);

        // Clear any existing auto-save timer since we now have unsaved changes
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = null;
        }
    };

    const handleResetColumnWidths = () => {
        // Reset all columns to default width (240px)
        setColumnWidths({});
        setHasUnsavedChanges(false);

        // Clear auto-save timer
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = null;
        }

        // Also remove from localStorage to truly reset
        localStorage.removeItem(`project-${project.id}-column-widths`);
    };

    // Handle unsaved changes confirmation
    const handleUnsavedChangesConfirm = () => {
        // Revert to saved state
        const saved = localStorage.getItem(`project-${project.id}-column-widths`);
        const savedWidths = saved ? JSON.parse(saved) : {};
        setColumnWidths(savedWidths);
        setHasUnsavedChanges(false);
        setIsResizingEnabled(false);

        // Execute pending navigation
        if (pendingNavigation) {
            pendingNavigation();
            setPendingNavigation(null);
        }

        setShowUnsavedChangesDialog(false);
    };

    const handleUnsavedChangesCancel = () => {
        setShowUnsavedChangesDialog(false);
        setPendingNavigation(null);
    };

    // Handle page refresh/tab change when there are unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unsaved column layout changes. Are you sure you want to leave?';
                return 'You have unsaved column layout changes. Are you sure you want to leave?';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }

            // Clean up any stale overlays when component unmounts
            cleanupAllModalOverlays();
        };
    }, [hasUnsavedChanges, project.id]);

    const handleSaveLayout = () => {
        // Clear any pending auto-save
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        // Save layout to localStorage immediately
        localStorage.setItem(`project-${project.id}-column-widths`, JSON.stringify(columnWidths));
        console.log('Manually saving column layout:', columnWidths);

        // You could also make an API call here to save the layout to backend
        // router.post(route('projects.save-layout', project.id), { columnWidths });

        // Disable resizing mode after saving
        setIsResizingEnabled(false);
        setHasUnsavedChanges(false);

        // Optional: Show success message
        // You could add a toast notification here
    };

    const toggleResizing = () => {
        if (isResizingEnabled) {
            // If currently resizing, save the layout
            handleSaveLayout();
        } else {
            // If not resizing, enable resizing mode
            setIsResizingEnabled(true);
            setHasUnsavedChanges(false);
        }
    };

    // Get current board from state
    const currentBoard = project.boards?.find(board => board.id === state.currentBoardId) || project.boards?.[0];

    // Custom collision detection that prioritizes tasks over columns
    const customCollisionDetection: CollisionDetection = (args) => {
        // First try to find task collisions using pointer detection
        const pointerCollisions = pointerWithin(args);
        const taskCollisions = pointerCollisions.filter(collision =>
            collision.id.toString().startsWith('task-')
        );

        // If we found task collisions, prioritize them
        if (taskCollisions.length > 0) {
            // Return the closest task collision
            return closestCenter({
                ...args,
                droppableContainers: args.droppableContainers.filter(container =>
                    taskCollisions.some(collision => collision.id === container.id)
                )
            });
        }

        // If no task collisions, fall back to column detection
        const columnCollisions = pointerCollisions.filter(collision =>
            collision.id.toString().startsWith('list-')
        );

        if (columnCollisions.length > 0) {
            return closestCenter({
                ...args,
                droppableContainers: args.droppableContainers.filter(container =>
                    columnCollisions.some(collision => collision.id === container.id)
                )
            });
        }

        // Final fallback to closest center
        return closestCenter(args);
    };

    // Handle edit column
    const handleEditColumn = (column: any) => {
        setSelectedColumn(column);
        setEditColumnModalOpen(true);
    };

    // Handle delete column
    const handleDeleteColumn = (column: any) => {
        setSelectedColumn(column);
        setDeleteColumnModalOpen(true);
    };

    // Handle edit column modal close
    const handleEditColumnModalClose = (open: boolean) => {
        setEditColumnModalOpen(open);
        if (!open) {
            // Clear selected column when modal closes
            setSelectedColumn(null);

            // Clean up any stale overlays
            setTimeout(cleanupAllModalOverlays, 100);
        }
    };

    // Handle delete column modal close
    const handleDeleteColumnModalClose = (open: boolean) => {
        setDeleteColumnModalOpen(open);
        if (!open) {
            // Clear selected column when modal closes
            setSelectedColumn(null);

            // Clean up any stale overlays
            setTimeout(cleanupAllModalOverlays, 100);
        }
    };

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={customCollisionDetection}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
                modifiers={[restrictToWindowEdges]}
            >
                <Card className="rounded-t-none border-t-0 mt-0">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <ListTodo className="h-5 w-5" />
                                        Board: {project.boards?.find(board => board.id === state.currentBoardId)?.name || project.boards?.[0]?.name || 'Default Board'}
                                        {project.enable_multiple_boards && (
                                            <BoardSwitcher
                                                project={project}
                                                currentBoardId={state.currentBoardId}
                                                onCreateBoard={() => setCreateBoardModalOpen(true)}
                                                onManageBoards={() => setManageBoardsModalOpen(true)}
                                                onBoardChange={state.setCurrentBoardId}
                                            />
                                        )}
                                    </CardTitle>
                                    <CardDescription>
                                        Organize and manage your tasks
                                    </CardDescription>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-2">
                                {/* Column Edit/Save Controls */}
                                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                                    <Button
                                        variant={isResizingEnabled ? (hasUnsavedChanges ? "default" : "secondary") : "ghost"}
                                        size="sm"
                                        onClick={toggleResizing}
                                        className={`h-8 w-8 p-0 transition-all duration-1000`}
                                        style={{
                                            animation: hasUnsavedChanges && isResizingEnabled
                                                ? 'subtle-pulse 3s ease-in-out infinite'
                                                : 'none'
                                        }}
                                        title={isResizingEnabled ? "Save Column Layout" : "Edit Board Layout"}
                                    >
                                        {isResizingEnabled ? (
                                            <Save className="h-4 w-4" />
                                        ) : (
                                            <Edit className="h-4 w-4" />
                                        )}
                                    </Button>
                                    {isResizingEnabled && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleResetColumnWidths}
                                            className="h-8 w-8 p-0"
                                            title="Reset Column Widths"
                                        >
                                            <RotateCcw className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                {/* Zoom Controls */}
                                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleZoomOut}
                                        disabled={zoomLevel <= minZoom}
                                        className="h-8 w-8 p-0"
                                        title="Zoom Out"
                                    >
                                        <ZoomOut className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm font-medium min-w-[3rem] text-center">
                                        {Math.round(zoomLevel * 100)}%
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleZoomIn}
                                        disabled={zoomLevel >= maxZoom}
                                        className="h-8 w-8 p-0"
                                        title="Zoom In"
                                    >
                                        <ZoomIn className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleZoomReset}
                                        className="h-8 w-8 p-0"
                                        title="Reset Zoom"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent
                        style={{
                            backgroundColor: currentBoard?.background_color ? `${currentBoard.background_color}15` : undefined
                        }}
                    >
                        {project.boards && project.boards.length > 0 ? (
                            <div
                                className="flex gap-3 overflow-x-auto overflow-y-visible pb-4 pr-4 transition-transform duration-200 origin-top-left"
                                style={{
                                    transform: `scale(${zoomLevel})`,
                                    transformOrigin: 'top left',
                                    width: `${100 / zoomLevel}%`,
                                    minWidth: '100%',
                                    paddingTop: '4px' // Add padding to prevent clipping
                                }}
                            >
                                <SortableContext
                                    items={state.lists.map((list: any) => `list-${list.id}`)}
                                    strategy={horizontalListSortingStrategy}
                                >
                                    {state.lists.map((list: any) => (
                                        <SortableList
                                            key={list.id}
                                            list={list}
                                            project={project}
                                            onEditList={handleEditColumn}
                                            onDeleteList={handleDeleteColumn}
                                            onCreateTask={handleCreateTask}
                                            dragFeedback={state.dragFeedback}
                                            isResizable={isResizingEnabled}
                                            width={columnWidths[list.id] || defaultColumnWidth}
                                            onWidthChange={handleColumnWidthChange}
                                            boardStyle={{
                                                column_outline_style: currentBoard?.column_outline_style,
                                                column_spacing: currentBoard?.column_spacing,
                                                background_color: currentBoard?.background_color
                                            }}
                                        >
                                            <SortableContext
                                                items={(list.tasks || []).map((task: any) => `task-${task.id}`)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                {list.tasks && list.tasks.length > 0 ? (
                                                    <>
                                                        {list.tasks.map((task: any, index: number) => (
                                                            <SortableTask
                                                                key={task.id}
                                                                task={task}
                                                                project={project}
                                                                onViewTask={onViewTask}
                                                                onEditTask={onEditTask}
                                                                onTaskClick={onTaskClick}
                                                                onAssignTask={handleAssignTask}
                                                                columnName={list.name}
                                                                dragFeedback={state.dragFeedback}
                                                            />
                                                        ))}
                                                    </>
                                                ) : (
                                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                                        No tasks yet. Click "Add Task" to create one.
                                                    </div>
                                                )}
                                            </SortableContext>
                                        </SortableList>
                                    ))}
                                </SortableContext>

                                {/* Add Column Button */}
                                {project.can_edit && (
                                    <div className="w-60 flex-shrink-0">
                                        <Card
                                            className="h-full bg-muted/10 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 cursor-pointer"
                                            onClick={() => setCreateColumnModalOpen(true)}
                                        >
                                            <CardContent className="flex items-center justify-center h-full min-h-[400px] p-0">
                                                <div className="flex flex-col items-center gap-2 py-8 px-6 text-muted-foreground hover:text-primary w-full h-full justify-center">
                                                    <Plus className="h-8 w-8" />
                                                    <span className="text-sm font-medium">Add Column</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-gradient-to-br from-muted/20 to-muted/40 rounded-xl border-2 border-dashed border-muted-foreground/30">
                                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <ListTodo className="h-10 w-10 text-blue-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-2">
                                    No Board Available
                                </h3>
                                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                    This project doesn't have a board set up yet. Contact your project administrator to create one.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <DragOverlay>
                    {state.activeItem?.type === 'task' && state.activeItem.task && (
                        <div className="rounded-lg border bg-card p-4 shadow-xl border-2 border-primary/50 opacity-95 cursor-grabbing w-60 max-w-60">
                            <div className="space-y-2">
                                <div className="font-medium text-sm truncate">
                                    {state.activeItem.task.title}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {state.activeItem.task.status === 'done' && (
                                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    )}
                                    {state.activeItem.task.assignees && state.activeItem.task.assignees.length > 0 && (
                                        <span>{state.activeItem.task.assignees[0].name}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DragOverlay>
            </DndContext>

            {/* Create Board Modal */}
            <CreateBoardModal
                project={project}
                open={createBoardModalOpen}
                onOpenChange={setCreateBoardModalOpen}
            />

            {/* Create Column Modal */}
            <CreateColumnModal
                project={project}
                open={createColumnModalOpen}
                onOpenChange={setCreateColumnModalOpen}
                currentBoardId={state.currentBoardId}
            />

            {/* Edit Column Modal */}
            <EditColumnModal
                project={project}
                column={selectedColumn}
                open={editColumnModalOpen}
                onOpenChange={handleEditColumnModalClose}
            />

            {/* Delete Column Modal */}
            <DeleteColumnModal
                project={project}
                column={selectedColumn}
                open={deleteColumnModalOpen}
                onOpenChange={handleDeleteColumnModalClose}
            />

            {/* Manage Boards Modal */}
            <ManageBoardsModal
                project={project}
                open={manageBoardsModalOpen}
                onOpenChange={setManageBoardsModalOpen}
                onCreateBoard={() => {
                    setManageBoardsModalOpen(false);
                    setCreateBoardModalOpen(true);
                }}
            />

            {/* Task Create Modal */}
            {selectedListForTask && (
                <BoardTaskCreateModal
                    open={taskCreateModalOpen}
                    onOpenChange={setTaskCreateModalOpen}
                    project={project}
                    list={selectedListForTask}
                    members={[...(project.members || []), ...(project.owner ? [project.owner] : [])].filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i)}
                    labels={project.boards?.flatMap(board => board.lists?.flatMap(list => list.tasks?.flatMap(task => task.labels || []) || []) || [])?.filter((v, i, a) => v && a.findIndex(t => t.id === v.id) === i) || []}
                    tags={[]}
                    onSuccess={() => {
                        router.reload();
                    }}
                />
            )}

            {/* Task Assignment Modal */}
            <TaskAssignmentModal
                task={taskToAssign}
                project={project}
                open={assignTaskModalOpen}
                onOpenChange={setAssignTaskModalOpen}
            />

            {/* Unsaved Changes Confirmation Dialog */}
            <ConfirmDialog
                open={showUnsavedChangesDialog}
                onOpenChange={setShowUnsavedChangesDialog}
                title="Unsaved Column Changes"
                description="You have unsaved column layout changes. Do you want to discard these changes and continue?"
                confirmText="Discard Changes"
                cancelText="Keep Editing"
                onConfirm={handleUnsavedChangesConfirm}
                variant="destructive"
            />
        </>
    );

    // Task Assignment Modal Component
    function TaskAssignmentModal({ task, project, open, onOpenChange }: {
        task: any;
        project: Project;
        open: boolean;
        onOpenChange: (open: boolean) => void;
    }) {
        if (!task || !open) return null;

        const handleAssigneeToggle = (e: React.MouseEvent, memberId: number) => {
            e.preventDefault();
            e.stopPropagation();

            console.log('🎯 Assign button clicked for member:', memberId);

            const currentAssignees = task.assignees?.map((a: any) => a.id) || [];
            const newAssignees = currentAssignees.includes(memberId)
                ? currentAssignees.filter((id: number) => id !== memberId)
                : [...currentAssignees, memberId];

            console.log('📝 Current assignees:', currentAssignees);
            console.log('✨ New assignees:', newAssignees);

            // Close modal immediately
            onOpenChange(false);

            // Update task with new assignees using Inertia router
            const updateUrl = route('tasks.update', { project: project.id, task: task.id });
            console.log('🔗 Update URL:', updateUrl);

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
                position: task.position, // Preserve current position
                assignee_ids: newAssignees,
                label_ids: task.labels?.map((l: any) => l.id) || [],
                is_archived: task.is_archived || false,
            };

            console.log('📦 Update data:', updateData);

            router.put(updateUrl, updateData, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    console.log('✅ Assignment successful!');
                },
                onError: (errors) => {
                    console.error('❌ Failed to update task assignees:', errors);
                }
            });
        };

        const handleClose = () => {
            onOpenChange(false);
            // Clean up overlays after animation
            setTimeout(() => {
                const overlays = document.querySelectorAll('.fixed.inset-0.z-50');
                overlays.forEach(overlay => {
                    if (overlay.querySelector('.bg-black\\/50') || overlay.classList.contains('bg-black')) {
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
                        {project.members?.map((member) => {
                            const isAssigned = task.assignees?.some((a: any) => a.id === member.id);
                            return (
                                <div
                                    key={member.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                                        isAssigned
                                            ? 'bg-primary/10 border border-primary/20 hover:bg-primary/20'
                                            : 'hover:bg-muted/50 hover:shadow-md hover:scale-[1.02]'
                                    }`}
                                    onClick={(e) => {
                                        console.log('🖱️ Click detected on member:', member.name, member.id);
                                        handleAssigneeToggle(e, member.id);
                                    }}
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
}
