import { useState } from 'react';
import { MoreHorizontal, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

interface ProjectTableProps {
    tasks: {
        todo: Task[];
        doing: Task[];
        review: Task[];
        done: Task[];
    };
}

export default function ProjectTable({ tasks }: ProjectTableProps) {
    const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
    
    // Flatten all tasks into a single array
    const allTasks = [
        ...tasks.todo.map(task => ({ ...task, status: 'Todo' })),
        ...tasks.doing.map(task => ({ ...task, status: 'In Progress' })),
        ...tasks.review.map(task => ({ ...task, status: 'Review' })),
        ...tasks.done.map(task => ({ ...task, status: 'Done' }))
    ];
    
    // Toggle task selection
    const toggleTaskSelection = (taskId: number) => {
        if (selectedTasks.includes(taskId)) {
            setSelectedTasks(selectedTasks.filter(id => id !== taskId));
        } else {
            setSelectedTasks([...selectedTasks, taskId]);
        }
    };
    
    // Toggle all tasks selection
    const toggleAllTasks = () => {
        if (selectedTasks.length === allTasks.length) {
            setSelectedTasks([]);
        } else {
            setSelectedTasks(allTasks.map(task => task.id));
        }
    };
    
    // Get status badge variant
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Todo':
                return <Badge variant="outline">Todo</Badge>;
            case 'In Progress':
                return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">In Progress</Badge>;
            case 'Review':
                return <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Review</Badge>;
            case 'Done':
                return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Done</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-12">
                            <Checkbox 
                                checked={selectedTasks.length === allTasks.length && allTasks.length > 0} 
                                onCheckedChange={toggleAllTasks}
                            />
                        </TableHead>
                        <TableHead>Task</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Assignee</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead className="w-12"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {allTasks.map((task) => (
                        <TableRow key={task.id}>
                            <TableCell>
                                <Checkbox 
                                    checked={selectedTasks.includes(task.id)} 
                                    onCheckedChange={() => toggleTaskSelection(task.id)}
                                />
                            </TableCell>
                            <TableCell>
                                <div>
                                    <div className="font-medium">{task.title}</div>
                                    <div className="text-sm text-muted-foreground">{task.description}</div>
                                </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(task.status as string)}</TableCell>
                            <TableCell>{new Date(task.dueDate).toLocaleDateString()}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                        {task.assignee.avatar && <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} />}
                                        <AvatarFallback className="text-xs">{task.assignee.initials}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{task.assignee.name}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {task.tags.map((tag, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>Edit</DropdownMenuItem>
                                        <DropdownMenuItem>Change Status</DropdownMenuItem>
                                        <DropdownMenuItem>Reassign</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
