import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { Plus, Lock, Edit, Eye, MoreHorizontal, Trash2, Settings, Users, GripVertical } from 'lucide-react';
import { Project } from '@/types/project-manager';
import { TaskDisplay } from '@/components/task/TaskDisplay';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';

// Insertion Drop Zone Component - invisible zones between tasks
interface InsertionDropZoneProps {
    listId: number;
    position: number;
    isVisible: boolean;
}

export const InsertionDropZone = ({ listId, position, isVisible }: InsertionDropZoneProps) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `insertion-${listId}-${position}`,
        data: {
            type: 'insertion',
            listId,
            position,
        },
    });

    return (
        <div
            ref={setNodeRef}
            className={`transition-all duration-300 ease-out ${
                isVisible && isOver
                    ? 'h-10 w-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-dashed border-blue-400 dark:border-blue-500 rounded-lg mb-3 shadow-sm flex items-center justify-center'
                    : 'h-1 w-full'
            }`}
        >
            {isVisible && isOver && (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    Drop here
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                </div>
            )}
        </div>
    );
};

interface SortableListProps {
    list: any;
    children: React.ReactNode;
    project: Project;
    onDeleteList?: (list: any) => void;
    onEditList?: (list: any) => void;
    onCreateTask?: (list: any) => void;
    dragFeedback?: {
        type: 'within-column' | 'between-columns' | 'invalid' | null;
        targetListId: number | null;
    };
    isResizable?: boolean;
    width?: number;
    onWidthChange?: (listId: number, width: number) => void;
    boardStyle?: {
        column_outline_style?: 'none' | 'subtle' | 'bold' | 'rounded' | 'shadow' | 'single' | 'spaced' | 'double' | 'dashed' | 'dotted' | 'gradient';
        column_spacing?: 'compact' | 'normal' | 'wide';
        background_color?: string;
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
export const SortableList = ({ list, children, project, onDeleteList, onEditList, onCreateTask, dragFeedback, isResizable = false, width = 240, onWidthChange, boardStyle }: SortableListProps) => {
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



    // Check if we're dragging a task over this list container (for cross-column drops)
    const isDraggedOver = isOver && active?.id.toString().startsWith('task-') &&
                         active?.data?.current?.listId !== list.id;

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleDeleteList = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (onDeleteList) {
            onDeleteList(list);
        }
    };

    const handleEditList = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (onEditList) {
            onEditList(list);
        }
    };

    // Resizing logic
    const [isResizing, setIsResizing] = useState(false);
    const [currentWidth, setCurrentWidth] = useState(width);
    const resizeRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!isResizable) return;

        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        startXRef.current = e.clientX;
        startWidthRef.current = currentWidth;

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [isResizable, currentWidth]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing) return;

        const deltaX = e.clientX - startXRef.current;
        const newWidth = Math.max(200, Math.min(500, startWidthRef.current + deltaX));
        setCurrentWidth(newWidth);
    }, [isResizing]);

    const handleMouseUp = useCallback(() => {
        if (!isResizing) return;

        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        if (onWidthChange) {
            onWidthChange(list.id, currentWidth);
        }
    }, [isResizing, currentWidth, list.id, onWidthChange]);

    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isResizing, handleMouseMove, handleMouseUp]);

    // Update width when prop changes
    useEffect(() => {
        setCurrentWidth(width);
    }, [width]);

    // Generate column border styles based on board settings
    const getColumnBorderStyles = () => {
        const outlineStyle = boardStyle?.column_outline_style || 'subtle';

        switch (outlineStyle) {
            case 'none':
                return 'border-0';
            case 'subtle':
                return 'border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40';
            case 'bold':
                return 'border-2 border-solid border-primary/50 hover:border-primary/70';
            case 'rounded':
                return 'border-2 border-solid border-muted-foreground/30 rounded-xl hover:border-muted-foreground/50';
            case 'shadow':
                return 'border border-muted-foreground/20 shadow-lg hover:shadow-xl';
            case 'single':
                return 'border border-solid border-muted-foreground/40 hover:border-muted-foreground/60';
            case 'spaced':
                return 'border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 mx-1';
            case 'double':
                return 'border-4 border-double border-muted-foreground/40 hover:border-muted-foreground/60';
            case 'dashed':
                return 'border-2 border-dashed border-primary/40 hover:border-primary/60';
            case 'dotted':
                return 'border-2 border-dotted border-primary/40 hover:border-primary/60';
            case 'gradient':
                return 'border-2 border-solid border-transparent bg-gradient-to-r from-primary/20 to-secondary/20 hover:from-primary/30 hover:to-secondary/30';
            default:
                return 'border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40';
        }
    };

    // Generate spacing styles
    const getSpacingStyles = () => {
        const spacing = boardStyle?.column_spacing || 'normal';

        switch (spacing) {
            case 'compact':
                return 'mx-1';
            case 'normal':
                return 'mx-2';
            case 'wide':
                return 'mx-4';
            default:
                return 'mx-2';
        }
    };



    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                width: `${currentWidth}px`,
                minWidth: '200px',
                maxWidth: '500px'
            }}
            className={`flex-shrink-0 relative ${getSpacingStyles()}`}
        >
            <Card className={`h-full min-h-[500px] transition-all duration-300 ease-out ${
                isDraggedOver
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-2 border-blue-400 dark:border-blue-500 border-solid shadow-xl shadow-blue-200/20 dark:shadow-blue-900/20 scale-[1.01] ring-2 ring-blue-200/50 dark:ring-blue-800/50'
                    : `bg-muted/20 ${getColumnBorderStyles()}`
            }`}>
                <CardHeader
                    className={`pb-4 bg-gradient-to-r from-background to-muted/30 rounded-t-lg ${isResizable && project.can_edit ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    {...(isResizable && project.can_edit ? attributes : {})}
                    {...(isResizable && project.can_edit ? listeners : {})}
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 flex-1">
                            <CardTitle className="text-lg font-bold select-none bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                                {list.name}
                            </CardTitle>
                            {list.color && (
                                <div
                                    className="w-4 h-4 rounded-full shadow-sm ring-2 ring-background"
                                    style={{ backgroundColor: list.color }}
                                />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs font-semibold bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 border-0 shadow-sm">
                                {list.tasks?.length || 0}
                            </Badge>
                            {project.can_edit && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 rounded-full hover:bg-muted/50 transition-all duration-200"
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="shadow-lg border-0 bg-background/95 backdrop-blur-sm">
                                        <DropdownMenuItem
                                            onClick={(e) => handleEditList(e)}
                                            onSelect={(e) => e.preventDefault()}
                                            className="hover:bg-blue-50 dark:hover:bg-blue-950/50"
                                        >
                                            <Settings className="h-4 w-4 mr-2" />
                                            Edit Column
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-destructive hover:bg-red-50 dark:hover:bg-red-950/50"
                                            onClick={(e) => handleDeleteList(e)}
                                            onSelect={(e) => e.preventDefault()}
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
                            className="w-full h-1.5 rounded-full mt-3 shadow-sm"
                            style={{
                                background: `linear-gradient(90deg, ${list.color}, ${list.color}80)`,
                                boxShadow: `0 2px 8px ${list.color}40`
                            }}
                        />
                    )}
                </CardHeader>
                <CardContent className="pb-3 space-y-2 flex-1 flex flex-col">
                    {/* Task container */}
                    <div className="space-y-1 flex-1">
                        {children}
                    </div>
                </CardContent>
                {/* Elegant separator */}
                <div className="mx-4 border-t border-gradient-to-r from-transparent via-muted-foreground/20 to-transparent"></div>
                <CardFooter className="pt-4 bg-gradient-to-t from-muted/20 to-transparent rounded-b-lg">
                    {project.can_manage_tasks ? (
                        <Button
                            variant="ghost"
                            className="w-full border-2 border-dashed border-muted-foreground/30 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/30 dark:hover:to-indigo-950/30 transition-all duration-300 rounded-lg group"
                            size="sm"
                            onClick={() => {
                                if (onCreateTask) {
                                    onCreateTask(list);
                                }
                            }}
                        >
                            <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                            <span className="font-medium">Add Task</span>
                        </Button>
                    ) : (
                        <Button
                            variant="ghost"
                            className="w-full border-2 border-dashed border-muted-foreground/20 rounded-lg opacity-50"
                            size="sm"
                            disabled
                        >
                            <Lock className="h-4 w-4 mr-2" />
                            <span className="font-medium">Add Task</span>
                        </Button>
                    )}
                </CardFooter>
            </Card>

            {/* Resize handle */}
            {isResizable && (
                <div
                    className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors ${
                        isResizing ? 'bg-primary' : 'bg-transparent'
                    }`}
                    onMouseDown={handleMouseDown}
                    style={{ zIndex: 10 }}
                >
                    <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 w-3 h-8 bg-muted-foreground/20 rounded-sm hover:bg-primary/50 transition-colors" />
                </div>
            )}
        </div>
    );
};

// Sortable Task Component
export const SortableTask = ({ task, project, onViewTask, onEditTask, onTaskClick, onAssignTask, columnName, dragFeedback }: SortableTaskProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `task-${task.id}`,
        data: {
            type: 'task',
            task,
            listId: task.list_id,
        },
    });

    // Visual feedback - only blue pulse for cross-column movement
    const shouldPulseBlue = dragFeedback?.type === 'between-columns' &&
                           dragFeedback?.targetListId === task.list_id &&
                           !isDragging;

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : transition,
        opacity: isDragging ? 0.9 : 1,
        zIndex: isDragging ? 1000 : 'auto',
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
            {/* Main task element */}
            <div
                ref={setNodeRef}
                style={style}
                className={`mb-2 rounded-lg border bg-card p-4 shadow-sm group relative cursor-pointer task-hover-effect drag-transition ${
                    isDragging ? 'shadow-2xl scale-105 rotate-2 ring-4 ring-blue-200/50 dark:ring-blue-800/50 bg-blue-50/50 dark:bg-blue-950/20 drag-floating drag-glow' : ''
                } ${
                    shouldPulseBlue ? 'ring-2 ring-blue-400/70 shadow-lg shadow-blue-200/30 dark:shadow-blue-900/30 bg-blue-50/30 dark:bg-blue-950/20 drop-zone-active' : ''
                }`}
                data-task-clickable
                data-sortable-item
                data-dragging={isDragging}
                onClick={handleClick}
                {...attributes}
            >
                {/* Invisible drag area - covers entire task except buttons */}
                <div
                    className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing"
                    {...listeners}
                    title="Drag to move task"
                />

                {/* Action buttons - positioned absolutely */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 flex gap-1.5">
                    {/* Assign button - only show if onAssignTask is provided and project has members */}
                    {onAssignTask && project.members && project.members.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 bg-background/90 backdrop-blur-sm hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:scale-110 transition-all duration-200 rounded-full shadow-sm border border-border/50"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onAssignTask(task);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            title="Assign task"
                        >
                            <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        </Button>
                    )}

                    {/* View button - always available */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 bg-background/90 backdrop-blur-sm hover:bg-green-50 dark:hover:bg-green-950/50 hover:scale-110 transition-all duration-200 rounded-full shadow-sm border border-border/50"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onViewTask(task);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        title="View task details"
                    >
                        <Eye className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </Button>
                </div>

            {/* Assignee and priority icons - positioned at bottom-right */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10">
                {/* Assignees */}
                {task.assignees && task.assignees.length > 0 && (
                    <div className="flex items-center gap-1">
                        <div className="flex -space-x-1">
                            {task.assignees.slice(0, 3).map((assignee) => (
                                <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background shadow-md ring-1 ring-border/20 transition-transform hover:scale-110">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${assignee.name}`} />
                                    <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                                        {assignee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                            {task.assignees.length > 3 && (
                                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 border-2 border-background flex items-center justify-center text-xs text-muted-foreground font-medium shadow-md ring-1 ring-border/20">
                                    +{task.assignees.length - 3}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Priority indicator */}
                {task.priority && task.priority !== 'none' && (
                    <div className="flex items-center">
                        {task.priority === 'low' && (
                            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-sm ring-2 ring-green-200 dark:ring-green-800" title="Low Priority" />
                        )}
                        {task.priority === 'medium' && (
                            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-sm ring-2 ring-yellow-200 dark:ring-yellow-800" title="Medium Priority" />
                        )}
                        {task.priority === 'high' && (
                            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-sm ring-2 ring-red-200 dark:ring-red-800" title="High Priority" />
                        )}
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

        </div>
    );
};
