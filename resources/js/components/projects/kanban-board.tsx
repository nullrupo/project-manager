import { useState } from 'react';
import { Calendar, Clock, MoreHorizontal, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Task {
    id: number;
    title: string;
    description: string;
    assignee: {
        name: string;
        initials: string;
        avatar?: string | null;
    };
    dueDate: string;
    tags: string[];
}

interface KanbanBoardProps {
    tasks: {
        todo: Task[];
        doing: Task[];
        review: Task[];
        done: Task[];
    };
}

export default function KanbanBoard({ tasks }: KanbanBoardProps) {
    // Function to get column color based on number of tasks
    const getColumnHeaderColor = (count: number) => {
        if (count < 5) return 'bg-gray-100 dark:bg-gray-800';
        if (count < 10) return 'bg-amber-100 dark:bg-amber-900/30';
        return 'bg-red-100 dark:bg-red-900/30';
    };

    // Function to render a task card
    const renderTaskCard = (task: Task) => (
        <Card key={task.id} className="mb-3">
            <CardHeader className="p-3 pb-0">
                <div className="flex justify-between">
                    <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Move</DropdownMenuItem>
                            <DropdownMenuItem>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <CardDescription className="line-clamp-2 text-xs">
                    {task.description}
                </CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0">
                <div className="mt-2 flex flex-wrap gap-1">
                    {task.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                        </Badge>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between p-3 pt-0">
                <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                        {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                </div>
                <Avatar className="h-6 w-6">
                    {task.assignee.avatar && <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} />}
                    <AvatarFallback className="text-xs">{task.assignee.initials}</AvatarFallback>
                </Avatar>
            </CardFooter>
        </Card>
    );

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Todo Column */}
            <div className="flex flex-col">
                <div className={`mb-3 flex items-center justify-between rounded-md p-2 ${getColumnHeaderColor(tasks.todo.length)}`}>
                    <h3 className="font-medium">Todo ({tasks.todo.length})</h3>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex-1 space-y-2">
                    {tasks.todo.map(renderTaskCard)}
                </div>
            </div>

            {/* Doing Column */}
            <div className="flex flex-col">
                <div className={`mb-3 flex items-center justify-between rounded-md p-2 ${getColumnHeaderColor(tasks.doing.length)}`}>
                    <h3 className="font-medium">In Progress ({tasks.doing.length})</h3>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex-1 space-y-2">
                    {tasks.doing.map(renderTaskCard)}
                </div>
            </div>

            {/* Review Column */}
            <div className="flex flex-col">
                <div className={`mb-3 flex items-center justify-between rounded-md p-2 ${getColumnHeaderColor(tasks.review.length)}`}>
                    <h3 className="font-medium">Review ({tasks.review.length})</h3>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex-1 space-y-2">
                    {tasks.review.map(renderTaskCard)}
                </div>
            </div>

            {/* Done Column */}
            <div className="flex flex-col">
                <div className={`mb-3 flex items-center justify-between rounded-md p-2 ${getColumnHeaderColor(tasks.done.length)}`}>
                    <h3 className="font-medium">Done ({tasks.done.length})</h3>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex-1 space-y-2">
                    {tasks.done.map(renderTaskCard)}
                </div>
            </div>
        </div>
    );
}
