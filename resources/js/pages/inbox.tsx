import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { CalendarDays, Clock, Inbox, Plus, Trash2, FolderOpen, ArrowRight, Sparkles, FileText, Search, X, MoreHorizontal, Edit } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useBatchTaskOperations } from '@/hooks/useBatchTaskOperations';
import { BulkActionsPanel } from '@/components/BulkActionsPanel';
import { useShortName } from '@/hooks/use-initials';
import { useGlobalTaskInspector } from '@/contexts/GlobalTaskInspectorContext';
import { TaskDisplay } from '@/components/task/TaskDisplay';
import { TaskDisplayCustomizer } from '@/components/task/TaskDisplayCustomizer';
import { useUndoNotification } from '@/contexts/UndoNotificationContext';
import { TagSelector } from '@/components/tag/TagSelector';
import { useTags } from '@/hooks/useTags';

interface Task {
    id: number;
    title: string;
    description: string | null;
    priority: 'low' | 'medium' | 'high';
    status: 'to_do' | 'in_progress' | 'review' | 'done';
    review_status?: 'pending' | 'approved' | 'rejected' | null;
    due_date: string | null;
    project?: {
        id: number;
        name: string;
        key: string;
        completion_behavior?: 'simple' | 'review' | 'custom';
        requires_review?: boolean;
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

interface Tag {
    id: number;
    name: string;
    color: string;
    user_id: number;
    description: string | null;
    is_default: boolean;
}

interface InboxPageProps {
    tasks: Task[];
    users: User[];
    projects: Project[];
    tags: Tag[];
}

// Remove breadcrumbs to eliminate redundant "inbox" text at top

export default function InboxPage({ tasks = [], users = [], projects = [], tags = [] }: InboxPageProps) {
    const getShortName = useShortName();
    const { openInspector } = useGlobalTaskInspector();
    const { showUndoNotification } = useUndoNotification();
    const { createTag } = useTags();

    // Helper function to get display status
    const getDisplayStatus = (task: Task): string => {
        // If task has explicit review status, return it
        if (task.status === 'review') {
            return 'review';
        }
        // Legacy support: if task is in_progress with pending review, show as review
        if (task.status === 'in_progress' && task.review_status === 'pending') {
            return 'review';
        }
        return task.status;
    };

    // Helper function to get status color
    const getStatusColor = (task: Task): string => {
        const displayStatus = getDisplayStatus(task);
        switch (displayStatus) {
            case 'to_do': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'review': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'done': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const [editingTask, setEditingTask] = useState<Task | null>(null);
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

    // Ref for quick add input to enable auto-focus
    const quickAddInputRef = useRef<HTMLInputElement>(null);

    // Sort state (keeping basic sorting)
    const [sortBy, setSortBy] = useState<string>('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Bulk operations state
    const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
    const [showBulkActions, setShowBulkActions] = useState(false);

    // Cleanup state
    const [isCleaningUp, setIsCleaningUp] = useState(false);
    const [userPreferences, setUserPreferences] = useState<{ auto_cleanup_enabled: boolean }>({
        auto_cleanup_enabled: false
    });

    // Create task dialog state
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [createTaskData, setCreateTaskData] = useState({
        title: '',
        description: '',
        priority: 'medium' as 'low' | 'medium' | 'high',
        due_date: null as string | null,
        assignee_ids: [] as number[],
        tag_ids: [] as number[],
        project_id: null as number | null
    });
    const [isCreatingTask, setIsCreatingTask] = useState(false);

    // Project selection state for create dialog only
    const [projectSearchQuery, setProjectSearchQuery] = useState('');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [showProjectDropdown, setShowProjectDropdown] = useState(false);

    // Project selection state for edit dialog
    const [editProjectSearchQuery, setEditProjectSearchQuery] = useState('');
    const [editSelectedProject, setEditSelectedProject] = useState<Project | null>(null);
    const [showEditProjectDropdown, setShowEditProjectDropdown] = useState(false);

    // Refs for project search inputs
    const projectSearchRef = useRef<HTMLInputElement>(null);
    const editProjectSearchRef = useRef<HTMLInputElement>(null);

    // Unified selection state (used for both keyboard and mouse interactions)
    const [lastSelectedTaskId, setLastSelectedTaskId] = useState<number | null>(null);
    const [currentFocusedTaskId, setCurrentFocusedTaskId] = useState<number | null>(null);
    const taskListRef = useRef<HTMLDivElement>(null);



    // Auto-focus the quick add input when component mounts
    useEffect(() => {
        if (quickAddInputRef.current) {
            quickAddInputRef.current.focus();
        }
    }, []);

    // Load user preferences and perform auto-cleanup on mount
    useEffect(() => {
        // Load user preferences
        fetch(route('inbox-preferences.show'))
            .then(response => response.json())
            .then(prefs => {
                setUserPreferences(prefs);

                // Perform auto-cleanup if enabled
                if (prefs.auto_cleanup_enabled) {
                    performAutoCleanup();
                }
            })
            .catch(error => {
                console.error('Failed to load inbox preferences:', error);
            });
    }, []);



    // Calculate cleanup-eligible tasks
    const cleanupEligibleTasks = useMemo(() => {
        return tasks.filter(task =>
            task.status === 'done' ||
            !task.is_inbox ||
            task.project
        );
    }, [tasks]);

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
                    const priorityOrder = { low: 1, medium: 2, high: 3 };
                    aValue = priorityOrder[a.priority];
                    bValue = priorityOrder[b.priority];
                    break;
                case 'due_date':
                    aValue = a.due_date ? new Date(a.due_date).getTime() : 0;
                    bValue = b.due_date ? new Date(b.due_date).getTime() : 0;
                    break;
                case 'status':
                    const statusOrder = { to_do: 1, in_progress: 2, review: 3, done: 4 };
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

    // Add keyboard event listener for navigation and click-away handler
    useEffect(() => {
        const handleGlobalKeyDown = (event: KeyboardEvent) => {
            // Convert to React.KeyboardEvent-like object
            const reactEvent = {
                key: event.key,
                preventDefault: () => event.preventDefault(),
                target: event.target
            } as React.KeyboardEvent;

            handleKeyDown(reactEvent);
        };

        const handleGlobalClick = (event: MouseEvent) => {
            // Check if click is outside the task list area
            if (taskListRef.current && !taskListRef.current.contains(event.target as Node)) {
                // Only deselect if not clicking on buttons or other interactive elements
                const target = event.target as HTMLElement;
                if (!target.closest('button') && !target.closest('[role="dialog"]') && !target.closest('input')) {
                    setSelectedTasks(new Set());
                    setCurrentFocusedTaskId(null);
                    setShowBulkActions(false);
                }
            }
        };

        document.addEventListener('keydown', handleGlobalKeyDown);
        document.addEventListener('click', handleGlobalClick);
        return () => {
            document.removeEventListener('keydown', handleGlobalKeyDown);
            document.removeEventListener('click', handleGlobalClick);
        };
    }, [currentFocusedTaskId, sortedTasks, selectedTasks]);

    // Clear selection when tasks change if focused task no longer exists
    useEffect(() => {
        if (sortedTasks.length === 0) {
            // Clear selection when no tasks
            setSelectedTasks(new Set());
            setCurrentFocusedTaskId(null);
            setLastSelectedTaskId(null);
        } else if (currentFocusedTaskId && !sortedTasks.find(t => t.id === currentFocusedTaskId)) {
            // If focused task no longer exists, clear selection (no auto-selection)
            setSelectedTasks(new Set());
            setCurrentFocusedTaskId(null);
            setLastSelectedTaskId(null);
        }
    }, [sortedTasks, currentFocusedTaskId]);

    // Reset form when dialog closes
    const resetForm = () => {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setStatus('to_do');
        setDueDate(null);
        setEditingTask(null);
        // Clear edit project selection state
        setEditSelectedProject(null);
        setEditProjectSearchQuery('');
    };

    // Set form values when editing a task
    const editTask = (task: Task) => {
        setEditingTask(task);
        setTitle(task.title);
        setDescription(task.description || '');
        setPriority(task.priority);
        setStatus(task.status);
        setDueDate(task.due_date);
        // Set project selection state for edit dialog
        setEditSelectedProject(task.project || null);
        setEditProjectSearchQuery(task.project?.name || '');
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
                project_id: editSelectedProject?.id || null,
            };

            // Update existing task
            router.put(route('inbox.tasks.update', { task: editingTask.id }), data, {
                onSuccess: () => {
                    setEditingTask(null);
                    resetForm();
                    // Clear edit project selection state
                    setEditSelectedProject(null);
                    setEditProjectSearchQuery('');
                },
            });
        }
    };

    // Delete a task with undo functionality
    const deleteTask = async (taskId: number) => {
        try {
            const response = await fetch(route('inbox.tasks.destroy', { task: taskId }), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();
            if (data.success) {
                // Show undo notification
                showUndoNotification(data.message, data.undo_url);

                // Reload the page to reflect the deletion
                router.reload();
            } else {
                console.error('Failed to delete task:', data);
            }
        } catch (error) {
            console.error('Failed to delete task:', error);
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
            project_id: null, // Quick add doesn't support project selection
        }, {
            onSuccess: () => {
                setQuickAddTitle('');
                setIsQuickAdding(false);
                // Refocus the input for continuous task entry
                setTimeout(() => {
                    if (quickAddInputRef.current) {
                        quickAddInputRef.current.focus();
                    }
                }, 100);
            },
            onError: () => {
                setIsQuickAdding(false);
            }
        });
    };

    // Enhanced task selection with keyboard and mouse support
    const toggleTaskSelection = (taskId: number, event?: React.MouseEvent) => {
        let newSelected = new Set(selectedTasks);

        if (event?.shiftKey && lastSelectedTaskId !== null) {
            // Shift+click: select range
            const currentIndex = sortedTasks.findIndex(t => t.id === taskId);
            const lastIndex = sortedTasks.findIndex(t => t.id === lastSelectedTaskId);

            if (currentIndex !== -1 && lastIndex !== -1) {
                const start = Math.min(currentIndex, lastIndex);
                const end = Math.max(currentIndex, lastIndex);

                // Clear existing selection and add range
                newSelected.clear();
                for (let i = start; i <= end; i++) {
                    newSelected.add(sortedTasks[i].id);
                }
            }
        } else if (event?.ctrlKey || event?.metaKey) {
            // Ctrl/Cmd+click: toggle individual task (multi-select)
            if (newSelected.has(taskId)) {
                newSelected.delete(taskId);
            } else {
                newSelected.add(taskId);
            }
        } else {
            // Regular click: single-task focus behavior
            // Deselect all previously selected tasks and select only the clicked task
            newSelected = new Set([taskId]);
        }

        setSelectedTasks(newSelected);
        setCurrentFocusedTaskId(taskId);
        setLastSelectedTaskId(taskId);
        setShowBulkActions(newSelected.size > 0);
    };

    // Toggle task completion status using flexible completion logic
    const toggleTaskCompletion = (taskId: number) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            // Use the new toggle completion endpoint for flexible behavior
            router.post(route('inbox.tasks.toggle-completion', { task: taskId }), {}, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    // Task will be updated automatically via Inertia
                },
                onError: (errors) => {
                    console.error('Failed to toggle task completion:', errors);
                }
            });
        }
    };

    // Keyboard navigation functions using unified selection
    const moveSelection = (direction: 'up' | 'down', shiftKey: boolean = false) => {
        if (sortedTasks.length === 0) return;

        const currentIndex = currentFocusedTaskId
            ? sortedTasks.findIndex(t => t.id === currentFocusedTaskId)
            : -1;

        let newIndex;
        if (direction === 'up') {
            newIndex = currentIndex <= 0 ? sortedTasks.length - 1 : currentIndex - 1;
        } else {
            newIndex = currentIndex >= sortedTasks.length - 1 ? 0 : currentIndex + 1;
        }

        const newTaskId = sortedTasks[newIndex]?.id;
        if (newTaskId) {
            if (shiftKey && currentFocusedTaskId) {
                // Shift + Arrow: Add to selection
                const newSelected = new Set(selectedTasks);
                newSelected.add(newTaskId);
                setSelectedTasks(newSelected);
            } else {
                // Regular Arrow: Single task focus
                setSelectedTasks(new Set([newTaskId]));
            }
            setCurrentFocusedTaskId(newTaskId);
            setLastSelectedTaskId(newTaskId);
            setShowBulkActions(selectedTasks.size > 0 || shiftKey);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        // Only handle keyboard navigation when not in an input field, textarea, or dropdown
        if (event.target instanceof HTMLInputElement ||
            event.target instanceof HTMLTextAreaElement ||
            event.target instanceof HTMLSelectElement) {
            return;
        }

        // Check if the event is coming from within a dropdown, dialog, or inspector
        const target = event.target as HTMLElement;
        if (target.closest('[role="listbox"]') ||
            target.closest('[role="combobox"]') ||
            target.closest('[data-radix-select-content]') ||
            target.closest('[data-radix-select-trigger]') ||
            target.closest('[data-radix-select-item]') ||
            target.closest('[data-global-inspector]') ||
            target.closest('[role="dialog"]') ||
            target.closest('.select-content') ||
            target.closest('.select-trigger')) {
            return;
        }

        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                moveSelection('up', event.shiftKey);
                break;
            case 'ArrowDown':
                event.preventDefault();
                moveSelection('down', event.shiftKey);
                break;
            case ' ':
                event.preventDefault();
                // Toggle completion for all selected tasks
                if (selectedTasks.size > 0) {
                    selectedTasks.forEach(taskId => {
                        toggleTaskCompletion(taskId);
                    });
                }
                break;
        }
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

    // Use the shared batch operations hook
    const {
        isProcessing,
        getSelectedTasksCompletionState,
        bulkToggleCompletion,
        bulkDelete,
        bulkUpdateStatus
    } = useBatchTaskOperations(
        tasks,
        selectedTasks,
        setSelectedTasks,
        setShowBulkActions,
        'inbox.tasks'
    );

    // Quick status update
    const quickUpdateStatus = (taskId: number, newStatus: string, reviewStatus: string | null = null) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            const updateData = {
                ...task,
                status: newStatus,
            };

            if (reviewStatus !== null) {
                updateData.review_status = reviewStatus;
            }

            router.put(route('inbox.tasks.update', { task: taskId }), updateData, {
                preserveState: true,
                preserveScroll: true
            });
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

    // Perform automatic cleanup (silent)
    const performAutoCleanup = () => {
        router.post(route('inbox.cleanup'), {}, {
            preserveState: true,
            preserveScroll: true,
            only: ['tasks'], // Only refresh tasks data
        });
    };

    // Perform immediate cleanup without confirmation
    const performCleanup = () => {
        if (isCleaningUp) return; // Prevent double-clicks

        setIsCleaningUp(true);
        router.post(route('inbox.cleanup'), {}, {
            onSuccess: () => {
                setIsCleaningUp(false);
                // Success message will be shown via Inertia flash message
            },
            onError: () => {
                setIsCleaningUp(false);
            }
        });
    };

    // Create task dialog functions
    const openCreateDialog = () => {
        setCreateTaskData({
            title: '',
            description: '',
            priority: 'medium',
            due_date: null,
            assignee_ids: [],
            tag_ids: [],
            project_id: null
        });
        setSelectedProject(null);
        setProjectSearchQuery('');
        setIsCreateDialogOpen(true);
    };

    const closeCreateDialog = () => {
        setIsCreateDialogOpen(false);
        setCreateTaskData({
            title: '',
            description: '',
            priority: 'medium',
            due_date: null,
            assignee_ids: [],
            tag_ids: [],
            project_id: null
        });
        setSelectedProject(null);
        setProjectSearchQuery('');
    };

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!createTaskData.title.trim()) return;

        setIsCreatingTask(true);
        const taskData = {
            ...createTaskData,
            status: 'to_do', // Default status for new tasks
            project_id: selectedProject?.id || null
        };

        router.post(route('inbox.tasks.store'), taskData, {
            onSuccess: () => {
                setIsCreatingTask(false);
                closeCreateDialog();
            },
            onError: () => {
                setIsCreatingTask(false);
            }
        });
    };

    // Tag handling functions
    const handleTagsChange = (selectedTags: Tag[]) => {
        setCreateTaskData(prev => ({
            ...prev,
            tag_ids: selectedTags.map(tag => tag.id)
        }));
    };

    const handleCreateTag = async (name: string, color: string): Promise<Tag> => {
        return await createTag(name, color);
    };

    // Project search and selection helpers
    const filteredProjects = useMemo(() => {
        if (!projectSearchQuery.trim()) return projects;
        const query = projectSearchQuery.toLowerCase();
        return projects.filter(project =>
            project.name.toLowerCase().includes(query) ||
            project.key.toLowerCase().includes(query)
        );
    }, [projects, projectSearchQuery]);

    const handleProjectSelect = (project: Project) => {
        setSelectedProject(project);
        setProjectSearchQuery(project.name);
        setShowProjectDropdown(false);
        setCreateTaskData(prev => ({ ...prev, project_id: project.id }));
    };

    const clearProjectSelection = () => {
        setSelectedProject(null);
        setProjectSearchQuery('');
        setCreateTaskData(prev => ({ ...prev, project_id: null }));
    };

    // Project selection functions for edit dialog
    const filteredEditProjects = useMemo(() => {
        if (!editProjectSearchQuery) return projects;
        return projects.filter(project =>
            project.name.toLowerCase().includes(editProjectSearchQuery.toLowerCase()) ||
            project.key.toLowerCase().includes(editProjectSearchQuery.toLowerCase())
        );
    }, [projects, editProjectSearchQuery]);

    const handleEditProjectSelect = (project: Project) => {
        setEditSelectedProject(project);
        setEditProjectSearchQuery(project.name);
        setShowEditProjectDropdown(false);
    };

    const clearEditProjectSelection = () => {
        setEditSelectedProject(null);
        setEditProjectSearchQuery('');
    };

    return (
        <AppLayout>
            <Head title="Inbox" />
            <div className="space-y-6">
                <div className="flex items-center gap-4 py-2">
                    <Inbox className="h-8 w-8 text-primary" />
                    <h1 className="text-2xl font-semibold">Inbox</h1>
                    <span className="text-sm text-muted-foreground">
                        {sortedTasks.length} tasks
                    </span>

                    {/* Create Task button */}
                    <Button
                        variant="default"
                        size="sm"
                        onClick={openCreateDialog}
                        className="flex items-center gap-2"
                    >
                        <FileText className="h-4 w-4" />
                        Create Task
                    </Button>

                    {/* Cleanup button - always show */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={performCleanup}
                                    disabled={isCleaningUp || cleanupEligibleTasks.length === 0}
                                    className="flex items-center gap-2"
                                >
                                    {isCleaningUp ? (
                                        <>
                                            <Clock className="h-4 w-4 animate-spin" />
                                            Cleaning...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4" />
                                            Clean Up ({cleanupEligibleTasks.length})
                                        </>
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Move all completed tasks to archives and tasks with projects to their respective projects</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* Task Display Customizer */}
                    <TaskDisplayCustomizer pageKey="inbox" />

                    {sortedTasks.length > 0 && (
                        <div className="flex items-center gap-2 ml-auto">
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

                {/* Quick Add Form - Separate container */}
                <Card>
                    <CardContent className="pt-3 pb-3">
                        <form onSubmit={handleQuickAdd} className="flex gap-2">
                            <div className="flex-1">
                                <Input
                                    ref={quickAddInputRef}
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
                    </CardContent>
                </Card>

                {/* Task List */}
                <Card>
                    <CardContent className="pt-3 pb-3">
                        {sortedTasks.length > 0 ? (
                            <div
                                className="space-y-2"
                                ref={taskListRef}
                                onClick={(e) => {
                                    // Click away functionality - deselect all tasks if clicking on empty space
                                    if (e.target === e.currentTarget) {
                                        setSelectedTasks(new Set());
                                        setCurrentFocusedTaskId(null);
                                        setShowBulkActions(false);
                                    }
                                }}
                            >
                                {sortedTasks.map((task) => {
                                    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                                    const isSelected = selectedTasks.has(task.id);

                                    return (
                                        <div
                                            key={task.id}
                                            className={`group flex items-start gap-3 p-3 rounded-lg border border-border transition-all duration-200 cursor-pointer bg-white dark:bg-gray-800 hover:shadow-md ${
                                                task.status === 'done' ? 'opacity-60' : ''
                                            } ${isOverdue
                                                ? 'border-red-300'
                                                : ''
                                            } ${isSelected
                                                ? 'ring-2 ring-primary/30 border-primary/30'
                                                : 'hover:border-primary/20'
                                            }`}
                                            data-task-clickable
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (e.ctrlKey || e.metaKey || e.shiftKey) {
                                                    // Multi-select behavior with modifier keys
                                                    toggleTaskSelection(task.id, e);
                                                } else {
                                                    // Single click opens inspector
                                                    openInspector(task);
                                                }
                                            }}
                                            onDoubleClick={() => editTask(task)}
                                        >
                                            <Checkbox
                                                checked={task.status === 'done'}
                                                onCheckedChange={(checked) => {
                                                    const newStatus = checked ? 'done' : 'to_do';
                                                    quickUpdateStatus(task.id, newStatus);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="mt-1"
                                            />

                                            <div className="flex-1 min-w-0">
                                                <TaskDisplay
                                                    task={task}
                                                    compact
                                                    pageKey="inbox"
                                                />
                                                {task.project && (
                                                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                                        <FolderOpen className="h-3 w-3" />
                                                        <span>{task.project.name}</span>
                                                        <Badge variant="outline" className="text-xs">
                                                            {task.project.key}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1 ml-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                            <MoreHorizontal className="h-3 w-3" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            editTask(task);
                                                        }}>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        {projects.length > 0 && (
                                                            <DropdownMenuItem onClick={(e) => {
                                                                e.stopPropagation();
                                                                openMoveDialog(task);
                                                            }}>
                                                                <ArrowRight className="h-4 w-4 mr-2" />
                                                                Move to Project
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteTask(task.id);
                                                            }}
                                                            className="text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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

            {/* Bulk Actions Panel */}
            <BulkActionsPanel
                selectedTasks={selectedTasks}
                onClearSelection={() => {
                    setSelectedTasks(new Set());
                    setShowBulkActions(false);
                }}
                onToggleCompletion={() => bulkToggleCompletion({ preserveSelection: true })}
                onDelete={() => bulkDelete({ preserveSelection: true })}
                onMoveToProject={() => {
                    // For bulk move, we'll use the first selected task as reference
                    const firstSelectedTask = tasks.find(t => selectedTasks.has(t.id));
                    if (firstSelectedTask) {
                        setTaskToMove(firstSelectedTask);
                        setSelectedProjectId('');
                        setIsMoveDialogOpen(true);
                    }
                }}
                getCompletionState={getSelectedTasksCompletionState}
                showMoveToProject={projects.length > 0}
                isProcessing={isProcessing}
            />

            {/* Edit Task Dialog */}
            {editingTask && (
                <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Edit Task</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={onSubmit} className="space-y-4">
                            <div className="space-y-4">
                                {/* 1. Title */}
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

                                {/* 2. Description */}
                                <div className="space-y-2">
                                    <label htmlFor="edit-description" className="text-sm font-medium">Description</label>
                                    <Textarea
                                        id="edit-description"
                                        placeholder="Task description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>

                                {/* 3. Project */}
                                <div className="space-y-2">
                                    <label htmlFor="edit-project" className="text-sm font-medium">Project</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            ref={editProjectSearchRef}
                                            placeholder="Search projects..."
                                            value={editProjectSearchQuery}
                                            onChange={(e) => {
                                                setEditProjectSearchQuery(e.target.value);
                                                setShowEditProjectDropdown(e.target.value.length > 0);
                                            }}
                                            onFocus={() => setShowEditProjectDropdown(editProjectSearchQuery.length > 0 || filteredEditProjects.length > 0)}
                                            onBlur={() => setTimeout(() => setShowEditProjectDropdown(false), 200)}
                                            className="pl-10"
                                        />
                                        {editSelectedProject && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                                                onClick={clearEditProjectSelection}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        )}

                                        {/* Project Dropdown */}
                                        {showEditProjectDropdown && filteredEditProjects.length > 0 && (
                                            <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                                                {filteredEditProjects.slice(0, 10).map((project) => (
                                                    <button
                                                        key={project.id}
                                                        type="button"
                                                        className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 border-b last:border-b-0"
                                                        onClick={() => handleEditProjectSelect(project)}
                                                    >
                                                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                                                        <span className="flex-1">{project.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Selected Project Display */}
                                        {editSelectedProject && (
                                            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                                                <FolderOpen className="h-4 w-4" />
                                                <span>Selected: <strong>{editSelectedProject.name}</strong></span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 4. Priority */}
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

                                {/* 5. Due Date */}
                                <div className="space-y-2">
                                    <label htmlFor="edit-due-date" className="text-sm font-medium">Due Date</label>
                                    <Input
                                        id="edit-due-date"
                                        type="date"
                                        className="w-full"
                                        value={dueDate || ''}
                                        onChange={(e) => setDueDate(e.target.value || null)}
                                        onKeyDown={(e) => {
                                            // Fix tab navigation for date input
                                            if (e.key === 'Tab' && !e.shiftKey) {
                                                e.preventDefault();
                                                // Focus the next field (assignee - not implemented in edit dialog yet)
                                                // For now, just let it tab to the next available element
                                                const nextElement = e.currentTarget.parentElement?.parentElement?.nextElementSibling?.querySelector('input, select, button') as HTMLElement;
                                                if (nextElement) {
                                                    nextElement.focus();
                                                }
                                            }
                                        }}
                                    />
                                </div>

                                {/* 6. Assignee - Note: Not implemented in edit dialog yet, but keeping structure consistent */}
                                {/* This would be added here if assignee editing is needed in the future */}
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





            {/* Create Task Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Create New Task</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateTask} className="space-y-4">
                        <div className="space-y-4">
                            {/* 1. Title */}
                            <div className="space-y-2">
                                <label htmlFor="create-title" className="text-sm font-medium">Title</label>
                                <Input
                                    id="create-title"
                                    placeholder="Task title"
                                    value={createTaskData.title}
                                    onChange={(e) => setCreateTaskData(prev => ({ ...prev, title: e.target.value }))}
                                    required
                                />
                            </div>

                            {/* 2. Description */}
                            <div className="space-y-2">
                                <label htmlFor="create-description" className="text-sm font-medium">Description</label>
                                <Textarea
                                    id="create-description"
                                    placeholder="Task description"
                                    value={createTaskData.description}
                                    onChange={(e) => setCreateTaskData(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>

                            {/* 3. Project */}
                            <div className="space-y-2">
                                <label htmlFor="create-project" className="text-sm font-medium">Project</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        ref={projectSearchRef}
                                        placeholder="Search projects..."
                                        value={projectSearchQuery}
                                        onChange={(e) => {
                                            setProjectSearchQuery(e.target.value);
                                            setShowProjectDropdown(e.target.value.length > 0);
                                        }}
                                        onFocus={() => setShowProjectDropdown(projectSearchQuery.length > 0 || filteredProjects.length > 0)}
                                        onBlur={() => setTimeout(() => setShowProjectDropdown(false), 200)}
                                        className="pl-10"
                                    />
                                    {selectedProject && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                                            onClick={clearProjectSelection}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}

                                    {/* Project Dropdown */}
                                    {showProjectDropdown && filteredProjects.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                                            {filteredProjects.slice(0, 10).map((project) => (
                                                <button
                                                    key={project.id}
                                                    type="button"
                                                    className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 border-b last:border-b-0"
                                                    onClick={() => handleProjectSelect(project)}
                                                >
                                                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                                                    <span className="flex-1">{project.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Selected Project Display */}
                                    {selectedProject && (
                                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                                            <FolderOpen className="h-4 w-4" />
                                            <span>Selected: <strong>{selectedProject.name}</strong></span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 4. Priority */}
                            <div className="space-y-2">
                                <label htmlFor="create-priority" className="text-sm font-medium">Priority</label>
                                <select
                                    id="create-priority"
                                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                                    value={createTaskData.priority}
                                    onChange={(e) => setCreateTaskData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            {/* 5. Due Date */}
                            <div className="space-y-2">
                                <label htmlFor="create-due-date" className="text-sm font-medium">Due Date</label>
                                <Input
                                    id="create-due-date"
                                    type="date"
                                    className="w-full"
                                    value={createTaskData.due_date || ''}
                                    onChange={(e) => setCreateTaskData(prev => ({ ...prev, due_date: e.target.value || null }))}
                                    onKeyDown={(e) => {
                                        // Fix tab navigation for date input
                                        if (e.key === 'Tab' && !e.shiftKey) {
                                            e.preventDefault();
                                            // Focus the next field (assignee select trigger)
                                            setTimeout(() => {
                                                const assigneeSelect = document.querySelector('#create-assignees-trigger') as HTMLElement;
                                                if (assigneeSelect) {
                                                    assigneeSelect.focus();
                                                } else {
                                                    // Fallback to any select trigger in the dialog
                                                    const fallbackSelect = document.querySelector('[data-radix-select-trigger]') as HTMLElement;
                                                    if (fallbackSelect) {
                                                        fallbackSelect.focus();
                                                    }
                                                }
                                            }, 0);
                                        }
                                    }}
                                />
                            </div>

                            {/* 6. Assignee */}
                            <div className="space-y-2">
                                <label htmlFor="create-assignees" className="text-sm font-medium">Assignee</label>
                                <Select
                                    value={createTaskData.assignee_ids.length > 0 ? createTaskData.assignee_ids[0].toString() : 'no-assignee'}
                                    onValueChange={(value) => setCreateTaskData(prev => ({ ...prev, assignee_ids: value === 'no-assignee' ? [] : [parseInt(value)] }))}
                                >
                                    <SelectTrigger id="create-assignees-trigger">
                                        <SelectValue placeholder="Select an assignee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="no-assignee">No assignee</SelectItem>
                                        {users.map((user) => (
                                            <SelectItem key={user.id} value={user.id.toString()}>
                                                {getShortName(user.name)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* 7. Tags */}
                            <TagSelector
                                selectedTags={tags.filter(tag => createTaskData.tag_ids.includes(tag.id))}
                                availableTags={tags}
                                onTagsChange={handleTagsChange}
                                onCreateTag={handleCreateTag}
                                placeholder="Select personal tags..."
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeCreateDialog}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isCreatingTask}>
                                {isCreatingTask ? (
                                    <>
                                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Task'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Cleanup confirmation dialog removed - using immediate cleanup with notifications */}
        </AppLayout>
    );
}
