import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';

import { Checkbox } from '@/components/ui/checkbox';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger, 
    DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { GripVertical, MoreHorizontal, Eye, Trash2 } from 'lucide-react';
import { Project } from '@/types/project-manager';

import { useTaskOperations } from '../hooks/useTaskOperations';
import { TaskDisplay } from '@/components/task/TaskDisplay';

interface ListTaskItemProps {
    task: any;
    project: Project;
    sectionId?: string;
    onTaskClick: (task: any, event?: React.MouseEvent) => void;
    onEditTask: (task: any) => void;
    currentView?: string;
    isSelected?: boolean;
    onToggleSelection?: (taskId: number, event?: React.MouseEvent) => void;
    currentBoardId?: number;
    allTasks?: any[]; // All tasks in the current section for position calculations
    dragFeedback?: {
        type: 'within-column' | 'between-columns' | 'invalid' | null;
        targetTaskId?: number | null;
        sourceTaskId?: number | null;
        insertionPosition?: 'before' | 'after';
    };
}

export default function ListTaskItem({
    task,
    project,
    sectionId,
    onTaskClick,
    onEditTask,
    currentView,
    isSelected = false,
    onToggleSelection,
    currentBoardId,
    allTasks = [],
    dragFeedback
}: ListTaskItemProps) {

    const { toggleTaskCompletion, deleteTask } = useTaskOperations(project, currentView, currentBoardId);

    // Drag and drop functionality
    const {
        attributes,
        listeners,
        setNodeRef: setSortableRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `list-task-${task.id}`,
        data: {
            type: 'task',
            task,
            sectionId
        },
    });

    // Create drop zones for insertion-based positioning
    const { setNodeRef: setDroppableRefBefore, isOver: isOverBefore } = useDroppable({
        id: `list-task-${task.id}-before`,
        data: {
            type: 'task-insertion',
            task,
            sectionId,
            position: 'before',
        },
    });

    const { setNodeRef: setDroppableRefAfter, isOver: isOverAfter } = useDroppable({
        id: `list-task-${task.id}-after`,
        data: {
            type: 'task-insertion',
            task,
            sectionId,
            position: 'after',
        },
    });

    // Combine refs for the main task element
    const setNodeRef = (node: HTMLElement | null) => {
        setSortableRef(node);
    };

    // Check if this task should be animated due to drag and drop
    let shouldAnimateUp = false;
    let shouldAnimateDown = false;

    if (dragFeedback?.sourceTaskId && dragFeedback?.targetTaskId && allTasks.length > 0) {
        const sourceTaskId = dragFeedback.sourceTaskId;
        const targetTaskId = dragFeedback.targetTaskId;
        const insertionPosition = dragFeedback.insertionPosition;

        // Don't animate the dragged task itself
        if (task.id === sourceTaskId) {
            // Skip animation for the dragged task
        } else {
            // Find positions of source and target tasks
            const sourceIndex = allTasks.findIndex(t => t.id === sourceTaskId);
            const targetIndex = allTasks.findIndex(t => t.id === targetTaskId);
            const currentIndex = allTasks.findIndex(t => t.id === task.id);

            if (sourceIndex !== -1 && targetIndex !== -1 && currentIndex !== -1) {
                // Determine if we're dragging up or down
                const isDraggingDown = sourceIndex < targetIndex;
                const isDraggingUp = sourceIndex > targetIndex;

                if (isDraggingDown) {
                    // When dragging down, tasks between source and target should move up
                    if (insertionPosition === 'before') {
                        if (currentIndex > sourceIndex && currentIndex < targetIndex) {
                            shouldAnimateUp = true;
                        } else if (currentIndex === targetIndex) {
                            shouldAnimateUp = true;
                        }
                    } else {
                        if (currentIndex > sourceIndex && currentIndex <= targetIndex) {
                            shouldAnimateUp = true;
                        }
                    }
                } else if (isDraggingUp) {
                    // When dragging up, tasks between target and source should move down
                    if (insertionPosition === 'before') {
                        if (currentIndex >= targetIndex && currentIndex < sourceIndex) {
                            shouldAnimateDown = true;
                        }
                    } else {
                        if (currentIndex > targetIndex && currentIndex < sourceIndex) {
                            shouldAnimateDown = true;
                        } else if (currentIndex === targetIndex) {
                            shouldAnimateDown = true;
                        }
                    }
                }
            }
        }
    }

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : 'all 0.2s ease-in-out',
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 1000 : 'auto',
    };

    const handleTaskClick = (event: React.MouseEvent) => {
        // Task click no longer opens inspector - only view button does
        if (!isDragging) {
            // Allow selection behavior but don't open inspector
            if (event.ctrlKey || event.metaKey || event.shiftKey) {
                onTaskClick(task, event);
            }
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
            {/* Drop zone before task */}
            <div
                ref={setDroppableRefBefore}
                className={`h-2 w-full transition-all duration-200 ${
                    isOverBefore
                        ? 'bg-purple-400/30 border-t-2 border-purple-400'
                        : ''
                }`}
                style={{ marginBottom: isOverBefore ? '8px' : '0px' }}
            />

            {/* Main task element */}
            <div
                ref={setNodeRef}
                style={style}
                className={`group relative bg-white dark:bg-gray-800 border border-border rounded-lg p-3 hover:shadow-md transition-all duration-200 cursor-pointer ${
                    task.status === 'done' ? 'opacity-60' : ''
                } ${isSelected
                    ? 'ring-2 ring-primary/30 border-primary/30'
                    : 'hover:border-primary/20'
                } ${
                    // Show purple highlight and animation when this task is being hovered over during drag
                    isOverBefore
                        ? 'ring-2 ring-purple-400/60 shadow-lg shadow-purple-200/50 transform translate-y-2'
                        : isOverAfter
                        ? 'ring-2 ring-purple-400/60 shadow-lg shadow-purple-200/50 transform -translate-y-2'
                        : shouldAnimateUp
                        ? 'transform -translate-y-2'
                        : shouldAnimateDown
                        ? 'transform translate-y-2'
                        : ''
                }`}
                data-task-clickable
                data-task-id={task.id}
                onClick={handleTaskClick}
            >
            {/* Invisible drag area */}
            <div
                {...attributes}
                {...listeners}
                className="absolute inset-0 cursor-grab active:cursor-grabbing z-0"
            />

            <div className="flex items-start gap-3 ml-6">
                {/* Completion checkbox */}
                <Checkbox
                    checked={task.status === 'done'}
                    onCheckedChange={handleCheckboxChange}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1"
                />

                {/* Task content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <TaskDisplay task={task} compact pageKey={`project-list-${task.project_id}`} />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 ml-2">
                            {/* View button - always available */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTaskClick(task, e);
                                }}
                            >
                                <Eye className="h-3 w-3" />
                            </Button>

                            {project.can_manage_tasks && (
                                <>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                <MoreHorizontal className="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={handleDeleteTask}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            </div>

            {/* Drop zone after task */}
            <div
                ref={setDroppableRefAfter}
                className={`h-2 w-full transition-all duration-200 ${
                    isOverAfter
                        ? 'bg-purple-400/30 border-b-2 border-purple-400'
                        : ''
                }`}
                style={{ marginTop: isOverAfter ? '8px' : '0px' }}
            />
        </div>
    );
}
