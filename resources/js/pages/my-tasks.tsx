import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Task } from '@/types/project-manager';
import { Head, Link } from '@inertiajs/react';
import { CalendarDays, CheckCircle, Clock, ListFilter, Plus } from 'lucide-react';
import { useState } from 'react';

interface MyTasksProps {
    tasks: Task[];
}

export default function MyTasks({ tasks = [] }: MyTasksProps) {
    const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
    
    // Filter tasks based on the selected filter
    const filteredTasks = tasks.filter(task => {
        if (filter === 'all') return true;
        if (filter === 'completed') return task.completed_at !== null;
        
        const dueDate = task.due_date ? new Date(task.due_date) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (filter === 'today') {
            return dueDate && dueDate >= today && dueDate < tomorrow;
        }
        
        if (filter === 'upcoming') {
            return dueDate && dueDate >= tomorrow;
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
                        <Button variant="outline" size="sm">
                            <ListFilter className="h-4 w-4 mr-2" />
                            Filter
                        </Button>
                    </div>
                </div>

                <div className="flex gap-4 mb-6">
                    <Button 
                        variant={filter === 'all' ? 'default' : 'outline'} 
                        onClick={() => setFilter('all')}
                    >
                        All Tasks
                    </Button>
                    <Button 
                        variant={filter === 'today' ? 'default' : 'outline'} 
                        onClick={() => setFilter('today')}
                    >
                        <Clock className="h-4 w-4 mr-2" />
                        Due Today
                    </Button>
                    <Button 
                        variant={filter === 'upcoming' ? 'default' : 'outline'} 
                        onClick={() => setFilter('upcoming')}
                    >
                        <CalendarDays className="h-4 w-4 mr-2" />
                        Upcoming
                    </Button>
                    <Button 
                        variant={filter === 'completed' ? 'default' : 'outline'} 
                        onClick={() => setFilter('completed')}
                    >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Completed
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTasks.length > 0 ? (
                        filteredTasks.map(task => (
                            <Card key={task.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between">
                                        <div>
                                            <CardTitle>{task.title}</CardTitle>
                                            <CardDescription>
                                                {task.project?.name} / {task.list?.name}
                                            </CardDescription>
                                        </div>
                                        <div className={`inline-block w-2 h-2 rounded-full ${
                                            task.priority === 'low' ? 'bg-green-500' :
                                            task.priority === 'medium' ? 'bg-yellow-500' :
                                            task.priority === 'high' ? 'bg-orange-500' :
                                            'bg-red-500'
                                        }`}></div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {task.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {task.description}
                                        </p>
                                    )}
                                    {task.due_date && (
                                        <div className="mt-2 text-xs text-muted-foreground flex items-center">
                                            <Clock className="h-3 w-3 mr-1" />
                                            Due: {new Date(task.due_date).toLocaleDateString()}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    <Link href={route('tasks.show', [task.project_id, task.id])} className="w-full">
                                        <Button variant="outline" size="sm" className="w-full">
                                            View Task
                                        </Button>
                                    </Link>
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
