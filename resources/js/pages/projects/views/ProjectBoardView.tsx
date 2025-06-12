import React, { useState } from 'react';
import { SortableContext, horizontalListSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { DndContext, closestCenter, DragOverlay, CollisionDetection } from '@dnd-kit/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListTodo, CheckCircle2, Plus, Settings, Users } from 'lucide-react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Project } from '@/types/project-manager';
import { SortableList, SortableTask } from '@/components/project/board/BoardComponents';
import { TaskDisplayCustomizer } from '@/components/task/TaskDisplayCustomizer';
import { TaskDisplay } from '@/components/task/TaskDisplay';
import CreateBoardModal from '@/components/project/board/CreateBoardModal';
import CreateColumnModal from '@/components/project/board/CreateColumnModal';
import EditColumnModal from '@/components/project/board/EditColumnModal';
import BoardSwitcher from '@/components/project/board/BoardSwitcher';
import ManageBoardsModal from '@/components/project/board/ManageBoardsModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
    const [selectedColumn, setSelectedColumn] = useState<any>(null);
    const [manageBoardsModalOpen, setManageBoardsModalOpen] = useState(false);

    // Task assignment modal state
    const [assignTaskModalOpen, setAssignTaskModalOpen] = useState(false);
    const [taskToAssign, setTaskToAssign] = useState<any>(null);

    // Handle task assignment
    const handleAssignTask = (task: any) => {
        setTaskToAssign(task);
        setAssignTaskModalOpen(true);
    };

    // Get current board from state
    const currentBoard = project.boards?.find(board => board.id === state.currentBoardId) || project.boards?.[0];

    // Use default collision detection
    const customCollisionDetection = closestCenter;

    // Handle edit column
    const handleEditColumn = (column: any) => {
        setSelectedColumn(column);
        setEditColumnModalOpen(true);
    };

    // Handle delete column
    const handleDeleteColumn = (column: any) => {
        if (confirm(`Are you sure you want to delete the "${column.name}" column? This action cannot be undone.`)) {
            router.delete(route('lists.destroy', {
                project: project.id,
                board: column.board_id,
                list: column.id
            }));
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
                        </div>
                    </CardHeader>
                    <CardContent>
                        {project.boards && project.boards.length > 0 ? (
                            <div className="flex gap-4 overflow-x-auto pb-4 w-full pr-4">
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
                                            dragFeedback={state.dragFeedback}
                                        >
                                            <SortableContext
                                                items={(list.tasks || []).map((task: any) => `task-${task.id}`)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                {list.tasks && list.tasks.length > 0 ? (
                                                    list.tasks.map((task: any) => (
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
                                                    ))
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
                                    <div className="w-80 flex-shrink-0">
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
                        <div className="rounded-lg border bg-card p-4 shadow-xl border-2 border-primary/50 opacity-95 cursor-grabbing w-80 max-w-80">
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
                onOpenChange={setEditColumnModalOpen}
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

            {/* Task Assignment Modal */}
            <TaskAssignmentModal
                task={taskToAssign}
                project={project}
                open={assignTaskModalOpen}
                onOpenChange={setAssignTaskModalOpen}
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

        const handleAssigneeToggle = (memberId: number) => {
            const currentAssignees = task.assignees?.map((a: any) => a.id) || [];
            const newAssignees = currentAssignees.includes(memberId)
                ? currentAssignees.filter((id: number) => id !== memberId)
                : [...currentAssignees, memberId];

            // Update task with new assignees
            router.put(route('tasks.update', { project: project.id, task: task.id }), {
                title: task.title,
                description: task.description || '',
                priority: task.priority,
                status: task.status,
                estimate: task.estimate,
                due_date: task.due_date,
                start_date: task.start_date,
                duration_days: task.duration_days,
                list_id: task.list_id,
                assignee_ids: newAssignees,
                label_ids: task.labels?.map((l: any) => l.id) || [],
                is_archived: task.is_archived || false,
            }, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    onOpenChange(false);
                },
                onError: (errors) => {
                    console.error('Failed to update task assignees:', errors);
                }
            });
        };

        return (
            <div className="fixed inset-0 z-50">
                <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
                <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background border rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Assign Task: {task.title}</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
                        {project.members?.map((member) => {
                            const isAssigned = task.assignees?.some((a: any) => a.id === member.id);
                            return (
                                <div
                                    key={member.id}
                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                        isAssigned ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
                                    }`}
                                    onClick={() => handleAssigneeToggle(member.id)}
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
