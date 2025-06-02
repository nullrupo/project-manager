import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Calendar, CalendarDays, Clock, Edit, Inbox, Plus, Trash2, User as UserIcon, FolderOpen, Tag, CheckSquare, Square, MoreHorizontal, ArrowRight, Flag } from 'lucide-react';
import { useState, useMemo } from 'react';

interface Task {
    id: number;
    title: string;
    description: string | null;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'to_do' | 'in_progress' | 'done';
    due_date: string | null;
    project?: {
        id: number;
        name: string;
        key: string;
    };
    assignees?: { id: number; name: string }[];
    is_inbox: boolean;
    created_at?: string;
    updated_at?: string;
}

interface User {
    id: number;
    name: string;
}

interface Project {
    id: number;
    name: string;
    key: string;
}

interface InboxPageProps {
    tasks: Task[];
    users: User[];
    projects: Project[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inbox',
        href: route('inbox'),
    },
];

export default function InboxPage({ tasks = [], users = [], projects = [] }: InboxPageProps) {
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
    const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
    const [taskToMove, setTaskToMove] = useState<Task | null>(null);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');

    // Form state for editing
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [status, setStatus] = useState('to_do');
    const [dueDate, setDueDate] = useState<string | null>(null);

    // Quick add state
    const [quickAddTitle, setQuickAddTitle] = useState('');
    const [isQuickAdding, setIsQuickAdding] = useState(false);

    // Sort state (keeping basic sorting)
    const [sortBy, setSortBy] = useState<string>('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Bulk operations state
    const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
    const [showBulkActions, setShowBulkActions] = useState(false);

    // Sorted tasks (no filtering needed for inbox)
    const sortedTasks = useMemo(() => {
        const sorted = [...tasks];

        // Sort tasks
        sorted.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (sortBy) {
                case 'title':
                    aValue = a.title.toLowerCase();
                    bValue = b.title.toLowerCase();
                    break;
                case 'priority':
                    const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 };
                    aValue = priorityOrder[a.priority];
                    bValue = priorityOrder[b.priority];
                    break;
                case 'due_date':
                    aValue = a.due_date ? new Date(a.due_date).getTime() : 0;
                    bValue = b.due_date ? new Date(b.due_date).getTime() : 0;
                    break;
                case 'status':
                    const statusOrder = { to_do: 1, in_progress: 2, done: 3 };
                    aValue = statusOrder[a.status];
                    bValue = statusOrder[b.status];
                    break;
                default: // created_at
                    aValue = new Date(a.created_at || 0).getTime();
                    bValue = new Date(b.created_at || 0).getTime();
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [tasks, sortBy, sortOrder]);

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

    // Handle edit form submission
    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingTask) {
            const data = {
                title,
                description,
                priority,
                status,
                due_date: dueDate,
            };

            // Update existing task
            router.put(route('inbox.tasks.update', { task: editingTask.id }), data, {
                onSuccess: () => {
                    setEditingTask(null);
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

    // Quick add task
    const handleQuickAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickAddTitle.trim()) return;

        setIsQuickAdding(true);
        router.post(route('inbox.tasks.store'), {
            title: quickAddTitle.trim(),
            description: '',
            priority: 'medium',
            status: 'to_do',
            due_date: null,
        }, {
            onSuccess: () => {
                setQuickAddTitle('');
                setIsQuickAdding(false);
            },
            onError: () => {
                setIsQuickAdding(false);
            }
        });
    };

    // Bulk operations
    const toggleTaskSelection = (taskId: number) => {
        const newSelected = new Set(selectedTasks);
        if (newSelected.has(taskId)) {
            newSelected.delete(taskId);
        } else {
            newSelected.add(taskId);
        }
        setSelectedTasks(newSelected);
        setShowBulkActions(newSelected.size > 0);
    };

    const selectAllTasks = (checked: boolean) => {
        if (checked) {
            setSelectedTasks(new Set(sortedTasks.map(task => task.id)));
            setShowBulkActions(true);
        } else {
            setSelectedTasks(new Set());
            setShowBulkActions(false);
        }
    };

    const bulkUpdateStatus = (newStatus: string) => {
        const taskIds = Array.from(selectedTasks);
        // For now, we'll update each task individually
        // In a real app, you'd want a bulk update endpoint
        taskIds.forEach(taskId => {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                router.put(route('inbox.tasks.update', { task: taskId }), {
                    ...task,
                    status: newStatus,
                }, { preserveState: true });
            }
        });
        setSelectedTasks(new Set());
        setShowBulkActions(false);
    };

    const bulkDelete = () => {
        const taskIds = Array.from(selectedTasks);
        taskIds.forEach(taskId => {
            router.delete(route('inbox.tasks.destroy', { task: taskId }), { preserveState: true });
        });
        setSelectedTasks(new Set());
        setShowBulkActions(false);
    };

    // Quick status update
    const quickUpdateStatus = (taskId: number, newStatus: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            router.put(route('inbox.tasks.update', { task: taskId }), {
                ...task,
                status: newStatus,
            }, { preserveState: true });
        }
    };

    // Open move to project dialog
    const openMoveDialog = (task: Task) => {
        setTaskToMove(task);
        setSelectedProjectId('');
        setIsMoveDialogOpen(true);
    };

    // Move task to project
    const moveTaskToProject = () => {
        if (selectedProjectId) {
            // If we have selected tasks (bulk operation), move all of them
            if (selectedTasks.size > 0) {
                const taskIds = Array.from(selectedTasks);
                taskIds.forEach(taskId => {
                    router.post(route('inbox.tasks.move-to-project', { task: taskId }), {
                        project_id: parseInt(selectedProjectId),
                    }, { preserveState: true });
                });
                setSelectedTasks(new Set());
                setShowBulkActions(false);
            } else if (taskToMove) {
                // Single task operation
                router.post(route('inbox.tasks.move-to-project', { task: taskToMove.id }), {
                    project_id: parseInt(selectedProjectId),
                });
            }

            setIsMoveDialogOpen(false);
            setTaskToMove(null);
            setSelectedProjectId('');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inbox" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Inbox className="h-8 w-8 text-primary" />
                        <h1 className="text-2xl font-semibold">Inbox</h1>
                        <span className="text-sm text-muted-foreground ml-2">
                            {sortedTasks.length} tasks
                        </span>
                        {sortedTasks.length > 0 && (
                            <div className="flex items-center gap-2 ml-4">
                                <Checkbox
                                    checked={selectedTasks.size === sortedTasks.length && sortedTasks.length > 0}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setSelectedTasks(new Set(sortedTasks.map(t => t.id)));
                                        } else {
                                            setSelectedTasks(new Set());
                                        }
                                    }}
                                />
                                <span className="text-sm text-muted-foreground">
                                    Select all
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Add Task</CardTitle>

                        {/* Quick Add Form */}
                        <div className="pt-4 border-t">
                            <form onSubmit={handleQuickAdd} className="flex gap-2">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Quick add a task..."
                                        value={quickAddTitle}
                                        onChange={(e) => setQuickAddTitle(e.target.value)}
                                        disabled={isQuickAdding}
                                    />
                                </div>
                                <Button type="submit" disabled={!quickAddTitle.trim() || isQuickAdding}>
                                    {isQuickAdding ? (
                                        <>
                                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Task
                                        </>
                                    )}
                                </Button>
                            </form>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {sortedTasks.length > 0 ? (
                            <div className="space-y-3">
                                {sortedTasks.map((task) => {
                                    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                                    return (
                                        <div
                                            key={task.id}
                                            className={`group flex items-start gap-3 p-4 rounded-lg border transition-colors hover:bg-muted/30 ${
                                                isOverdue ? 'border-red-200 bg-red-50/50' : 'border-border/50'
                                            } ${selectedTasks.has(task.id) ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}
                                        >
                                            <Checkbox
                                                checked={selectedTasks.has(task.id)}
                                                onCheckedChange={() => toggleTaskSelection(task.id)}
                                                className="mt-1"
                                            />

                                            <div
                                                className="flex-1 min-w-0 cursor-pointer"
                                                onClick={() => editTask(task)}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className={`font-medium truncate ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                                                        {task.title}
                                                    </h3>
                                                    {task.status === 'done' && (
                                                        <Badge variant="default" className="text-xs">
                                                            Done
                                                        </Badge>
                                                    )}
                                                    {isOverdue && (
                                                        <Badge variant="destructive" className="text-xs">
                                                            Overdue
                                                        </Badge>
                                                    )}
                                                </div>

                                                {task.description && (
                                                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
                                                )}

                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    {task.due_date && (
                                                        <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : ''}`}>
                                                            <CalendarDays className="h-3 w-3" />
                                                            <span>{new Date(task.due_date).toLocaleDateString()}</span>
                                                        </div>
                                                    )}
                                                    {task.priority && (
                                                        <div className="flex items-center gap-1">
                                                            <Flag className="h-3 w-3" />
                                                            <span className="capitalize">{task.priority}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {task.status !== 'done' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            quickUpdateStatus(task.id, 'done');
                                                        }}
                                                        title="Mark as Done"
                                                    >
                                                        <CheckSquare className="h-4 w-4" />
                                                    </Button>
                                                )}

                                                {projects.length > 0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openMoveDialog(task);
                                                        }}
                                                        title="Move to Project"
                                                    >
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                )}

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openDeleteDialog(task.id);
                                                    }}
                                                    title="Delete Task"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">
                                    No inbox tasks found. Use the quick add form above to create your first task.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Floating Bulk Actions Panel */}
            {selectedTasks.size > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                    <div className="bg-background border border-border rounded-lg shadow-lg p-4 flex items-center gap-3">
                        <span className="text-sm font-medium">
                            {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    selectedTasks.forEach(taskId => quickUpdateStatus(taskId, 'done'));
                                    setSelectedTasks(new Set());
                                }}
                            >
                                <CheckSquare className="h-4 w-4 mr-1" />
                                Mark Done
                            </Button>
                            {projects.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        // For bulk move, we'll use the first selected task as reference
                                        const firstSelectedTask = tasks.find(t => selectedTasks.has(t.id));
                                        if (firstSelectedTask) {
                                            setTaskToMove(firstSelectedTask);
                                            setSelectedProjectId('');
                                            setIsMoveDialogOpen(true);
                                        }
                                    }}
                                >
                                    <ArrowRight className="h-4 w-4 mr-1" />
                                    Move to Project
                                </Button>
                            )}
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                    if (confirm(`Are you sure you want to delete ${selectedTasks.size} task${selectedTasks.size !== 1 ? 's' : ''}?`)) {
                                        selectedTasks.forEach(taskId => {
                                            router.delete(route('tasks.destroy', taskId), {
                                                preserveScroll: true,
                                            });
                                        });
                                        setSelectedTasks(new Set());
                                    }
                                }}
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedTasks(new Set())}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

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

            {/* Move to Project Dialog */}
            <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Move Task{selectedTasks.size > 0 ? 's' : ''} to Project</DialogTitle>
                        <DialogDescription>
                            {selectedTasks.size > 0
                                ? `Select a project to move ${selectedTasks.size} selected task${selectedTasks.size !== 1 ? 's' : ''} to. The tasks will be added to the project's default board.`
                                : `Select a project to move "${taskToMove?.title || ''}" to. The task will be added to the project's default board.`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="project-select" className="text-sm font-medium">Project</label>
                            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a project" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map((project) => (
                                        <SelectItem key={project.id} value={project.id.toString()}>
                                            <div className="flex items-center gap-2">
                                                <FolderOpen className="h-4 w-4" />
                                                <span>{project.name}</span>
                                                <Badge variant="secondary" className="text-xs">
                                                    {project.key}
                                                </Badge>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsMoveDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={moveTaskToProject}
                            disabled={!selectedProjectId}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Move Task
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Task</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this task? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                deleteTask();
                                setIsDeleteDialogOpen(false);
                            }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
