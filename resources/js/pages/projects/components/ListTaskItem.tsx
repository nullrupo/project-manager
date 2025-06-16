import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { GripVertical, MoreHorizontal, Eye, Trash2, Users } from 'lucide-react';
import { Project } from '@/types/project-manager';
import { useTaskOperations } from '../hooks/useTaskOperations';
import { TaskDisplay } from '@/components/task/TaskDisplay';



interface ListTaskItemProps {
    task: any;
    project: Project;
    sectionId?: string;
    onTaskClick: (task: any, event?: React.MouseEvent) => void;
    onEditTask: (task: any) => void;
    onViewTask?: (task: any) => void;
    onAssignTask?: (task: any) => void;
    currentView?: string;
    isSelected?: boolean;
    onToggleSelection?: (taskId: number, event?: React.MouseEvent) => void;
    currentBoardId?: number;
    dragFeedback?: {
        overId: string | null;
        overType: 'task' | 'list' | null;
        activeId: string | null;
        draggedTaskSectionId: string | null;
        isTaskDrag: boolean;
    } | null;
}

export default function ListTaskItem({
    task,
    project,
    sectionId,
    onTaskClick,
    onEditTask,
    onViewTask,
    onAssignTask,
    currentView,
    isSelected = false,
    onToggleSelection,
    currentBoardId,
    dragFeedback
}: ListTaskItemProps) {

    const { toggleTaskCompletion, deleteTask } = useTaskOperations(project, currentView, currentBoardId);

    // Enhanced drag and drop functionality
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `list-task-${task.id}`,
        data: {
            type: 'task',
            task,
            sectionId,
            listId: task.list_id
        },
    });

    // Also make it explicitly droppable for better collision detection
    const { setNodeRef: setDroppableRef, isOver, active } = useDroppable({
        id: `list-task-${task.id}`,
        data: {
            type: 'task',
            task,
            sectionId,
            listId: task.list_id,
        },
    });

    // Enhanced drag feedback detection (same-section only, like single column)
    const isThisTaskTargeted = dragFeedback?.isTaskDrag &&
        dragFeedback?.overId === `list-task-${task.id}`;

    const draggedTaskSectionId = dragFeedback?.draggedTaskSectionId;

    // Same-section drag detection (purple ring) - treat list like single column
    const isSameSectionDrag = isThisTaskTargeted && draggedTaskSectionId === sectionId;

    // Combine refs
    const combinedRef = (node: HTMLElement | null) => {
        setNodeRef(node);
        setDroppableRef(node);
    };

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : transition,
        opacity: isDragging ? 0.9 : 1,
        zIndex: isDragging ? 1000 : 'auto',
    };

    const handleTaskClick = (event: React.MouseEvent) => {
        // Prevent click when dragging
        if (isDragging) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        // Allow selection behavior but don't open inspector
        if (event.ctrlKey || event.metaKey || event.shiftKey) {
            onTaskClick(task, event);
        }
    };

    const handleCheckboxChange = () => {
        toggleTaskCompletion(task.id);
    };

    const handleDeleteTask = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteTask(task.id);
    };

    return (
        <div className="relative">
            {/* Enhanced task element with drag feedback */}
            <div
                ref={combinedRef}
                style={style}
                className={`group relative bg-card border rounded-lg p-3 cursor-grab hover:shadow-md transition-all duration-200 ml-4 ${
                    task.status === 'done' ? 'opacity-60' : ''
                } ${isSelected
                    ? 'ring-2 ring-primary/40 border-primary/40'
                    : 'border-border hover:border-primary/30'
                } ${
                    isDragging ? 'shadow-xl scale-105 opacity-90 cursor-grabbing' : 'active:cursor-grabbing'
                } ${isSameSectionDrag ? 'ring-4 ring-purple-500 ring-opacity-75 border-purple-500' : ''}`}
                data-task-clickable
                data-task-id={task.id}
                onClick={handleTaskClick}
                title="Drag to move task"
            >
                {/* Invisible drag area - covers entire task except buttons */}
                <div
                    className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing"
                    {...attributes}
                    {...listeners}
                    title="Drag to move task"
                />

                {/* Enhanced action buttons */}
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
                            if (onViewTask) {
                                onViewTask(task);
                            } else {
                                onTaskClick(task, e);
                            }
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        title="View task details"
                    >
                        <Eye className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </Button>
                </div>

                {/* Enhanced assignee and priority indicators */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10">
                    {/* Assignees */}
                    {task.assignees && task.assignees.length > 0 && (
                        <div className="flex items-center gap-1">
                            <div className="flex -space-x-1">
                                {task.assignees.slice(0, 3).map((assignee) => (
                                    <Avatar key={assignee.id} className="h-5 w-5 border-2 border-background shadow-md ring-1 ring-border/20 transition-transform hover:scale-110">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${assignee.name}`} />
                                        <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                                            {assignee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                ))}
                                {task.assignees.length > 3 && (
                                    <div className="h-5 w-5 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 border-2 border-background flex items-center justify-center text-xs text-muted-foreground font-medium shadow-md ring-1 ring-border/20">
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
                                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-sm ring-2 ring-green-200 dark:ring-green-800" title="Low Priority" />
                            )}
                            {task.priority === 'medium' && (
                                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-sm ring-2 ring-yellow-200 dark:ring-yellow-800" title="Medium Priority" />
                            )}
                            {task.priority === 'high' && (
                                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-sm ring-2 ring-red-200 dark:ring-red-800" title="High Priority" />
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-start gap-3 pr-16 pb-8">
                    {/* Enhanced completion checkbox */}
                    <Checkbox
                        checked={task.status === 'done'}
                        onCheckedChange={handleCheckboxChange}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 z-10 h-4 w-4 transition-all duration-200 hover:scale-110"
                    />

                    {/* Enhanced task content */}
                    <div className="flex-1 min-w-0">
                        <TaskDisplay task={task} compact pageKey={`project-list-${task.project_id}`} />
                    </div>
                </div>
            </div>
        </div>
    );
}
