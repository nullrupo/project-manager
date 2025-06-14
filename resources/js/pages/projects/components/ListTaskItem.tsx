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

// Enhanced Insertion Drop Zone for List View
interface ListInsertionDropZoneProps {
    sectionId: string;
    position: number;
    isVisible: boolean;
}

export const ListInsertionDropZone = ({ sectionId, position, isVisible }: ListInsertionDropZoneProps) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `list-insertion-${sectionId}-${position}`,
        data: {
            type: 'list-insertion',
            sectionId,
            position,
        },
    });

    // Only show drop zone when actively dragging and hovering
    const shouldShow = isVisible && isOver;

    return (
        <div
            ref={setNodeRef}
            className={`transition-all duration-150 ease-out mx-4 ${
                shouldShow
                    ? 'h-6 w-full bg-blue-100 dark:bg-blue-900/30 border border-dashed border-blue-400 dark:border-blue-500 rounded-sm mb-1 flex items-center justify-center'
                    : 'h-0 w-full overflow-hidden'
            }`}
        >
            {shouldShow && (
                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-xs font-medium">
                    <div className="w-1 h-1 rounded-full bg-blue-500" />
                    Drop here
                    <div className="w-1 h-1 rounded-full bg-blue-500" />
                </div>
            )}
        </div>
    );
};

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
    currentBoardId
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

    // No visual feedback on tasks to prevent flashing - only use drop zones

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
            {/* Compact task element */}
            <div
                ref={setNodeRef}
                style={style}
                className={`group relative bg-card border border-border rounded-md p-2.5 cursor-pointer hover:shadow-sm transition-all duration-200 ml-4 ${
                    task.status === 'done' ? 'opacity-60' : ''
                } ${isSelected
                    ? 'ring-1 ring-primary/30 border-primary/30'
                    : 'hover:border-primary/20'
                } ${
                    isDragging ? 'shadow-lg scale-102 opacity-80' : ''
                }`}
                data-task-clickable
                data-task-id={task.id}
                onClick={handleTaskClick}
            >
                {/* Invisible drag area - covers entire task except buttons */}
                <div
                    className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing"
                    {...attributes}
                    {...listeners}
                    title="Drag to move task"
                />

                {/* Compact action buttons */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 flex gap-1">
                    {/* View button - always available */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 bg-background/80 hover:bg-green-50 dark:hover:bg-green-950/50 transition-colors rounded-md"
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
                        <Eye className="h-3 w-3" />
                    </Button>

                    {/* More actions dropdown */}
                    {project.can_manage_tasks && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 bg-background/80 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors rounded-md"
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <MoreHorizontal className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={handleDeleteTask}
                                    className="text-destructive"
                                >
                                    <Trash2 className="h-3 w-3 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* Compact assignee and priority indicators */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-10">
                    {/* Assignees */}
                    {task.assignees && task.assignees.length > 0 && (
                        <div className="flex -space-x-0.5">
                            {task.assignees.slice(0, 2).map((assignee) => (
                                <Avatar key={assignee.id} className="h-4 w-4 border border-background">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${assignee.name}`} />
                                    <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                                        {assignee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                            {task.assignees.length > 2 && (
                                <div className="h-4 w-4 rounded-full bg-muted border border-background flex items-center justify-center text-xs text-muted-foreground font-medium">
                                    +{task.assignees.length - 2}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Priority indicator */}
                    {task.priority && task.priority !== 'none' && (
                        <div className="flex items-center">
                            {task.priority === 'low' && (
                                <div className="w-2 h-2 rounded-full bg-green-500" title="Low Priority" />
                            )}
                            {task.priority === 'medium' && (
                                <div className="w-2 h-2 rounded-full bg-yellow-500" title="Medium Priority" />
                            )}
                            {task.priority === 'high' && (
                                <div className="w-2 h-2 rounded-full bg-red-500" title="High Priority" />
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-start gap-2.5 pr-12 pb-6">
                    {/* Completion checkbox */}
                    <Checkbox
                        checked={task.status === 'done'}
                        onCheckedChange={handleCheckboxChange}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5 z-10 h-4 w-4"
                    />

                    {/* Task content */}
                    <div className="flex-1 min-w-0">
                        <TaskDisplay task={task} compact pageKey={`project-list-${task.project_id}`} />
                    </div>
                </div>
            </div>
        </div>
    );
}
