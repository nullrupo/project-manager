import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { router } from '@inertiajs/react';
import { Plus, Lock, Edit, Eye, MoreHorizontal, Trash2, Settings, Users } from 'lucide-react';
import { Project } from '@/types/project-manager';
import { TaskDisplay } from '@/components/task/TaskDisplay';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';

interface SortableListProps {
    list: any;
    children: React.ReactNode;
    project: Project;
    onDeleteList?: (list: any) => void;
    onEditList?: (list: any) => void;
    dragFeedback?: {
        type: 'within-column' | 'between-columns' | 'invalid' | null;
        targetListId: number | null;
    };
}

interface SortableTaskProps {
    task: any;
    project: Project;
    onViewTask: (task: any) => void;
    onEditTask: (task: any) => void;
    onTaskClick?: (task: any) => void;
    onAssignTask?: (task: any) => void;
    columnName?: string; // Column name for status derivation
    dragFeedback?: {
        type: 'within-column' | 'between-columns' | 'invalid' | null;
        targetListId: number | null;
    };
}

// Sortable List Component
export const SortableList = ({ list, children, project, onDeleteList, onEditList, dragFeedback }: SortableListProps) => {
    // Make the list sortable for column reordering
    const { attributes, listeners, setNodeRef: setSortableRef, transform, transition, isDragging } = useSortable({
        id: `list-${list.id}`,
        data: {
            type: 'list',
            list,
        },
    });

    // Also make it droppable for task drops
    const { setNodeRef: setDroppableRef, isOver, active } = useDroppable({
        id: `list-${list.id}`,
        data: {
            type: 'list',
            list,
        },
    });

    // Combine refs
    const setNodeRef = (node: HTMLElement | null) => {
        setSortableRef(node);
        setDroppableRef(node);
    };

    // Check if we're dragging a task over this list
    const isDraggedOver = isOver && active?.id.toString().startsWith('task-');

    // Check if this list should show drag feedback
    const shouldShowDragFeedback = dragFeedback?.targetListId === list.id && dragFeedback?.type;
    const dragFeedbackClass = shouldShowDragFeedback
        ? dragFeedback.type === 'within-column'
            ? 'drag-within-column'
            : dragFeedback.type === 'between-columns'
            ? 'drag-between-columns'
            : 'drag-invalid'
        : '';

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleDeleteList = () => {
        if (onDeleteList) {
            onDeleteList(list);
        }
    };

    const handleEditList = () => {
        if (onEditList) {
            onEditList(list);
        }
    };



    return (
        <div ref={setNodeRef} style={style} className="w-80 flex-shrink-0">
            <Card className={`h-full transition-all duration-200 ${
                isDraggedOver
                    ? 'bg-primary/10 border-2 border-primary border-solid shadow-lg scale-[1.02]'
                    : shouldShowDragFeedback
                    ? `bg-muted/20 border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 ${dragFeedbackClass}`
                    : 'bg-muted/20 border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40'
            }`}>
                <CardHeader
                    className={`pb-3 ${project.can_edit ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    {...(project.can_edit ? attributes : {})}
                    {...(project.can_edit ? listeners : {})}
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 flex-1">
                            <CardTitle className="text-lg font-semibold select-none">{list.name}</CardTitle>
                            {list.color && (
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: list.color }}
                                />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                                {list.tasks?.length || 0}
                            </Badge>
                            {project.can_edit && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={handleEditList}>
                                            <Settings className="h-4 w-4 mr-2" />
                                            Edit Column
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={handleDeleteList}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Column
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                    {list.color && (
                        <div
                            className="w-full h-1 rounded-full mt-2"
                            style={{ backgroundColor: list.color }}
                        />
                    )}
                </CardHeader>
                <CardContent className="pb-3 space-y-2">
                    <div className={`min-h-[300px] relative ${
                        isDraggedOver ? 'bg-primary/5 rounded-md' : ''
                    }`}>
                        {children}

                        {/* Always-present drop zone at the bottom for cross-column drops */}
                        <div
                            className={`absolute bottom-0 left-0 right-0 h-12 transition-all duration-200 ${
                                shouldShowDragFeedback && dragFeedback.type === 'between-columns'
                                    ? 'bg-blue-400/20 border-2 border-dashed border-blue-400 rounded-md'
                                    : 'hover:bg-muted/10'
                            }`}
                            style={{
                                pointerEvents: 'auto',
                                zIndex: 10
                            }}
                        >
                            {shouldShowDragFeedback && dragFeedback.type === 'between-columns' && (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-blue-600 font-medium text-sm">Drop to change status</div>
                                </div>
                            )}
                        </div>

                        {/* Drop indicator when dragging over empty list */}
                        {isDraggedOver && (!list.tasks || list.tasks.length === 0) && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-primary/20 border-2 border-dashed border-primary rounded-lg p-8 text-center">
                                    <div className="text-primary font-medium">Drop task here</div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="pt-3 border-t">
                    {project.can_manage_tasks ? (
                        <Button
                            variant="ghost"
                            className="w-full border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5"
                            size="sm"
                            onClick={() => {
                                router.get(route('tasks.create', { project: project.id, board: list.board_id, list: list.id, view: 'board' }));
                            }}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Task
                        </Button>
                    ) : (
                        <Button
                            variant="ghost"
                            className="w-full border-2 border-dashed border-muted-foreground/30"
                            size="sm"
                            disabled
                        >
                            <Lock className="h-4 w-4 mr-2" />
                            Add Task
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
};

// Sortable Task Component
export const SortableTask = ({ task, project, onViewTask, onEditTask, onTaskClick, onAssignTask, columnName, dragFeedback }: SortableTaskProps) => {
    const { attributes, listeners, setNodeRef: setSortableRef, transform, transition, isDragging } = useSortable({
        id: `task-${task.id}`,
        data: {
            type: 'task',
            task,
            listId: task.list_id,
        },
    });

    // Create drop zones for insertion-based positioning
    const { setNodeRef: setDroppableRefBefore, isOver: isOverBefore } = useDroppable({
        id: `task-${task.id}-before`,
        data: {
            type: 'task-insertion',
            task,
            listId: task.list_id,
            position: 'before',
        },
    });

    const { setNodeRef: setDroppableRefAfter, isOver: isOverAfter } = useDroppable({
        id: `task-${task.id}-after`,
        data: {
            type: 'task-insertion',
            task,
            listId: task.list_id,
            position: 'after',
        },
    });

    // Combine refs for the main task element
    const setNodeRef = (node: HTMLElement | null) => {
        setSortableRef(node);
    };



    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : transition,
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 1000 : 'auto',
        cursor: isDragging ? 'grabbing' : 'grab',
    };

    const handleClick = (e: React.MouseEvent) => {
        // Prevent click when dragging
        if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        // Task click no longer opens inspector - only view button does
    };

    return (
        <div className="relative">
            {/* Drop zone before task */}
            <div
                ref={setDroppableRefBefore}
                className={`h-2 w-full transition-all duration-200 ${
                    isOverBefore
                        ? dragFeedback?.type === 'within-column'
                            ? 'bg-purple-400/30 border-t-2 border-purple-400'
                            : dragFeedback?.type === 'between-columns'
                            ? 'bg-blue-400/30 border-t-2 border-blue-400'
                            : 'bg-primary/20 border-t-2 border-primary'
                        : ''
                }`}
                style={{ marginBottom: isOverBefore ? '8px' : '0px' }}
            />

            {/* Main task element */}
            <div
                ref={setNodeRef}
                style={style}
                className={`mb-3 rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-all duration-200 group cursor-grab relative ${
                    isDragging ? 'opacity-50 z-50' : ''
                }`}
                data-task-clickable
                data-sortable-item
                data-dragging={isDragging}
                onClick={handleClick}
                {...attributes}
                {...listeners}
            >


            {/* Action buttons - positioned absolutely */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-1">
                {/* Assign button - only show if onAssignTask is provided and project has members */}
                {onAssignTask && project.members && project.members.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 bg-background/80 hover:bg-background"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onAssignTask(task);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        title="Assign task"
                    >
                        <Users className="h-3 w-3" />
                    </Button>
                )}

                {/* View button - always available */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 bg-background/80 hover:bg-background"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onViewTask(task);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <Eye className="h-3 w-3" />
                </Button>
            </div>

            {/* Assignee and priority icons - positioned at bottom-right */}
            <div className="absolute bottom-2 right-2 flex items-center gap-2 z-10">
                {/* Assignees */}
                {task.assignees && task.assignees.length > 0 && (
                    <div className="flex items-center gap-1">
                        <div className="flex -space-x-1">
                            {task.assignees.slice(0, 3).map((assignee) => (
                                <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background shadow-sm">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${assignee.name}`} />
                                    <AvatarFallback className="text-xs font-medium">
                                        {assignee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                            {task.assignees.length > 3 && (
                                <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs text-muted-foreground font-medium shadow-sm">
                                    +{task.assignees.length - 3}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Priority indicator */}
                {task.priority && task.priority !== 'none' && (
                    <div className="flex items-center">
                        {task.priority === 'low' && <div className="w-3 h-3 rounded-full bg-green-500" title="Low Priority" />}
                        {task.priority === 'medium' && <div className="w-3 h-3 rounded-full bg-yellow-500" title="Medium Priority" />}
                        {task.priority === 'high' && <div className="w-3 h-3 rounded-full bg-red-500" title="High Priority" />}
                    </div>
                )}
            </div>

                <div className="space-y-2 pr-12">
                    <TaskDisplay
                        task={task}
                        compact
                        pageKey={`project-board-${task.project_id}`}
                        columnName={columnName}
                    />
                </div>
            </div>

            {/* Drop zone after task */}
            <div
                ref={setDroppableRefAfter}
                className={`h-2 w-full transition-all duration-200 ${
                    isOverAfter
                        ? dragFeedback?.type === 'within-column'
                            ? 'bg-purple-400/30 border-b-2 border-purple-400'
                            : dragFeedback?.type === 'between-columns'
                            ? 'bg-blue-400/30 border-b-2 border-blue-400'
                            : 'bg-primary/20 border-b-2 border-primary'
                        : ''
                }`}
                style={{ marginTop: isOverAfter ? '8px' : '0px' }}
            />
        </div>
    );
};
