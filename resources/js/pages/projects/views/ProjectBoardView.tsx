import { SortableContext, horizontalListSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { DndContext, closestCenter, DragOverlay, CollisionDetection } from '@dnd-kit/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListTodo, CheckCircle2 } from 'lucide-react';
import { Project } from '@/types/project-manager';
import { SortableList, SortableTask } from '@/components/project/board/BoardComponents';
import { TaskDisplayCustomizer } from '@/components/task/TaskDisplayCustomizer';
import { TaskDisplay } from '@/components/task/TaskDisplay';

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

    // Use default collision detection
    const customCollisionDetection = closestCenter;

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
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <ListTodo className="h-5 w-5" />
                                    Board
                                </CardTitle>
                                <CardDescription>
                                    Organize and manage your tasks
                                </CardDescription>
                            </div>
                            <TaskDisplayCustomizer pageKey={`project-board-${project.id}`} />
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
        </>
    );
}
