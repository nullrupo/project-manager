import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Task } from '@/types/project-manager';
import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, CheckCircle, Clock, ListFilter, Plus, Archive, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useGlobalTaskInspector } from '@/contexts/GlobalTaskInspectorContext';
import { TaskDisplay } from '@/components/task/TaskDisplay';
import { TaskDisplayCustomizer } from '@/components/task/TaskDisplayCustomizer';

interface MyTasksProps {
    tasks: Task[];
    filter?: string;
}

export default function MyTasks({ tasks = [], filter: initialFilter }: MyTasksProps) {
    const { openInspector } = useGlobalTaskInspector();
    const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed' | 'overdue' | 'archived'>(() => {
        // Initialize filter from URL parameter or default to 'all'
        if (initialFilter && ['all', 'today', 'upcoming', 'completed', 'overdue', 'archived'].includes(initialFilter)) {
            return initialFilter as 'all' | 'today' | 'upcoming' | 'completed' | 'overdue' | 'archived';
        }
        return 'all';
    });

    // Update URL when filter changes
    const handleFilterChange = (newFilter: typeof filter) => {
        setFilter(newFilter);
        router.get(route('my-tasks'), { filter: newFilter }, {
            preserveState: true,
            replace: true
        });
    };

    // Filter tasks based on the selected filter
    const filteredTasks = tasks.filter(task => {
        if (filter === 'all') return !task.is_archived;
        if (filter === 'completed') return task.completed_at !== null && !task.is_archived;
        if (filter === 'archived') return task.is_archived;

        const dueDate = task.due_date ? new Date(task.due_date) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (filter === 'today') {
            return dueDate && dueDate >= today && dueDate < tomorrow && !task.is_archived && task.status !== 'done';
        }

        if (filter === 'upcoming') {
            return dueDate && dueDate >= tomorrow && !task.is_archived && task.status !== 'done';
        }

        if (filter === 'overdue') {
            return dueDate && dueDate < today && !task.is_archived && task.status !== 'done';
        }

        return true;
    });

    return (
        <AppLayout>
            <Head title="My Tasks" />
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-semibold">My Tasks</h1>
                    <div className="flex gap-2">
                        <TaskDisplayCustomizer pageKey="my-tasks" />
                        <Button variant="outline" size="sm">
                            <ListFilter className="h-4 w-4 mr-2" />
                            Filter
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                    <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        onClick={() => handleFilterChange('all')}
                        size="sm"
                    >
                        All Tasks
                    </Button>
                    <Button
                        variant={filter === 'today' ? 'default' : 'outline'}
                        onClick={() => handleFilterChange('today')}
                        size="sm"
                    >
                        <Clock className="h-4 w-4 mr-2" />
                        Due Today
                    </Button>
                    <Button
                        variant={filter === 'upcoming' ? 'default' : 'outline'}
                        onClick={() => handleFilterChange('upcoming')}
                        size="sm"
                    >
                        <CalendarDays className="h-4 w-4 mr-2" />
                        Upcoming
                    </Button>
                    <Button
                        variant={filter === 'overdue' ? 'default' : 'outline'}
                        onClick={() => handleFilterChange('overdue')}
                        size="sm"
                    >
                        <Clock className="h-4 w-4 mr-2 text-red-500" />
                        Overdue
                    </Button>
                    <Button
                        variant={filter === 'completed' ? 'default' : 'outline'}
                        onClick={() => handleFilterChange('completed')}
                        size="sm"
                    >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Completed
                    </Button>
                    <Button
                        variant={filter === 'archived' ? 'default' : 'outline'}
                        onClick={() => handleFilterChange('archived')}
                        size="sm"
                    >
                        <Archive className="h-4 w-4 mr-2" />
                        Archived
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTasks.length > 0 ? (
                        filteredTasks.map(task => (
                            <Card
                                key={task.id}
                                className="cursor-pointer hover:shadow-md transition-shadow"
                                data-task-clickable
                                onClick={() => openInspector(task)}
                            >
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">
                                        {task.is_inbox ? 'Inbox' : `${task.project?.name} / ${task.list?.name}`}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <TaskDisplay task={task} pageKey="my-tasks" />
                                </CardContent>
                                <CardFooter>
                                    {task.is_inbox ? (
                                        <Link href={route('inbox')} className="w-full">
                                            <Button variant="outline" size="sm" className="w-full">
                                                View in Inbox
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Link href={route('tasks.show', [task.project_id, task.id])} className="w-full">
                                            <Button variant="outline" size="sm" className="w-full">
                                                View Task
                                            </Button>
                                        </Link>
                                    )}
                                </CardFooter>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center p-12 text-center">
                            <div className="rounded-full bg-muted p-3 mb-4">
                                <CheckCircle className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium">No tasks found</h3>
                            <p className="text-muted-foreground mt-1">
                                {filter === 'all'
                                    ? "You don't have any tasks assigned to you."
                                    : `You don't have any ${filter} tasks.`}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
