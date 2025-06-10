import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Project, Task } from '@/types/project-manager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, RotateCcw, Calendar, User, Tag, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProjectArchiveProps {
    project: Project;
    archivedTasks: {
        data: Task[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function ProjectArchive({ project, archivedTasks }: ProjectArchiveProps) {
    const [restoringTasks, setRestoringTasks] = useState<Set<number>>(new Set());

    const handleRestoreTask = async (task: Task) => {
        if (restoringTasks.has(task.id)) return;

        setRestoringTasks(prev => new Set(prev).add(task.id));

        try {
            const response = await fetch(route('tasks.unarchive', { 
                project: project.id, 
                task: task.id 
            }), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                // Reload the page to reflect changes
                router.reload();
            } else {
                console.error('Failed to restore task:', task.id);
            }
        } catch (error) {
            console.error('Failed to restore task:', task.id, error);
        } finally {
            setRestoringTasks(prev => {
                const newSet = new Set(prev);
                newSet.delete(task.id);
                return newSet;
            });
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    return (
        <>
            <Head title={`${project.name} - Archive`} />
            
            <div className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.visit(route('projects.show', project.id))}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Project
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{project.name} - Archive</h1>
                            <p className="text-muted-foreground">
                                {archivedTasks.total} completed tasks archived
                            </p>
                        </div>
                    </div>
                </div>

                {/* Archive Content */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Archived Tasks
                        </CardTitle>
                        <CardDescription>
                            Tasks that have been completed and archived. You can restore them back to the active project.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {archivedTasks.data.length === 0 ? (
                            <div className="text-center py-12">
                                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-muted-foreground mb-2">No archived tasks</h3>
                                <p className="text-sm text-muted-foreground">
                                    Completed tasks will appear here when you clean up the project.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {archivedTasks.data.map((task) => (
                                    <div
                                        key={task.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-medium truncate">{task.title}</h3>
                                                <Badge className={getPriorityColor(task.priority)}>
                                                    {task.priority}
                                                </Badge>
                                                {task.section && (
                                                    <Badge variant="outline">
                                                        {task.section.name}
                                                    </Badge>
                                                )}
                                            </div>
                                            
                                            {task.description && (
                                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                                    {task.description}
                                                </p>
                                            )}
                                            
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                {task.creator && (
                                                    <div className="flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        {task.creator.name}
                                                    </div>
                                                )}
                                                {task.completed_at && (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        Completed {formatDistanceToNow(new Date(task.completed_at), { addSuffix: true })}
                                                    </div>
                                                )}
                                                {task.assignees && task.assignees.length > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <Tag className="h-3 w-3" />
                                                        Assigned to {task.assignees.map(a => a.name).join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {project.can_manage_tasks && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleRestoreTask(task)}
                                                            disabled={restoringTasks.has(task.id)}
                                                            className="flex items-center gap-2 ml-4"
                                                        >
                                                            <RotateCcw className={`h-4 w-4 ${restoringTasks.has(task.id) ? 'animate-spin' : ''}`} />
                                                            {restoringTasks.has(task.id) ? 'Restoring...' : 'Restore'}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Restore this task back to the active project</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* Pagination */}
                        {archivedTasks.last_page > 1 && (
                            <div className="flex items-center justify-between mt-6 pt-4 border-t">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((archivedTasks.current_page - 1) * archivedTasks.per_page) + 1} to{' '}
                                    {Math.min(archivedTasks.current_page * archivedTasks.per_page, archivedTasks.total)} of{' '}
                                    {archivedTasks.total} tasks
                                </div>
                                <div className="flex items-center gap-2">
                                    {archivedTasks.current_page > 1 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.visit(route('projects.archive', { 
                                                project: project.id, 
                                                page: archivedTasks.current_page - 1 
                                            }))}
                                        >
                                            Previous
                                        </Button>
                                    )}
                                    {archivedTasks.current_page < archivedTasks.last_page && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.visit(route('projects.archive', { 
                                                project: project.id, 
                                                page: archivedTasks.current_page + 1 
                                            }))}
                                        >
                                            Next
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
