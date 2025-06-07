import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { router } from '@inertiajs/react';
import { Plus, Lock, Edit, Eye, CheckCircle2 } from 'lucide-react';
import { Project } from '@/types/project-manager';

interface SortableListProps {
    list: any;
    children: React.ReactNode;
    project: Project;
}

interface SortableTaskProps {
    task: any;
    project: Project;
    onViewTask: (task: any) => void;
    onEditTask: (task: any) => void;
    onTaskClick?: (task: any) => void;
}

// Sortable List Component
export const SortableList = ({ list, children, project }: SortableListProps) => {
    return (
        <div className="w-80 flex-shrink-0">
            <Card className="h-full bg-muted/20 border-2 border-dashed border-muted-foreground/20 transition-all duration-200 hover:border-muted-foreground/40">
                <CardHeader className="pb-3">
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
                        <Badge variant="secondary" className="text-xs">
                            {list.tasks?.length || 0}
                        </Badge>
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
export const SortableTask = ({ task, project, onViewTask, onEditTask, onTaskClick }: SortableTaskProps) => {
    return (
        <div
            className="mb-3 rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer relative"
            data-task-clickable
            onClick={() => onTaskClick?.(task)}
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
                        onViewTask(task);
                    }}
                >
                    <Eye className="h-3 w-3" />
                </Button>

                {/* Edit button - only if can edit */}
                {project.can_manage_tasks && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 bg-background/80 hover:bg-background"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEditTask(task);
                        }}
                    >
                        <Edit className="h-3 w-3" />
                    </Button>
                )}
            </div>

            <div className="space-y-2 pr-12">
                <div className="flex items-center justify-between">
                    <div className="font-medium text-sm line-clamp-2 flex-1">{task.title}</div>
                    {task.status === 'done' && (
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 ml-2" />
                    )}
                </div>

                {task.description && (
                    <div className="text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                            {task.priority}
                        </Badge>
                        {task.due_date && (
                            <Badge variant="outline" className="text-xs">
                                {new Date(task.due_date).toLocaleDateString()}
                            </Badge>
                        )}
                    </div>

                    {task.assignees && task.assignees.length > 0 && (
                        <div className="flex -space-x-1">
                            {task.assignees.slice(0, 2).map((assignee: any) => (
                                <Avatar key={assignee.id} className="h-5 w-5 border border-background">
                                    <AvatarImage src={assignee.avatar} />
                                    <AvatarFallback className="text-xs">
                                        {assignee.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                            {task.assignees.length > 2 && (
                                <div className="h-5 w-5 rounded-full bg-muted border border-background flex items-center justify-center">
                                    <span className="text-xs">+{task.assignees.length - 2}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
