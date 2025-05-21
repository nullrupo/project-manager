import { Head } from '@inertiajs/react';
import { CheckCircle, Search, Plus, Filter, Calendar, Clock, MoreHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';
import taskService from '@/services/taskService';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Task type definition
interface Task {
    id: number;
    title: string;
    description: string;
    project: string;
    projectId: number;
    dueDate: string;
    status: string;
    tags: string[];
}

const breadcrumbs = [
    { title: 'My Tasks', href: '/my-tasks' }
];

export default function MyTasksPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('today');
    const [tasks, setTasks] = useState<{
        today: Task[],
        upcoming: Task[],
        completed: Task[]
    }>({
        today: [],
        upcoming: [],
        completed: []
    });
    const [isLoading, setIsLoading] = useState(true);

    // Fetch tasks from API
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                setIsLoading(true);
                const response = await taskService.getTasks(searchQuery);
                if (response && response.tasks) {
                    setTasks(response.tasks);
                }
            } catch (error) {
                console.error('Error fetching tasks:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTasks();
    }, [searchQuery]);

    // Filter tasks based on search query
    const filterTasks = (taskList: Task[]) => {
        if (!searchQuery) return taskList;

        return taskList.filter(task =>
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    };

    const filteredTasks = {
        today: filterTasks(tasks.today),
        upcoming: filterTasks(tasks.upcoming),
        completed: filterTasks(tasks.completed)
    };

    // Get status badge variant
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'todo':
                return <Badge variant="outline">Todo</Badge>;
            case 'doing':
                return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">In Progress</Badge>;
            case 'review':
                return <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Review</Badge>;
            case 'done':
                return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Done</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Tasks" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header with search and actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">My Tasks</h1>
                        <p className="text-muted-foreground">Manage your personal tasks</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search tasks..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button onClick={() => {
                            // Redirect to the projects page to add a task
                            window.location.href = '/projects';
                        }}>
                            <Plus className="mr-1 h-4 w-4" />
                            Add Task
                        </Button>
                    </div>
                </div>

                {/* Task tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex items-center justify-between">
                        <TabsList>
                            <TabsTrigger value="today">
                                <Calendar className="mr-2 h-4 w-4" />
                                Today ({filteredTasks.today.length})
                            </TabsTrigger>
                            <TabsTrigger value="upcoming">
                                <Clock className="mr-2 h-4 w-4" />
                                Upcoming ({filteredTasks.upcoming.length})
                            </TabsTrigger>
                            <TabsTrigger value="completed">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Completed ({filteredTasks.completed.length})
                            </TabsTrigger>
                        </TabsList>
                        <Button variant="outline">
                            <Filter className="mr-1 h-4 w-4" />
                            Filter
                        </Button>
                    </div>

                    {/* Today's tasks */}
                    <TabsContent value="today" className="mt-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle>Today's Tasks</CardTitle>
                                <CardDescription>Tasks due today</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {isLoading ? (
                                        <div className="flex h-32 items-center justify-center">
                                            <p className="text-muted-foreground">Loading tasks...</p>
                                        </div>
                                    ) : filteredTasks.today.length > 0 ? (
                                        filteredTasks.today.map((task) => (
                                            <div key={task.id} className="flex gap-4 border-b pb-4">
                                                <Checkbox
                                                    className="mt-1"
                                                    onClick={async () => {
                                                        try {
                                                            await taskService.updateTask(task.id, {
                                                                status: 'done'
                                                            });
                                                            // Refresh tasks
                                                            const response = await taskService.getTasks(searchQuery);
                                                            if (response && response.tasks) {
                                                                setTasks(response.tasks);
                                                            }
                                                        } catch (error) {
                                                            console.error('Error updating task:', error);
                                                        }
                                                    }}
                                                />
                                                <div className="flex-grow">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h3 className="font-medium">{task.title}</h3>
                                                            <p className="text-sm text-muted-foreground">{task.description}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {getStatusBadge(task.status)}
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => window.location.href = `/projects/${task.projectId}?task=${task.id}`}>
                                                                        Edit Task
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={async () => {
                                                                        try {
                                                                            const newStatus = task.status === 'todo' ? 'doing' :
                                                                                            task.status === 'doing' ? 'review' :
                                                                                            task.status === 'review' ? 'done' : 'todo';

                                                                            await taskService.updateTask(task.id, {
                                                                                status: newStatus
                                                                            });

                                                                            // Refresh tasks
                                                                            const response = await taskService.getTasks(searchQuery);
                                                                            if (response && response.tasks) {
                                                                                setTasks(response.tasks);
                                                                            }
                                                                        } catch (error) {
                                                                            console.error('Error updating task status:', error);
                                                                        }
                                                                    }}>
                                                                        Change Status
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => window.location.href = `/projects/${task.projectId}?task=${task.id}&tab=tags`}>
                                                                        Add Tag
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="text-destructive"
                                                                        onClick={async () => {
                                                                            if (confirm('Are you sure you want to delete this task?')) {
                                                                                try {
                                                                                    await taskService.deleteTask(task.id);

                                                                                    // Refresh tasks
                                                                                    const response = await taskService.getTasks(searchQuery);
                                                                                    if (response && response.tasks) {
                                                                                        setTasks(response.tasks);
                                                                                    }
                                                                                } catch (error) {
                                                                                    console.error('Error deleting task:', error);
                                                                                }
                                                                            }
                                                                        }}
                                                                    >
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 flex items-center justify-between">
                                                        <span className="text-sm text-muted-foreground">{task.project}</span>
                                                        <div className="flex gap-1">
                                                            {task.tags.map((tag: string, index: number) => (
                                                                <Badge key={index} variant="outline" className="text-xs">
                                                                    {tag}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex h-32 items-center justify-center">
                                            <p className="text-muted-foreground">No tasks due today</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Upcoming tasks */}
                    <TabsContent value="upcoming" className="mt-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle>Upcoming Tasks</CardTitle>
                                <CardDescription>Tasks due in the next 7 days</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {isLoading ? (
                                        <div className="flex h-32 items-center justify-center">
                                            <p className="text-muted-foreground">Loading tasks...</p>
                                        </div>
                                    ) : filteredTasks.upcoming.length > 0 ? (
                                        filteredTasks.upcoming.map((task) => (
                                            <div key={task.id} className="flex gap-4 border-b pb-4">
                                                <Checkbox
                                                    className="mt-1"
                                                    onClick={async () => {
                                                        try {
                                                            await taskService.updateTask(task.id, {
                                                                status: 'done'
                                                            });
                                                            // Refresh tasks
                                                            const response = await taskService.getTasks(searchQuery);
                                                            if (response && response.tasks) {
                                                                setTasks(response.tasks);
                                                            }
                                                        } catch (error) {
                                                            console.error('Error updating task:', error);
                                                        }
                                                    }}
                                                />
                                                <div className="flex-grow">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h3 className="font-medium">{task.title}</h3>
                                                            <p className="text-sm text-muted-foreground">{task.description}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-muted-foreground">{new Date(task.dueDate).toLocaleDateString()}</span>
                                                            {getStatusBadge(task.status)}
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 flex items-center justify-between">
                                                        <span className="text-sm text-muted-foreground">{task.project}</span>
                                                        <div className="flex gap-1">
                                                            {task.tags.map((tag: string, index: number) => (
                                                                <Badge key={index} variant="outline" className="text-xs">
                                                                    {tag}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex h-32 items-center justify-center">
                                            <p className="text-muted-foreground">No upcoming tasks</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Completed tasks */}
                    <TabsContent value="completed" className="mt-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle>Completed Tasks</CardTitle>
                                <CardDescription>Tasks you've completed</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {isLoading ? (
                                        <div className="flex h-32 items-center justify-center">
                                            <p className="text-muted-foreground">Loading tasks...</p>
                                        </div>
                                    ) : filteredTasks.completed.length > 0 ? (
                                        filteredTasks.completed.map((task) => (
                                            <div key={task.id} className="flex gap-4 border-b pb-4 opacity-70">
                                                <Checkbox checked className="mt-1" />
                                                <div className="flex-grow">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h3 className="font-medium line-through">{task.title}</h3>
                                                            <p className="text-sm text-muted-foreground">{task.description}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-muted-foreground">{new Date(task.dueDate).toLocaleDateString()}</span>
                                                            {getStatusBadge(task.status)}
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 flex items-center justify-between">
                                                        <span className="text-sm text-muted-foreground">{task.project}</span>
                                                        <div className="flex gap-1">
                                                            {task.tags.map((tag: string, index: number) => (
                                                                <Badge key={index} variant="outline" className="text-xs">
                                                                    {tag}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex h-32 items-center justify-center">
                                            <p className="text-muted-foreground">No completed tasks</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
