import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Board, Project, Task, TaskList } from '@/types/project-manager';
import { Head, Link, router } from '@inertiajs/react';
import { Edit, MoreHorizontal, Plus, Settings, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';

interface BoardShowProps {
    project: Project;
    board: Board;
}

// Define a type for our draggable items
interface DragItem {
    id: string;
    type: 'list' | 'task';
    listId?: number;
}

// SortableList component
function SortableList({ list, children, project }: { list: TaskList; children: React.ReactNode; project: Project }) {
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

    return (
        <div ref={setNodeRef} style={style} className="w-80 flex-shrink-0">
            <Card className="h-full">
                <CardHeader className="pb-2" {...attributes} {...listeners}>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">{list.name}</CardTitle>
                        <div className="flex items-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    {list.work_in_progress_limit && (
                        <CardDescription>
                            {(list.tasks?.length || 0)} / {list.work_in_progress_limit} items
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent className="pb-2">
                    {children}
                </CardContent>
                <CardFooter>
                    <Button
                        variant="outline"
                        className="w-full"
                        size="sm"
                        onClick={() => {
                            router.get(route('tasks.create', { project: project.id, board: list.board_id, list: list.id }));
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Task
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

// SortableTask component
function SortableTask({ task }: { task: Task }) {
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

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="mb-2 rounded-md border bg-card p-3 shadow-sm"
        >
            <Link href={route('tasks.show', { project: task.project_id, task: task.id })}>
                <div className="space-y-2">
                    <div className="font-medium">{task.title}</div>
                    {task.description && (
                        <div className="text-sm text-muted-foreground line-clamp-2">
                            {task.description}
                        </div>
                    )}
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <span className={`inline-block w-2 h-2 rounded-full ${
                                task.priority === 'low' ? 'bg-green-500' :
                                task.priority === 'medium' ? 'bg-yellow-500' :
                                task.priority === 'high' ? 'bg-orange-500' :
                                'bg-red-500'
                            }`}></span>
                            <span>{task.priority}</span>
                        </div>
                        {task.due_date && (
                            <div>
                                {new Date(task.due_date).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                </div>
            </Link>
        </div>
    );
}

export default function BoardShow({ project, board }: BoardShowProps) {
    const [lists, setLists] = useState<TaskList[]>(board.lists || []);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeItem, setActiveItem] = useState<any | null>(null);

    // Initialize lists from board data

    useEffect(() => {
        setLists(board.lists || []);
    }, [board.lists]);

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

    // Set up sensors for drag detection
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Handle drag start
    const handleDragStart = (event: any) => {
        const { active } = event;
        setActiveId(active.id);
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

        // If the item was dropped in a different position
        if (active.id !== over.id) {
            const activeId = active.id;
            const overId = over.id;

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
                    router.post(route('lists.positions', { project: project.id, board: board.id }), {
                        lists: updatedLists.map((list) => ({
                            id: list.id,
                            position: list.position,
                        })),
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

        // Insert the task at the destination
        if (sourceList.id === destinationList.id) {
            sourceTasks.splice(destinationIndex, 0, movedTask);
        } else {
            destinationTasks.splice(destinationIndex, 0, { ...movedTask, list_id: destinationList.id });
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

        router.post(route('tasks.positions', { project: project.id }), {
            tasks: tasksToUpdate,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={board.name} />
            <div className="space-y-6">


                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-semibold break-words">{board.name}</h1>
                        {board.description && <p className="text-muted-foreground mt-1 break-words">{board.description}</p>}
                    </div>
                    <div className="flex gap-2">
                        <Link href={route('boards.edit', { project: project.id, board: board.id })}>
                            <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4 mr-2" />
                                Board Settings
                            </Button>
                        </Link>
                    </div>
                </div>



                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToWindowEdges]}
                >
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        <SortableContext
                            items={lists.map(list => `list-${list.id}`)}
                            strategy={horizontalListSortingStrategy}
                        >
                            {lists.map((list) => (
                                <SortableList key={list.id} list={list} project={project}>
                                    <SortableContext
                                        items={(list.tasks || []).map(task => `task-${task.id}`)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="min-h-[200px] rounded-md">
                                            {list.tasks?.map((task) => (
                                                <SortableTask key={task.id} task={task} />
                                            ))}
                                        </div>
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
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => {
                                            const listName = prompt('Enter list name:');
                                            if (listName) {
                                                // Create a new list via API
                                                router.post(route('lists.store', { project: project.id, board: board.id }), {
                                                    name: listName,
                                                    color: '#3498db',
                                                    position: lists.length,
                                                }, {
                                                    preserveScroll: true,
                                                    onSuccess: () => {
                                                        // The page will automatically refresh with the new list
                                                        window.location.reload();
                                                    }
                                                });
                                            }
                                        }}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add List
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Drag overlay for visual feedback */}
                    <DragOverlay>
                        {activeId && activeItem?.type === 'list' && activeItem.list && (
                            <div className="w-80 flex-shrink-0 opacity-80">
                                <Card className="h-full border-2 border-primary">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-lg">{activeItem.list.name}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pb-2">
                                        <div className="min-h-[100px]"></div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                        {activeId && activeItem?.type === 'task' && activeItem.task && (
                            <div className="mb-2 rounded-md border bg-card p-3 shadow-sm opacity-80 border-2 border-primary">
                                <div className="space-y-2">
                                    <div className="font-medium">{activeItem.task.title}</div>
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
        </AppLayout>
    );
}
