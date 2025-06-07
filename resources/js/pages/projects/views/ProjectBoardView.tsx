import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListTodo } from 'lucide-react';
import { Project } from '@/types/project-manager';
import { SortableList, SortableTask } from '@/components/project/board/BoardComponents';

interface ProjectBoardViewProps {
    project: Project;
    state: any;
    sensors: any;
    onDragStart: (event: any) => void;
    onDragEnd: (event: any) => void;
    onViewTask: (task: any) => void;
    onEditTask: (task: any) => void;
}

export default function ProjectBoardView({
    project,
    state,
    sensors,
    onDragStart,
    onDragEnd,
    onViewTask,
    onEditTask
}: ProjectBoardViewProps) {
    
    return (
        <Card className="rounded-t-none border-t-0 mt-0">
            <CardHeader className="pb-4">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <ListTodo className="h-5 w-5" />
                        Board
                    </CardTitle>
                    <CardDescription>
                        Organize and manage your tasks
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                {project.boards && project.boards.length > 0 ? (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        modifiers={[restrictToWindowEdges]}
                    >
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
                                        onViewTask={onViewTask}
                                        onEditTask={onEditTask}
                                    />
                                ))}
                            </SortableContext>
                        </div>

                        <DragOverlay>
                            {state.activeItem?.type === 'task' && state.activeItem.task && (
                                <SortableTask
                                    task={state.activeItem.task}
                                    project={project}
                                    onViewTask={onViewTask}
                                    onEditTask={onEditTask}
                                    isDragOverlay={true}
                                />
                            )}
                        </DragOverlay>
                    </DndContext>
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
    );
}
