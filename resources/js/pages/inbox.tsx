import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Calendar, CalendarDays, Clock, Edit, Inbox, Plus, Trash2, User as UserIcon } from 'lucide-react';
import { useState } from 'react';

interface Task {
    id: number;
    title: string;
    description: string | null;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'to_do' | 'in_progress' | 'done';
    due_date: string | null;
    assignees?: { id: number; name: string }[];
    is_inbox: boolean;
}

interface User {
    id: number;
    name: string;
}

interface InboxPageProps {
    tasks: Task[];
    users: User[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inbox',
        href: route('inbox'),
    },
];

export default function InboxPage({ tasks = [], users = [] }: InboxPageProps) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<number | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [status, setStatus] = useState('to_do');
    const [dueDate, setDueDate] = useState<string | null>(null);

    // Reset form when dialog closes
    const resetForm = () => {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setStatus('to_do');
        setDueDate(null);
        setEditingTask(null);
    };

    // Set form values when editing a task
    const editTask = (task: Task) => {
        setEditingTask(task);
        setTitle(task.title);
        setDescription(task.description || '');
        setPriority(task.priority);
        setStatus(task.status);
        setDueDate(task.due_date);
    };

    // Handle form submission
    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const data = {
            title,
            description,
            priority,
            status,
            due_date: dueDate,
        };

        if (editingTask) {
            // Update existing task
            router.put(route('inbox.tasks.update', { task: editingTask.id }), data, {
                onSuccess: () => {
                    setEditingTask(null);
                    resetForm();
                },
            });
        } else {
            // Create new task
            router.post(route('inbox.tasks.store'), data, {
                onSuccess: () => {
                    setIsCreateDialogOpen(false);
                    resetForm();
                },
            });
        }
    };

    // Open delete confirmation dialog
    const openDeleteDialog = (taskId: number) => {
        setTaskToDelete(taskId);
        setIsDeleteDialogOpen(true);
    };

    // Delete a task
    const deleteTask = () => {
        if (taskToDelete) {
            router.delete(route('inbox.tasks.destroy', { task: taskToDelete }));
            setTaskToDelete(null);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inbox" />
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-semibold flex items-center gap-2">
                            <Inbox className="h-6 w-6 text-primary" />
                            <span>Inbox</span>
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage tasks that are not associated with any specific project
                        </p>
                    </div>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="shadow-sm hover:shadow-md">
                                <Plus className="h-4 w-4 mr-2" />
                                New Task
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Create New Inbox Task</DialogTitle>
                                <DialogDescription>
                                    Add a new task to your inbox. These tasks are not associated with any project.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={onSubmit} className="space-y-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label htmlFor="title" className="text-sm font-medium">Title</label>
                                        <Input
                                            id="title"
                                            placeholder="Task title"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="description" className="text-sm font-medium">Description</label>
                                        <Textarea
                                            id="description"
                                            placeholder="Task description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label htmlFor="priority" className="text-sm font-medium">Priority</label>
                                            <select
                                                id="priority"
                                                className="w-full rounded-md border border-input bg-background px-3 py-2"
                                                value={priority}
                                                onChange={(e) => setPriority(e.target.value)}
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="urgent">Urgent</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="status" className="text-sm font-medium">Status</label>
                                            <select
                                                id="status"
                                                className="w-full rounded-md border border-input bg-background px-3 py-2"
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value)}
                                            >
                                                <option value="to_do">To Do</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="done">Done</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="due_date" className="text-sm font-medium">Due Date</label>
                                        <Input
                                            id="due_date"
                                            type="date"
                                            className="w-full"
                                            value={dueDate || ''}
                                            onChange={(e) => setDueDate(e.target.value || null)}
                                        />
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button type="submit">
                                        {editingTask ? 'Update Task' : 'Create Task'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Inbox Tasks</CardTitle>
                        <CardDescription>
                            Tasks that are not associated with any specific project
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {tasks.length > 0 ? (
                            <div className="space-y-4">
                                {tasks.map((task) => (
                                    <div key={task.id} className="flex items-start justify-between p-4 bg-card/80 backdrop-blur-sm rounded-lg border border-border/50">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium">{task.title}</h3>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    task.priority === 'low' ? 'bg-green-100 text-green-800' :
                                                    task.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                                                    task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                                </span>
                                            </div>
                                            {task.description && (
                                                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                                            )}
                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{task.status === 'to_do' ? 'To Do' : task.status === 'in_progress' ? 'In Progress' : 'Done'}</span>
                                                </div>
                                                {task.due_date && (
                                                    <div className="flex items-center gap-1">
                                                        <CalendarDays className="h-3 w-3" />
                                                        <span>{new Date(task.due_date).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                                {task.assignees && task.assignees.length > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <UserIcon className="h-3 w-3" />
                                                        <span>{task.assignees.map(a => a.name).join(', ')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => editTask(task)}
                                            >
                                                <Edit className="h-4 w-4" />
                                                <span className="sr-only">Edit</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                                onClick={() => openDeleteDialog(task.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Delete</span>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground mb-4">No inbox tasks found</p>
                                <Button
                                    size="sm"
                                    className="shadow-sm hover:shadow-md"
                                    onClick={() => setIsCreateDialogOpen(true)}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Task
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Edit Task Dialog */}
            {editingTask && (
                <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Edit Task</DialogTitle>
                            <DialogDescription>
                                Update the details of your inbox task.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={onSubmit} className="space-y-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="edit-title" className="text-sm font-medium">Title</label>
                                    <Input
                                        id="edit-title"
                                        placeholder="Task title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="edit-description" className="text-sm font-medium">Description</label>
                                    <Textarea
                                        id="edit-description"
                                        placeholder="Task description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="edit-priority" className="text-sm font-medium">Priority</label>
                                        <select
                                            id="edit-priority"
                                            className="w-full rounded-md border border-input bg-background px-3 py-2"
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value)}
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="edit-status" className="text-sm font-medium">Status</label>
                                        <select
                                            id="edit-status"
                                            className="w-full rounded-md border border-input bg-background px-3 py-2"
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                        >
                                            <option value="to_do">To Do</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="done">Done</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="edit-due-date" className="text-sm font-medium">Due Date</label>
                                    <Input
                                        id="edit-due-date"
                                        type="date"
                                        className="w-full"
                                        value={dueDate || ''}
                                        onChange={(e) => setDueDate(e.target.value || null)}
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditingTask(null)}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    Update Task
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Delete Task"
                description="Are you sure you want to delete this task? This action cannot be undone."
                onConfirm={deleteTask}
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
            />
        </AppLayout>
    );
}
