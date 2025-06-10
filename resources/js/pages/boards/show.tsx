import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Board, Project, Task, TaskList, User, Label as ProjectLabel } from '@/types/project-manager';
import { Head, Link, router } from '@inertiajs/react';
import { Edit, MoreHorizontal, Plus, Settings, Trash2, Calendar, Clock, AlertCircle, CheckCircle2, User as UserIcon, Lock, GripVertical, Eye } from 'lucide-react';
import TaskEditModal from '@/components/task-edit-modal';
import TaskViewModal from '@/components/task-view-modal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useEffect, useState } from 'react';
import AddListModal from '@/components/add-list-modal';
import { DndContext, DragOverlay, closestCenter, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, CollisionDetection } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { useShortName } from '@/hooks/use-initials';
import { TaskDisplay } from '@/components/task/TaskDisplay';


interface BoardShowProps {
    project: Project;
    board: Board;
    members: User[];
    labels: ProjectLabel[];
}

// Define a type for our draggable items
interface DragItem {
    id: string;
    type: 'list' | 'task';
    listId?: number;
}

// SortableList component
function SortableList({
    list,
    children,
    project,
    boardType,
    canEdit,
    onDeleteList
}: {
    list: TaskList;
    children: React.ReactNode;
    project: Project;
    boardType: 'kanban' | 'scrum' | 'custom';
    canEdit: boolean;
    onDeleteList: (list: TaskList) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: `list-${list.id}`,
        data: {
            type: 'list',
            list,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const taskCount = list.tasks?.length || 0;
    const wipLimit = list.work_in_progress_limit;
    const isOverLimit = wipLimit && taskCount > wipLimit;

    // Get special styling for scrum board lists
    const getListStyling = () => {
        if (boardType === 'scrum') {
            const listName = list.name.toLowerCase();
            if (listName === 'backlog') {
                return 'border-l-4 border-l-gray-400';
            } else if (listName === 'sprint') {
                return 'border-l-4 border-l-blue-500';
            } else if (listName.includes('progress')) {
                return 'border-l-4 border-l-orange-500';
            } else if (listName === 'done') {
                return 'border-l-4 border-l-green-500';
            }
        }
        return '';
    };

    return (
        <div ref={setNodeRef} style={style} className="w-80 flex-shrink-0">
            <Card className={`h-full bg-muted/20 border-2 border-dashed border-muted-foreground/20 ${getListStyling()} transition-all duration-200 hover:border-muted-foreground/40`}>
                <CardHeader
                    className={`pb-3 ${canEdit ? 'cursor-grab active:cursor-grabbing hover:bg-muted/30 transition-all duration-200 rounded-t-lg' : ''}`}
                    {...(canEdit ? attributes : {})}
                    {...(canEdit ? listeners : {})}
                    title={canEdit ? "Drag to reorder list" : undefined}
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 flex-1">
                            {canEdit && <GripVertical className="h-5 w-5 text-muted-foreground" />}
                            <CardTitle className="text-lg font-semibold select-none">{list.name}</CardTitle>
                            <Badge variant="secondary" className="text-xs">
                                {taskCount}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                            {wipLimit && (
                                <Badge
                                    variant={isOverLimit ? "destructive" : "outline"}
                                    className="text-xs"
                                >
                                    {taskCount}/{wipLimit}
                                </Badge>
                            )}
                            {canEdit ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={() => {
                                            // TODO: Implement edit list functionality
                                            alert('Edit list functionality coming soon!');
                                        }}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit List
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => {
                                            // TODO: Implement list settings functionality
                                            alert('List settings functionality coming soon!');
                                        }}>
                                            <Settings className="h-4 w-4 mr-2" />
                                            List Settings
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-white bg-red-600 hover:bg-red-700 focus:bg-red-700 focus:text-white data-[highlighted]:bg-red-700 data-[highlighted]:text-white"
                                            onClick={() => onDeleteList(list)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2 text-white" />
                                            Delete List
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                                    <Lock className="h-4 w-4" />
                                </Button>
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
                    <div className="min-h-[300px] max-h-[600px] overflow-y-auto">
                        {children}
                    </div>
                </CardContent>
                <CardFooter className="pt-3 border-t">
                    {canEdit ? (
                        <Button
                            variant="ghost"
                            className="w-full border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5"
                            size="sm"
                            onClick={() => {
                                router.get(route('tasks.create', { project: project.id, board: list.board_id, list: list.id, tab: 'boards' }));
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
}

// SortableTask component
function SortableTask({
    task,
    canEdit,
    onEdit,
    onView
}: {
    task: Task;
    canEdit: boolean;
    onEdit: (task: Task) => void;
    onView: (task: Task) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: `task-${task.id}`,
        data: {
            type: 'task',
            task,
            listId: task.list_id,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'low': return 'bg-green-500';
            case 'medium': return 'bg-yellow-500';
            case 'high': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'urgent': return <AlertCircle className="h-3 w-3 text-red-500" />;
            case 'high': return <AlertCircle className="h-3 w-3 text-orange-500" />;
            default: return null;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'to_do':
                return (
                    <Badge variant="outline" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
                        To Do
                    </Badge>
                );
            case 'in_progress':
                return (
                    <Badge variant="outline" className="text-xs px-2 py-0.5 bg-yellow-50 text-yellow-700 border-yellow-200">
                        In Progress
                    </Badge>
                );
            case 'done':
                return (
                    <Badge variant="outline" className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border-green-200">
                        Done
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                        {status.replace('_', ' ')}
                    </Badge>
                );
        }
    };

    const isOverdue = task.due_date && new Date(task.due_date) < new Date();
    const isDueSoon = task.due_date && new Date(task.due_date) <= new Date(Date.now() + 24 * 60 * 60 * 1000);

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...(canEdit ? listeners : {})}
            className={`mb-3 rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-all duration-200 group ${canEdit ? 'cursor-pointer' : 'cursor-default'} relative`}
        >
            {/* Action buttons - positioned absolutely */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
                {/* View button - always available */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 bg-background/80 hover:bg-background"
                    onClick={(e) => {
                        e.stopPropagation();
                        onView(task);
                    }}
                >
                    <Eye className="h-3 w-3" />
                </Button>

                {/* Edit button - only if user can edit */}
                {canEdit ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 bg-background/80 hover:bg-background"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(task);
                        }}
                    >
                        <Edit className="h-3 w-3" />
                    </Button>
                ) : (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-background/80" disabled>
                        <Lock className="h-3 w-3" />
                    </Button>
                )}
            </div>

            <div
                className="space-y-3 cursor-pointer pr-8"
                onClick={(e) => {
                    // Only trigger view if not clicking on action buttons
                    if (!(e.target as Element).closest('.absolute')) {
                        onView(task);
                    }
                }}
            >
                <TaskDisplay task={task} compact />

                {/* Task Labels */}
                {task.labels && task.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {task.labels.slice(0, 3).map((label) => (
                            <Badge
                                key={label.id}
                                variant="secondary"
                                className="text-xs px-2 py-0.5"
                                style={{ backgroundColor: `${label.color}20`, color: label.color }}
                            >
                                {label.name}
                            </Badge>
                        ))}
                        {task.labels.length > 3 && (
                            <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                +{task.labels.length - 3}
                            </Badge>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function BoardShow({ project, board, members, labels }: BoardShowProps) {
    const getShortName = useShortName();
    const [lists, setLists] = useState<TaskList[]>(board.lists || []);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeItem, setActiveItem] = useState<any | null>(null);
    const [addListModalOpen, setAddListModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [listToDelete, setListToDelete] = useState<TaskList | null>(null);

    // Task modal states
    const [taskEditModalOpen, setTaskEditModalOpen] = useState(false);
    const [taskViewModalOpen, setTaskViewModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // Initialize lists from board data
    useEffect(() => {
        setLists(board.lists || []);
    }, [board.lists]);

    // Handle opening task edit modal
    const handleEditTask = (task: Task) => {
        setSelectedTask(task);
        setTaskEditModalOpen(true);
    };

    // Handle opening task view modal
    const handleViewTask = (task: Task) => {
        setSelectedTask(task);
        setTaskViewModalOpen(true);
    };

    // Handle opening edit modal from view modal
    const handleEditFromView = () => {
        setTaskViewModalOpen(false);
        setTaskEditModalOpen(true);
    };

    // Handle list deletion
    const handleDeleteList = () => {
        if (listToDelete) {
            router.delete(route('lists.destroy', {
                project: project.id,
                board: listToDelete.board_id,
                list: listToDelete.id
            }));
        }
    };

    // Open delete confirmation dialog
    const openDeleteDialog = (list: TaskList) => {
        setListToDelete(list);
        setDeleteDialogOpen(true);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Projects',
            href: route('projects.index'),
        },
        {
            title: project.name,
            href: route('projects.show', { project: project.id }),
        },
        {
            title: board.name,
            href: route('boards.show', { project: project.id, board: board.id }),
        },
    ];

    // Custom collision detection optimized for horizontal list sorting
    const customCollisionDetection: CollisionDetection = (args) => {
        const { active, droppableContainers, pointerCoordinates } = args;

        // If dragging a list, use horizontal-optimized collision detection
        if (active.id.toString().startsWith('list-')) {
            const listContainers = Array.from(droppableContainers.values()).filter(
                container => container.id.toString().startsWith('list-')
            );

            if (!pointerCoordinates) {
                return closestCenter({
                    ...args,
                    droppableContainers: new Map(listContainers.map(c => [c.id, c]))
                });
            }

            // Find the closest container based on horizontal distance
            let closestContainer = null;
            let closestDistance = Infinity;

            for (const container of listContainers) {
                const rect = container.rect.current;
                if (!rect) continue;

                // Calculate horizontal distance to center of container
                const containerCenterX = rect.left + rect.width / 2;
                const horizontalDistance = Math.abs(pointerCoordinates.x - containerCenterX);

                // Only consider containers that are vertically aligned (within reasonable range)
                const verticalDistance = Math.abs(pointerCoordinates.y - (rect.top + rect.height / 2));
                if (verticalDistance < rect.height) {
                    if (horizontalDistance < closestDistance) {
                        closestDistance = horizontalDistance;
                        closestContainer = container;
                    }
                }
            }

            return closestContainer ? [{ id: closestContainer.id }] : [];
        }

        // For tasks, use the default collision detection
        return closestCenter(args);
    };

    // Set up sensors for drag detection
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Handle drag start
    const handleDragStart = (event: any) => {
        const { active } = event;
        const activeId = active.id;

        // Check permissions based on what's being dragged
        if (activeId.startsWith('list-')) {
            // For list dragging, check if user can manage boards
            if (!board.can_edit) {
                return;
            }
        } else if (activeId.startsWith('task-')) {
            // For task dragging, check if user can manage tasks
            if (!board.can_manage_tasks) {
                return;
            }
        }

        setActiveId(activeId);
        setActiveItem(active.data.current);
    };

    // Handle drag end
    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            setActiveItem(null);
            return;
        }

        const activeId = active.id;
        const overId = over.id;

        // Check permissions based on what's being dragged
        if (activeId.startsWith('list-')) {
            if (!board.can_edit) {
                setActiveId(null);
                setActiveItem(null);
                return;
            }
        } else if (activeId.startsWith('task-')) {
            if (!board.can_manage_tasks) {
                setActiveId(null);
                setActiveItem(null);
                return;
            }
        }

        // If the item was dropped in a different position
        if (activeId !== overId) {

            // Handle list reordering
            if (activeId.startsWith('list-') && overId.startsWith('list-')) {
                const activeIndex = lists.findIndex(list => `list-${list.id}` === activeId);
                const overIndex = lists.findIndex(list => `list-${list.id}` === overId);

                if (activeIndex !== -1 && overIndex !== -1) {
                    const newLists = arrayMove(lists, activeIndex, overIndex);

                    // Update positions
                    const updatedLists = newLists.map((list, index) => ({
                        ...list,
                        position: index,
                    }));

                    setLists(updatedLists);

                    // Send the updated positions to the server
                    fetch(route('lists.positions', { project: project.id, board: board.id }), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        },
                        body: JSON.stringify({
                            lists: updatedLists.map((list) => ({
                                id: list.id,
                                position: list.position,
                            })),
                        }),
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(() => {
                        // List positions updated successfully
                    })
                    .catch(() => {
                        // Revert the changes on error
                        setLists(board.lists || []);
                        alert('Failed to save list order. Please try again.');
                    });
                }
            }
            // Handle task reordering or moving between lists
            else if (activeId.startsWith('task-') && overId) {
                const activeTaskId = parseInt(activeId.replace('task-', ''));

                // Find the source list that contains the task
                const sourceListId = active.data.current.listId;
                const sourceList = lists.find(list => list.id === sourceListId);

                if (!sourceList) {
                    setActiveId(null);
                    setActiveItem(null);
                    return;
                }

                // If dropping on another task
                if (overId.startsWith('task-')) {
                    const overTaskId = parseInt(overId.replace('task-', ''));
                    const overTask = lists.flatMap(list => list.tasks || []).find(task => task.id === overTaskId);

                    if (!overTask) {
                        setActiveId(null);
                        setActiveItem(null);
                        return;
                    }

                    const destinationListId = overTask.list_id;
                    const destinationList = lists.find(list => list.id === destinationListId);

                    if (!destinationList) {
                        setActiveId(null);
                        setActiveItem(null);
                        return;
                    }

                    // Handle moving task within the same list or to a different list
                    handleTaskMove(sourceList, destinationList, activeTaskId, overTaskId);
                }
                // If dropping directly on a list
                else if (overId.startsWith('list-')) {
                    const destinationListId = parseInt(overId.replace('list-', ''));
                    const destinationList = lists.find(list => list.id === destinationListId);

                    if (!destinationList) {
                        setActiveId(null);
                        setActiveItem(null);
                        return;
                    }

                    // Move the task to the end of the destination list
                    const taskToMove = sourceList.tasks?.find(task => task.id === activeTaskId);

                    if (taskToMove) {
                        handleTaskMove(sourceList, destinationList, activeTaskId);
                    }
                }
            }
        }

        setActiveId(null);
        setActiveItem(null);
    };

    // Helper function to map list name to task status
    const getStatusFromListName = (listName: string): string | null => {
        const name = listName.toLowerCase().trim();

        switch (name) {
            case 'to do':
            case 'todo':
            case 'backlog':
            case 'new':
            case 'open':
                return 'to_do';
            case 'doing':
            case 'in progress':
            case 'in-progress':
            case 'inprogress':
            case 'active':
            case 'working':
                return 'in_progress';
            case 'review':
            case 'testing':
            case 'qa':
            case 'pending review':
                return 'review';
            case 'done':
            case 'completed':
            case 'finished':
            case 'closed':
            case 'complete':
                return 'done';
            default:
                return null;
        }
    };

    // Helper function to handle task movement
    const handleTaskMove = (sourceList: TaskList, destinationList: TaskList, taskId: number, targetTaskId?: number) => {
        // Create copies of the task arrays
        const sourceTasks = Array.from(sourceList.tasks || []);
        const destinationTasks = sourceList.id === destinationList.id
            ? sourceTasks
            : Array.from(destinationList.tasks || []);

        // Find the task to move
        const sourceTaskIndex = sourceTasks.findIndex(task => task.id === taskId);
        if (sourceTaskIndex === -1) return;

        // Remove the task from the source list
        const [movedTask] = sourceTasks.splice(sourceTaskIndex, 1);

        // Determine the insertion index in the destination list
        let destinationIndex = destinationTasks.length;

        if (targetTaskId) {
            const targetIndex = destinationTasks.findIndex(task => task.id === targetTaskId);
            if (targetIndex !== -1) {
                destinationIndex = targetIndex;
                // If moving within the same list and the source index is before the target,
                // we need to adjust the destination index
                if (sourceList.id === destinationList.id && sourceTaskIndex < targetIndex) {
                    destinationIndex--;
                }
            }
        }

        // Update task status based on destination list name
        const newStatus = getStatusFromListName(destinationList.name);
        const updatedTask = {
            ...movedTask,
            list_id: destinationList.id,
            ...(newStatus && { status: newStatus }),
            ...(newStatus === 'done' && movedTask.status !== 'done' && { completed_at: new Date().toISOString() }),
            ...(newStatus !== 'done' && movedTask.status === 'done' && { completed_at: null })
        };

        // Insert the task at the destination
        if (sourceList.id === destinationList.id) {
            sourceTasks.splice(destinationIndex, 0, updatedTask);
        } else {
            destinationTasks.splice(destinationIndex, 0, updatedTask);
        }

        // Update task positions
        const updatedSourceTasks = sourceTasks.map((task, index) => ({
            ...task,
            position: index,
        }));

        const updatedDestinationTasks = sourceList.id === destinationList.id
            ? updatedSourceTasks
            : destinationTasks.map((task, index) => ({
                ...task,
                position: index,
            }));

        // Create a new lists array with the updated tasks
        const newLists = lists.map(list => {
            if (list.id === sourceList.id) {
                return { ...list, tasks: updatedSourceTasks };
            }
            if (list.id === destinationList.id) {
                return { ...list, tasks: updatedDestinationTasks };
            }
            return list;
        });

        setLists(newLists);

        // Send the updated positions to the server
        const tasksToUpdate = [];
        if (sourceList.id === destinationList.id) {
            tasksToUpdate.push(...updatedSourceTasks.map(task => ({
                id: task.id,
                position: task.position,
                list_id: sourceList.id,
            })));
        } else {
            tasksToUpdate.push(...updatedSourceTasks.map(task => ({
                id: task.id,
                position: task.position,
                list_id: sourceList.id,
            })));
            tasksToUpdate.push(...updatedDestinationTasks.map(task => ({
                id: task.id,
                position: task.position,
                list_id: destinationList.id,
            })));
        }

        fetch(route('tasks.positions', { project: project.id }), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
            body: JSON.stringify({
                tasks: tasksToUpdate,
            }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(() => {
            // Task positions updated successfully
        })
        .catch(() => {
            // Revert the changes on error
            setLists(board.lists || []);
            alert('Failed to save task changes. Please try again.');
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={board.name} />
            <div className="space-y-6 w-full max-w-none">


                <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl font-bold break-words">{board.name}</h1>
                                <Badge variant="outline" className="text-sm">
                                    {board.type.charAt(0).toUpperCase() + board.type.slice(1)} Board
                                </Badge>
                            </div>
                        </div>
                        {board.description && (
                            <p className="text-muted-foreground mt-1 text-base leading-relaxed break-words">
                                {board.description}
                            </p>
                        )}

                        {/* Board type specific help text */}
                        {board.type === 'scrum' && !board.description && (
                            <p className="text-muted-foreground mt-1 text-sm">
                                <strong>Scrum workflow:</strong> Move tasks from Backlog → Sprint → In Progress → Done
                            </p>
                        )}
                        {board.type === 'custom' && !board.description && lists.length === 0 && (
                            <p className="text-muted-foreground mt-1 text-sm">
                                <strong>Custom board:</strong> Create your own workflow by adding lists below
                            </p>
                        )}

                        {/* Board Stats */}
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <span className="font-medium">{lists.length}</span>
                                <span>list{lists.length !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="font-medium">
                                    {lists.reduce((total, list) => total + (list.tasks?.length || 0), 0)}
                                </span>
                                <span>task{lists.reduce((total, list) => total + (list.tasks?.length || 0), 0) !== 1 ? 's' : ''}</span>
                            </div>
                            {board.type === 'scrum' && (
                                <div className="flex items-center gap-1">
                                    <span className="font-medium">
                                        {lists.find(list => list.name.toLowerCase() === 'sprint')?.tasks?.length || 0}
                                    </span>
                                    <span>in sprint</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Created {new Date(board.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                        {board.can_edit ? (
                            <Link href={route('boards.edit', { project: project.id, board: board.id })}>
                                <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md">
                                    <Settings className="h-4 w-4 mr-2" />
                                    Board Settings
                                </Button>
                            </Link>
                        ) : (
                            <Button variant="outline" size="sm" disabled className="shadow-sm">
                                <Lock className="h-4 w-4 mr-2" />
                                Board Settings
                            </Button>
                        )}
                    </div>
                </div>



                <DndContext
                    sensors={sensors}
                    collisionDetection={customCollisionDetection}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToWindowEdges]}
                >
                    <div className="flex gap-4 overflow-x-auto pb-4 w-full pr-4">
                        <SortableContext
                            items={lists.map(list => `list-${list.id}`)}
                            strategy={horizontalListSortingStrategy}
                        >
                            {lists.map((list) => (
                                <SortableList
                                    key={list.id}
                                    list={list}
                                    project={project}
                                    boardType={board.type}
                                    canEdit={board.can_edit || false}
                                    onDeleteList={openDeleteDialog}
                                >
                                    <SortableContext
                                        items={(list.tasks || []).map(task => `task-${task.id}`)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {list.tasks && list.tasks.length > 0 ? (
                                            list.tasks.map((task) => (
                                                <SortableTask
                                                    key={task.id}
                                                    task={task}
                                                    canEdit={board.can_manage_tasks || false}
                                                    onEdit={handleEditTask}
                                                    onView={handleViewTask}
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

                        {/* Add new list card */}
                        <div className="w-80 flex-shrink-0">
                            <Card className="h-full border-dashed">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">Add List</CardTitle>
                                </CardHeader>
                                <CardContent className="flex items-center justify-center h-full">
                                    {board.can_edit ? (
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => setAddListModalOpen(true)}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add List
                                        </Button>
                                    ) : (
                                        <Button variant="outline" className="w-full" disabled>
                                            <Lock className="h-4 w-4 mr-2" />
                                            Add List
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Drag overlay for visual feedback */}
                    <DragOverlay>
                        {activeId && activeItem?.type === 'list' && activeItem.list && (
                            <div className="w-80 flex-shrink-0 opacity-90 transform rotate-2">
                                <Card className="h-full border-2 border-primary shadow-2xl bg-background">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-lg font-semibold">{activeItem.list.name}</CardTitle>
                                            <Badge variant="secondary" className="text-xs">
                                                {activeItem.list.tasks?.length || 0}
                                            </Badge>
                                        </div>
                                        {activeItem.list.color && (
                                            <div
                                                className="w-full h-1 rounded-full mt-2"
                                                style={{ backgroundColor: activeItem.list.color }}
                                            />
                                        )}
                                    </CardHeader>
                                    <CardContent className="pb-2">
                                        <div className="min-h-[100px] bg-muted/20 rounded border-dashed border"></div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                        {activeId && activeItem?.type === 'task' && activeItem.task && (
                            <div className="mb-2 rounded-md border bg-card p-3 shadow-sm opacity-80 border-2 border-primary">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="font-medium">{activeItem.task.title}</div>
                                        {activeItem.task.status === 'done' && (
                                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                        )}
                                    </div>
                                    {activeItem.task.description && (
                                        <div className="text-sm text-muted-foreground line-clamp-2">
                                            {activeItem.task.description}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </DragOverlay>
                </DndContext>
            </div>

            <AddListModal
                project={project}
                board={board}
                open={addListModalOpen}
                onOpenChange={setAddListModalOpen}
            />

            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete List"
                description={`Are you sure you want to delete the list "${listToDelete?.name}"? This action cannot be undone and will also delete all tasks in this list.`}
                onConfirm={handleDeleteList}
                confirmText="Delete List"
                cancelText="Cancel"
                variant="destructive"
            />

            {/* Task Modals */}
            {selectedTask && (
                <TaskEditModal
                    open={taskEditModalOpen}
                    onOpenChange={setTaskEditModalOpen}
                    project={project}
                    task={selectedTask}
                    members={members}
                    labels={labels}
                    lists={lists}
                />
            )}

            {selectedTask && (
                <TaskViewModal
                    open={taskViewModalOpen}
                    onOpenChange={setTaskViewModalOpen}
                    project={project}
                    task={selectedTask}
                    onEdit={board.can_manage_tasks ? handleEditFromView : undefined}
                />
            )}
        </AppLayout>
    );
}
