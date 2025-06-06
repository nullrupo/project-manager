import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Project } from '@/types/project-manager';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Archive, Edit, Lock, Plus, Trash2, Users, ListTodo, Tag, Globe, Shield, Calendar, BarChart3, UserPlus, Settings, Crown, Clock, AlertCircle, CheckCircle2, Search, Filter, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Menu, X, Eye, GripVertical, MoreHorizontal, Save, Layers, ToggleLeft, ToggleRight } from 'lucide-react';
import { useShortName } from '@/hooks/use-initials';
import axios from 'axios';
import InviteMemberModal from '@/components/invite-member-modal';
import MemberPermissionModal from '@/components/member-permission-modal';
import { useState, useEffect, useRef, memo, useCallback } from 'react';
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    MouseSensor,
    KeyboardSensor,
    closestCenter,
    rectIntersection,
    getFirstCollision,
    pointerWithin,
    useDraggable,
    useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    horizontalListSortingStrategy,
    useSortable,
    arrayMove,
} from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import TaskWithSubtasks from '@/components/task-with-subtasks';
import TaskEditModal from '@/components/task-edit-modal';
import TaskViewModal from '@/components/task-view-modal';

interface ProjectShowProps {
    project: Project;
}

// Simple Section Edit Form Component
const SectionEditForm = ({ section, project, onClose }: { section: any, project: Project, onClose: () => void }) => {
    const [formData, setFormData] = useState({
        name: section.name || '',
        description: section.description || ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.put(route('sections.update', { project: project.id, section: section.id }), formData, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                onClose();
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Section Name</label>
                <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Section name..."
                    required
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Section description..."
                    rows={3}
                />
            </div>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </form>
    );
};

// TaskInspector Component (moved outside to prevent recreation on re-renders)
const TaskInspector = memo(({
    inspectorTask,
    onClose,
    project
}: {
    inspectorTask: any;
    onClose: () => void;
    project: any;
}) => {
    if (!inspectorTask) return null;

    const [taskData, setTaskData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        status: 'to_do',
        due_date: '',
        estimate: '',
        list_id: ''
    });

    // Save state tracking
    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync taskData with inspectorTask when it changes
    useEffect(() => {
        if (inspectorTask) {
            setTaskData({
                title: inspectorTask.title || '',
                description: inspectorTask.description || '',
                priority: inspectorTask.priority || 'medium',
                status: inspectorTask.status || 'to_do',
                due_date: inspectorTask.due_date ? inspectorTask.due_date.split('T')[0] : '',
                estimate: inspectorTask.estimate || '',
                list_id: inspectorTask.list_id || inspectorTask.list?.id || ''
            });
            setHasUnsavedChanges(false);
            setSaveState('idle');
        }
    }, [inspectorTask?.id]); // Only re-run when the task ID changes



    const handleFieldChange = useCallback((field: string, value: any) => {
        console.log('📝 handleFieldChange called!', { field, value });

        setTaskData(prev => ({ ...prev, [field]: value }));
        setHasUnsavedChanges(true);
        setSaveState('idle');

        console.log('📝 Field changed, manual save required');
    }, []);

    // Manual save function using Inertia (no auto-save)
    const handleManualSave = useCallback(() => {
        if (!inspectorTask || !hasUnsavedChanges) return;

        console.log('💾 Manual save triggered');
        setSaveState('saving');

        // Prepare the data with all required fields matching TaskController validation
        const updateData = {
            title: taskData.title || 'Untitled Task',
            description: taskData.description || '',
            priority: taskData.priority || 'medium',
            status: taskData.status || 'to_do',
            estimate: taskData.estimate || null,
            due_date: taskData.due_date || null,
            start_date: null,
            duration_days: null,
            list_id: taskData.list_id || inspectorTask.list_id || inspectorTask.list?.id,
            reviewer_id: null,
            section_id: null,
            parent_task_id: null,
            assignee_ids: inspectorTask.assignees?.map((a: any) => a.id) || [],
            label_ids: inspectorTask.labels?.map((l: any) => l.id) || [],
            is_archived: inspectorTask.is_archived || false
        };

        console.log('💾 Sending update data:', updateData);

        // Use Inertia's put method for proper Laravel integration
        router.put(route('tasks.update', { project: project.id, task: inspectorTask.id }), updateData, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                console.log('✅ Task saved successfully');
                setHasUnsavedChanges(false);
                setSaveState('saved');

                // Clear saved state after 2 seconds
                setTimeout(() => setSaveState('idle'), 2000);
            },
            onError: (errors) => {
                console.error('❌ Save failed:', errors);
                setSaveState('error');

                // Clear error state after 3 seconds
                setTimeout(() => setSaveState('idle'), 3000);
            }
        });
    }, [inspectorTask, hasUnsavedChanges, taskData, project.id, router]);





    return (
        <div ref={containerRef} className="w-80 border-l bg-background flex flex-col h-full">
            <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Task Details</h3>
                    <div className="flex items-center gap-2">
                        {/* Save state indicator */}
                        {saveState === 'saving' && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full"></div>
                                Saving...
                            </div>
                        )}
                        {saveState === 'saved' && (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle2 className="h-3 w-3" />
                                Saved
                            </div>
                        )}
                        {saveState === 'error' && (
                            <div className="flex items-center gap-1 text-xs text-red-600">
                                <AlertCircle className="h-3 w-3" />
                                Error
                            </div>
                        )}
                        {hasUnsavedChanges && saveState === 'idle' && (
                            <div className="text-xs text-amber-600">
                                Unsaved changes
                            </div>
                        )}
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Title */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input
                        value={taskData.title}
                        onChange={(e) => handleFieldChange('title', e.target.value)}
                        placeholder="Task title..."
                    />
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                        value={taskData.description}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        placeholder="Task description..."
                        rows={4}
                    />
                </div>

                {/* Priority */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <Select value={taskData.priority} onValueChange={(value) => handleFieldChange('priority', value)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={taskData.status} onValueChange={(value) => handleFieldChange('status', value)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="to_do">To Do</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Due Date</label>
                    <Input
                        type="date"
                        value={taskData.due_date}
                        onChange={(e) => handleFieldChange('due_date', e.target.value)}
                    />
                </div>

                {/* Estimate */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Estimate (hours)</label>
                    <Input
                        type="number"
                        value={taskData.estimate}
                        onChange={(e) => handleFieldChange('estimate', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="0"
                    />
                </div>

                {/* Assignees */}
                {inspectorTask.assignees && inspectorTask.assignees.length > 0 && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Assignees</label>
                        <div className="flex flex-wrap gap-2">
                            {inspectorTask.assignees.map((assignee: any) => (
                                <Badge key={assignee.id} variant="secondary" className="flex items-center gap-1">
                                    <Avatar className="h-4 w-4">
                                        <AvatarImage src={assignee.avatar} />
                                        <AvatarFallback className="text-xs">
                                            {assignee.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {assignee.name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Manual Save Button */}
            <div className="p-4 border-t bg-muted/20">
                <Button
                    onClick={handleManualSave}
                    disabled={!hasUnsavedChanges || saveState === 'saving'}
                    className="w-full"
                    variant={hasUnsavedChanges ? "default" : "outline"}
                >
                    {saveState === 'saving' ? (
                        <>
                            <div className="animate-spin h-4 w-4 border border-current border-t-transparent rounded-full mr-2"></div>
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            {hasUnsavedChanges ? 'Save Changes' : 'All Changes Saved'}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
        prevProps.inspectorTask?.id === nextProps.inspectorTask?.id &&
        prevProps.inspectorTask?.title === nextProps.inspectorTask?.title &&
        prevProps.inspectorTask?.description === nextProps.inspectorTask?.description &&
        prevProps.inspectorTask?.priority === nextProps.inspectorTask?.priority &&
        prevProps.inspectorTask?.status === nextProps.inspectorTask?.status &&
        prevProps.inspectorTask?.due_date === nextProps.inspectorTask?.due_date &&
        prevProps.inspectorTask?.estimate === nextProps.inspectorTask?.estimate &&
        prevProps.onClose === nextProps.onClose &&
        prevProps.project?.id === nextProps.project?.id
    );
});

export default function ProjectShow({ project }: ProjectShowProps) {
    const { auth } = usePage<SharedData>().props;
    const canEdit = project.can_edit;
    const getShortName = useShortName();
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<any>(null);
    const [permissionModalOpen, setPermissionModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<any>(null);
    const [boardSearchQuery, setBoardSearchQuery] = useState('');
    const [boardTypeFilter, setBoardTypeFilter] = useState('all');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    // Board state
    const [lists, setLists] = useState(project.boards?.[0]?.lists || []);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeItem, setActiveItem] = useState<any | null>(null);

    // Task modal states for board
    const [taskEditModalOpen, setTaskEditModalOpen] = useState(false);
    const [taskViewModalOpen, setTaskViewModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);

    // List tab state
    const [listViewMode, setListViewMode] = useState<'status' | 'sections'>('sections');
    const [inspectorOpen, setInspectorOpen] = useState(false);
    const [inspectorTask, setInspectorTask] = useState<any>(null);
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
    const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

    // List tab drag and drop state
    const [listActiveId, setListActiveId] = useState<string | null>(null);
    const [listActiveItem, setListActiveItem] = useState<any | null>(null);

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Board drag handlers
    const handleBoardDragStart = (event: any) => {
        const { active } = event;
        setActiveId(active.id);

        if (active.id.startsWith('list-')) {
            const listId = parseInt(active.id.replace('list-', ''));
            const list = lists.find(l => l.id === listId);
            setActiveItem({ type: 'list', list });
        } else if (active.id.startsWith('task-')) {
            const taskId = parseInt(active.id.replace('task-', ''));
            const task = lists.flatMap(l => l.tasks || []).find(t => t.id === taskId);
            setActiveItem({ type: 'task', task });
        }
    };

    const handleBoardDragEnd = (event: any) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveItem(null);

        if (!over) return;

        // Handle task movement between lists
        if (active.id.startsWith('task-') && over.id.startsWith('list-')) {
            const taskId = parseInt(active.id.replace('task-', ''));
            const newListId = parseInt(over.id.replace('list-', ''));

            // Update task list via API
            router.put(route('tasks.update', { project: project.id, task: taskId }), {
                list_id: newListId
            }, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    // Refresh the page to get updated data
                    router.reload();
                },
                onError: (error) => {
                    console.error('Failed to move task:', error);
                }
            });
        }
    };

    // List tab drag handlers
    const handleListDragStart = (event: any) => {
        const { active } = event;
        setListActiveId(active.id);

        if (active.id.startsWith('list-task-')) {
            const taskId = parseInt(active.id.replace('list-task-', ''));
            const allTasks = project.boards?.[0]?.lists?.flatMap(list => list.tasks || []) || [];
            const task = allTasks.find(t => t.id === taskId);
            setListActiveItem({ type: 'task', task });
        }
    };

    const handleListDragEnd = (event: any) => {
        const { active, over } = event;
        setListActiveId(null);
        setListActiveItem(null);

        if (!over) return;

        // Handle task movement between sections
        if (active.id.startsWith('list-task-') && over.id.startsWith('list-section-')) {
            const taskId = parseInt(active.id.replace('list-task-', ''));
            const sectionId = over.id.replace('list-section-', '');

            // Find the target list/section
            let targetListId = null;

            if (listViewMode === 'sections') {
                // Moving to a specific list (section)
                targetListId = parseInt(sectionId);
            } else {
                // Moving to a status group - use the first available list
                const firstList = project.boards?.[0]?.lists?.[0];
                if (firstList) {
                    targetListId = firstList.id;
                }
            }

            if (targetListId) {
                const updates: any = { list_id: targetListId };

                // If moving to status-based section, also update status
                if (listViewMode === 'status') {
                    updates.status = sectionId;
                }

                router.put(route('tasks.update', { project: project.id, task: taskId }), updates, {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        router.reload();
                    },
                    onError: (error) => {
                        console.error('Failed to move task:', error);
                    }
                });
            }
        }
    };

    // Task handlers for board
    const handleEditTask = (task: any) => {
        setSelectedTask(task);
        setTaskEditModalOpen(true);
    };

    const handleViewTask = (task: any) => {
        setSelectedTask(task);
        setTaskViewModalOpen(true);
    };

    const handleEditFromView = (task: any) => {
        setTaskViewModalOpen(false);
        setTaskEditModalOpen(true);
    };

    // Inspector functions
    const openInspector = (task: any) => {
        setInspectorTask(task);
        setInspectorOpen(true);
    };

    const closeInspector = useCallback(() => {
        setInspectorOpen(false);
        setInspectorTask(null);
    }, []);



    // Section management functions
    const toggleSectionCollapse = (sectionId: string) => {
        setCollapsedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            } else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    };

    // Get tasks organized by sections or status
    const getOrganizedTasks = () => {
        if (!project.boards?.[0]?.lists) return [];

        const allTasks = project.boards[0].lists.flatMap(list => list.tasks || []);

        if (listViewMode === 'status') {
            return [
                {
                    id: 'to_do',
                    name: 'To Do',
                    type: 'status',
                    tasks: allTasks.filter(task => task.status === 'to_do' && !task.parent_task_id)
                },
                {
                    id: 'in_progress',
                    name: 'In Progress',
                    type: 'status',
                    tasks: allTasks.filter(task => task.status === 'in_progress' && !task.parent_task_id)
                },
                {
                    id: 'done',
                    name: 'Done',
                    type: 'status',
                    tasks: allTasks.filter(task => task.status === 'done' && !task.parent_task_id)
                }
            ];
        } else {
            // Group by board lists (sections)
            return project.boards[0].lists.map(list => ({
                id: list.id.toString(),
                name: list.name,
                type: 'section',
                color: list.color,
                tasks: (list.tasks || []).filter(task => !task.parent_task_id)
            }));
        }
    };

    // Sortable List Component
    const SortableList = ({ list, children }: { list: any, children: React.ReactNode }) => {
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
                                    router.get(route('tasks.create', { project: project.id, board: list.board_id, list: list.id, tab: 'boards' }));
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
    const SortableTask = ({ task }: { task: any }) => {
        return (
            <div className="mb-3 rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer relative">
                {/* Action buttons - positioned absolutely */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
                    {/* View button - always available */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 bg-background/80 hover:bg-background"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewTask(task);
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
                                handleEditTask(task);
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

    // Enhanced Task Component for List View with Drag and Drop
    const ListTaskItem = ({ task, level = 0, sectionId }: { task: any, level?: number, sectionId?: string }) => {
        const [isExpanded, setIsExpanded] = useState(true);
        const hasSubtasks = task.subtasks && task.subtasks.length > 0;

        // Drag and drop functionality
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
        } = useSortable({
            id: `list-task-${task.id}`,
            data: {
                type: 'task',
                task,
                sectionId
            },
        });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            opacity: isDragging ? 0.5 : 1,
        };

        const handleTaskClick = () => {
            if (!isDragging) {
                openInspector(task);
            }
        };

        const handleToggleCompletion = (e: React.MouseEvent) => {
            e.stopPropagation();
            router.post(route('tasks.toggle-completion', { project: project.id, task: task.id }), {}, {
                preserveState: true,
                preserveScroll: true,
            });
        };

        const handleDeleteTask = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this task?')) {
                router.delete(route('tasks.destroy', { project: project.id, task: task.id }));
            }
        };

        const getPriorityColor = (priority: string) => {
            switch (priority) {
                case 'urgent': return 'border-l-red-500 bg-red-50 dark:bg-red-950/20';
                case 'high': return 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20';
                case 'medium': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
                case 'low': return 'border-l-green-500 bg-green-50 dark:bg-green-950/20';
                default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-950/20';
            }
        };

        return (
            <div className="space-y-1" style={{ marginLeft: `${level * 24}px` }}>
                <div
                    ref={setNodeRef}
                    style={style}
                    {...attributes}
                    className={`group relative p-3 border-l-4 rounded-lg cursor-pointer transition-all hover:shadow-md ${getPriorityColor(task.priority)} ${task.status === 'done' ? 'opacity-75' : ''} ${isDragging ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
                    onClick={handleTaskClick}
                >
                    {/* Drag handle */}
                    <div
                        {...listeners}
                        className="absolute left-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                    >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-start gap-3">
                        {/* Expand/Collapse button for subtasks */}
                        {hasSubtasks && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsExpanded(!isExpanded);
                                }}
                            >
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                        )}

                        {/* Completion checkbox */}
                        <Checkbox
                            checked={task.status === 'done'}
                            onCheckedChange={handleToggleCompletion}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1"
                        />

                        {/* Task content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <h4 className={`font-medium text-sm ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                                    {task.title}
                                </h4>

                                {/* Action buttons */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    {project.can_manage_tasks && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.get(route('tasks.create', {
                                                        project: project.id,
                                                        board: task.list?.board_id || project.boards[0].id,
                                                        list: task.list_id,
                                                        parent_task_id: task.id,
                                                        tab: 'list'
                                                    }));
                                                }}
                                                title="Add subtask"
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                        <MoreHorizontal className="h-3 w-3" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditTask(task);
                                                    }}>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={handleDeleteTask}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Task metadata */}
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                    {task.priority}
                                </Badge>
                                {task.due_date && (
                                    <Badge variant="outline" className="text-xs">
                                        {new Date(task.due_date).toLocaleDateString()}
                                    </Badge>
                                )}
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
                </div>

                {/* Subtasks */}
                {hasSubtasks && isExpanded && (
                    <div className="space-y-1">
                        {task.subtasks.map((subtask: any) => (
                            <ListTaskItem key={subtask.id} task={subtask} level={level + 1} sectionId={sectionId} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Drag and drop state
    const [activeTask, setActiveTask] = useState<any>(null);
    const [draggedTask, setDraggedTask] = useState<any>(null);
    const [isUpdatingTask, setIsUpdatingTask] = useState(false);
    const [isDragInProgress, setIsDragInProgress] = useState(false);

    // Local state for optimistic updates
    const [localTaskUpdates, setLocalTaskUpdates] = useState<{[key: number]: any}>({});

    // Track if any resize handle is being used
    const [isAnyHandleResizing, setIsAnyHandleResizing] = useState(false);

    // Track if component is mounted to prevent hydration issues
    const [isMounted, setIsMounted] = useState(false);

    // Use ref to track recent drag operations
    const recentDragRef = useRef(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Shared priority color function
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-l-red-500';
            case 'high': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-l-orange-500';
            case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-l-yellow-500';
            case 'low': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-l-green-500';
            default: return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-l-blue-500';
        }
    };

    // Task assignment modal state
    const [assignTaskModalOpen, setAssignTaskModalOpen] = useState(false);
    const [taskToAssign, setTaskToAssign] = useState<any>(null);

    // Task duration modal state
    const [durationModalOpen, setDurationModalOpen] = useState(false);
    const [taskToExtend, setTaskToExtend] = useState<any>(null);

    // Task detail modal state
    const [taskDetailModalOpen, setTaskDetailModalOpen] = useState(false);
    const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<any>(null);

    // Member panel state
    const [memberPanelOpen, setMemberPanelOpen] = useState(false);

    // Section editing state
    const [sectionEditModalOpen, setSectionEditModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<any>(null);

    // Get tab from URL parameters, default to 'boards'
    const getActiveTabFromUrl = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        const validTabs = ['list', 'boards', 'calendar', 'members', 'labels', 'details'];
        return validTabs.includes(tab || '') ? tab : 'list';
    };

    const [activeTab, setActiveTab] = useState(getActiveTabFromUrl);

    // Update URL when tab changes
    const handleTabChange = (newTab: string) => {
        setActiveTab(newTab);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', newTab);
        window.history.pushState({}, '', url.toString());
    };

    // Listen for browser back/forward navigation
    useEffect(() => {
        const handlePopState = () => {
            setActiveTab(getActiveTabFromUrl());
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Update lists when project data changes
    useEffect(() => {
        if (project.boards?.[0]?.lists) {
            setLists(project.boards[0].lists);
        }
    }, [project.boards]);

    // Cleanup auto-save timeout on unmount
    useEffect(() => {
        return () => {
            if (autoSaveTimeout) {
                clearTimeout(autoSaveTimeout);
            }
        };
    }, [autoSaveTimeout]);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Projects',
            href: route('projects.index'),
        },
        {
            title: project.name,
            href: route('projects.show', { project: project.id }),
        },
    ];

    const handleDeleteMember = () => {
        if (memberToDelete) {
            router.delete(route('projects.members.destroy', { project: project.id, user: memberToDelete.id }));
            setMemberToDelete(null);
        }
    };

    // Section editing handlers
    const handleEditSection = (section: any) => {
        setEditingSection(section);
        setSectionEditModalOpen(true);
    };

    const handleDeleteSection = (section: any) => {
        if (confirm('Are you sure you want to delete this section? All tasks in this section will be moved to "No Section".')) {
            router.delete(route('sections.destroy', { project: project.id, section: section.id }), {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    // Filter boards based on search query and type filter
    const filteredBoards = project.boards?.filter(board => {
        const matchesSearch = board.name.toLowerCase().includes(boardSearchQuery.toLowerCase()) ||
                            (board.description && board.description.toLowerCase().includes(boardSearchQuery.toLowerCase()));
        const matchesType = boardTypeFilter === 'all' || board.type === boardTypeFilter;
        return matchesSearch && matchesType;
    }) || [];

    // Calendar utility functions
    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const generateCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);

        const days = [];

        // Previous month's trailing days
        if (firstDay > 0) {
            const prevMonthYear = month === 0 ? year - 1 : year;
            const prevMonthIndex = month === 0 ? 11 : month - 1;
            const daysInPrevMonth = new Date(prevMonthYear, prevMonthIndex + 1, 0).getDate();

            for (let i = firstDay - 1; i >= 0; i--) {
                days.push({
                    date: new Date(prevMonthYear, prevMonthIndex, daysInPrevMonth - i),
                    isCurrentMonth: false,
                    tasks: []
                });
            }
        }

        // Current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            days.push({
                date,
                isCurrentMonth: true,
                tasks: getTasksForDate(date)
            });
        }

        // Next month's leading days
        const remainingDays = 42 - days.length; // 6 weeks * 7 days
        if (remainingDays > 0) {
            const nextMonthYear = month === 11 ? year + 1 : year;
            const nextMonthIndex = month === 11 ? 0 : month + 1;

            for (let day = 1; day <= remainingDays; day++) {
                days.push({
                    date: new Date(nextMonthYear, nextMonthIndex, day),
                    isCurrentMonth: false,
                    tasks: []
                });
            }
        }

        return days;
    };



    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (direction === 'prev') {
                newDate.setMonth(prev.getMonth() - 1);
            } else {
                newDate.setMonth(prev.getMonth() + 1);
            }
            return newDate;
        });
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const formatMonthYear = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    // Get all tasks from project boards
    const getAllProjectTasks = () => {
        const tasks: any[] = [];
        project.boards?.forEach(board => {
            board.lists?.forEach(list => {
                list.tasks?.forEach(task => {
                    // Apply local updates if they exist
                    const updatedTask = localTaskUpdates[task.id]
                        ? { ...task, ...localTaskUpdates[task.id] }
                        : task;

                    tasks.push({
                        ...updatedTask,
                        boardName: board.name,
                        listName: list.name
                    });
                });
            });
        });
        return tasks;
    };

    // Get tasks for a specific date (only single-day tasks that aren't rendered as strips)
    const getTasksForDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        const allTasks = getAllProjectTasks();
        if (!allTasks || allTasks.length === 0) return [];

        return allTasks.filter(task => {
            if (!task || !task.due_date) return false;

            const taskDueDate = task.due_date.split('T')[0];

            // Only include single-day tasks that aren't already rendered as strips
            // Multi-day tasks and tasks with start_date are rendered as strips
            const isRenderedAsStrip = task.start_date && task.duration_days && task.duration_days >= 1;

            return taskDueDate === dateStr && !isRenderedAsStrip;
        });
    };

    // Get all tasks that should be rendered as continuous strips (now includes all tasks)
    const getAllTasksAsStrips = () => {
        const allTasks = getAllProjectTasks();
        if (!allTasks || allTasks.length === 0) return [];

        return allTasks.filter(task => {
            if (!task || !task.due_date) return false;

            // Ensure all tasks have the required properties for strip rendering
            const hasStartDate = task.start_date;
            const hasDuration = task.duration_days && task.duration_days >= 1;

            // If task doesn't have start_date or duration, set defaults
            if (!hasStartDate) {
                task.start_date = task.due_date;
            }
            if (!hasDuration) {
                task.duration_days = 1;
            }

            return true;
        });
    };

    // Calculate row positions for all tasks to prevent overlapping
    const getAllTasksWithRows = () => {
        const allTasks = getAllTasksAsStrips();
        if (!allTasks.length) return [];



        // Sort tasks by start date, then by duration (longer tasks first for better packing)
        const sortedTasks = [...allTasks].sort((a, b) => {
            const dateA = new Date(a.start_date.split('T')[0]);
            const dateB = new Date(b.start_date.split('T')[0]);
            const dateDiff = dateA.getTime() - dateB.getTime();

            // If same start date, prioritize longer tasks
            if (dateDiff === 0) {
                return (b.duration_days || 1) - (a.duration_days || 1);
            }
            return dateDiff;
        });

        // Track occupied rows for each date
        const occupiedRows: { [dateKey: string]: Set<number> } = {};

        // Assign row positions to tasks
        const tasksWithRows = sortedTasks.map(task => {
            const startDate = new Date(task.start_date.split('T')[0]);
            let endDate: Date;

            // Calculate end date properly
            if (task.due_date) {
                endDate = new Date(task.due_date.split('T')[0]);
            } else if (task.duration_days) {
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + task.duration_days - 1);
            } else {
                endDate = new Date(startDate);
            }



            // Find the first available row for this task's entire duration
            let assignedRow = 0;
            let rowFound = false;

            while (!rowFound && assignedRow < 10) { // Safety limit
                let canUseRow = true;

                // Check if this row is available for the entire task duration
                const currentDate = new Date(startDate);
                while (currentDate <= endDate) {
                    const dateKey = currentDate.toISOString().split('T')[0];

                    if (!occupiedRows[dateKey]) {
                        occupiedRows[dateKey] = new Set();
                    }

                    if (occupiedRows[dateKey].has(assignedRow)) {
                        canUseRow = false;
                        break;
                    }

                    currentDate.setDate(currentDate.getDate() + 1);
                }

                if (canUseRow) {
                    // Mark this row as occupied for the entire task duration
                    const currentDate = new Date(startDate);
                    while (currentDate <= endDate) {
                        const dateKey = currentDate.toISOString().split('T')[0];
                        occupiedRows[dateKey].add(assignedRow);
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                    rowFound = true;

                } else {
                    assignedRow++;
                }
            }

            return {
                ...task,
                taskRow: assignedRow
            };
        });


        return tasksWithRows;
    };

    // Check if a task spans multiple days (now all tasks are treated as strips)
    const isMultiDayTask = (task: any) => {
        return task.duration_days && task.duration_days > 1;
    };

    // Get the position of a date within a multi-day task
    const getTaskDatePosition = (task: any, date: Date) => {
        if (!isMultiDayTask(task)) return 'single';

        const dateStr = date.toISOString().split('T')[0];
        const startDateStr = task.start_date.split('T')[0];
        const endDateStr = task.due_date.split('T')[0];

        if (dateStr === startDateStr) return 'start';
        if (dateStr === endDateStr) return 'end';
        return 'middle';
    };

    // Drag and drop handlers for calendar
    const calendarSensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3,
            },
        }),
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 3,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;

        // Prevent dragging if a resize handle is being used
        if (isAnyHandleResizing) {
            return;
        }

        setIsDragInProgress(true);
        recentDragRef.current = true;

        // Check if dragging a member
        if (active.id.toString().startsWith('member-')) {
            const memberId = active.id.toString().split('-')[1];
            const member = project.members?.find(m => m.id.toString() === memberId);
            setActiveTask({ type: 'member', ...member });
            setDraggedTask({ type: 'member', ...member });
            return;
        }

        let task;
        if (active.id.toString().startsWith('multiday-task-')) {
            // Dragging task strip (both single day and multi-day)
            const taskId = active.id.toString().split('-')[2];
            task = getAllProjectTasks().find(t => t.id.toString() === taskId);
        } else {
            // Dragging from task list
            task = getAllProjectTasks().find(t => t.id.toString() === active.id);
        }


        setActiveTask(task);
        setDraggedTask(task);
    };

    const handleDragCancel = () => {
        setIsDragInProgress(false);
        recentDragRef.current = false;
        setActiveTask(null);
        setDraggedTask(null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        // Always reset drag state with longer delay to prevent click events
        setTimeout(() => {
            setIsDragInProgress(false);
            recentDragRef.current = false;
        }, 300); // Longer delay to prevent click events

        if (!over) {
            setActiveTask(null);
            setDraggedTask(null);
            return;
        }

        // Handle member assignment to tasks
        if (active.id.toString().startsWith('member-')) {
            const memberId = active.id.toString().split('-')[1];
            const member = project.members?.find(m => m.id.toString() === memberId);

            if (!member) {
                setActiveTask(null);
                setDraggedTask(null);
                return;
            }

            // Check if dropped on a task
            let targetTask = null;
            if (over.id.toString().startsWith('multiday-task-drop-')) {
                const taskId = over.id.toString().split('-')[3];
                targetTask = getAllProjectTasks().find(t => t.id.toString() === taskId);
            } else if (over.id.toString().startsWith('side-task-drop-')) {
                const taskId = over.id.toString().split('-')[3];
                targetTask = getAllProjectTasks().find(t => t.id.toString() === taskId);
            } else if (over.id.toString().startsWith('day-task-drop-')) {
                const taskId = over.id.toString().split('-')[3];
                targetTask = getAllProjectTasks().find(t => t.id.toString() === taskId);
            }

            if (targetTask) {
                // Directly assign member to task without modal
                const currentAssignees = targetTask.assignees?.map((a: any) => a.id) || [];
                const newAssignees = currentAssignees.includes(member.id)
                    ? currentAssignees.filter(id => id !== member.id) // Remove if already assigned
                    : [...currentAssignees, member.id]; // Add if not assigned

                // Update task with new assignees
                router.put(route('tasks.update', { project: project.id, task: targetTask.id }), {
                    title: targetTask.title,
                    description: targetTask.description || '',
                    priority: targetTask.priority,
                    status: targetTask.status,
                    estimate: targetTask.estimate,
                    due_date: targetTask.due_date,
                    start_date: targetTask.start_date,
                    duration_days: targetTask.duration_days,
                    list_id: targetTask.list_id,
                    assignee_ids: newAssignees,
                    label_ids: targetTask.labels?.map((l: any) => l.id) || [],
                    is_archived: targetTask.is_archived || false,
                }, {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        console.log(`Successfully ${currentAssignees.includes(member.id) ? 'removed' : 'assigned'} ${member.name} ${currentAssignees.includes(member.id) ? 'from' : 'to'} task: ${targetTask.title}`);
                    },
                    onError: (errors) => {
                        console.error('Failed to assign task:', errors);
                    }
                });
            }

            setActiveTask(null);
            setDraggedTask(null);
            return;
        }

        // Get the task being dragged
        let task = draggedTask;
        let isFromCalendar = false;

        // Check if dragging from calendar
        if (active.id.toString().startsWith('multiday-task-')) {
            const taskId = active.id.toString().split('-')[2];
            task = getAllProjectTasks().find(t => t.id.toString() === taskId);
            isFromCalendar = true;
        }

        if (!task) {
            setActiveTask(null);
            setDraggedTask(null);
            return;
        }

        // Check if dropped on a calendar day
        if (over.id.toString().startsWith('calendar-day-')) {
            const dateStr = over.id.toString().replace('calendar-day-', '');
            const newDueDate = new Date(dateStr).toISOString().split('T')[0];

            setIsUpdatingTask(true);

            // For new tasks (no existing due date), set as single day task
            // For existing tasks, preserve duration if it exists
            let startDate = newDueDate;
            let durationDays = 1;
            let finalDueDate = newDueDate;

            if (task.start_date && task.duration_days) {
                // Preserve existing duration
                durationDays = task.duration_days;
                startDate = newDueDate;

                // Calculate new due date based on duration
                const newStartDate = new Date(startDate);
                const calculatedDueDate = new Date(newStartDate);
                calculatedDueDate.setDate(calculatedDueDate.getDate() + durationDays - 1);
                finalDueDate = calculatedDueDate.toISOString().split('T')[0];
            } else {
                // Simple single-day task
                startDate = newDueDate;
                finalDueDate = newDueDate;
                durationDays = 1;
            }

            // Apply optimistic update immediately for real-time feedback
            setLocalTaskUpdates(prev => ({
                ...prev,
                [task.id]: {
                    start_date: startDate,
                    due_date: finalDueDate,
                    duration_days: durationDays
                }
            }));

            // Send update to server to persist changes
            axios.patch(route('tasks.update-due-date', { project: project.id, task: task.id }), {
                start_date: startDate,
                due_date: finalDueDate,
                duration_days: durationDays
            })
            .then(response => {
                console.log('Task date updated successfully on server');
                setIsUpdatingTask(false);
            })
            .catch(error => {
                console.error('Failed to update task date on server:', error);
                // Revert optimistic update on error
                setLocalTaskUpdates(prev => {
                    const updated = { ...prev };
                    delete updated[task.id];
                    return updated;
                });
                setIsUpdatingTask(false);
            });
        }

        setActiveTask(null);
        setDraggedTask(null);
    };

    // Generate calendar data fresh each render for real-time updates
    const calendarDays = generateCalendarDays();
    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
        weeks.push(calendarDays.slice(i, i + 7));
    }

    // Draggable Member Component
    const DraggableMember = ({ member }: { member: any }) => {
        const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
            id: `member-${member.id}`,
            data: { member, type: 'member' }
        });

        const style = {
            transform: CSS.Translate.toString(transform),
            opacity: isDragging ? 0.5 : 1,
        };

        return (
            <div
                ref={setNodeRef}
                style={style}
                {...listeners}
                {...attributes}
                className={`flex items-center gap-2 p-2 bg-background border rounded-lg cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${isDragging ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
                title={`Drag ${member.name} to assign to tasks`}
            >
                <Avatar className="h-8 w-8 border">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="text-sm font-medium">
                        {member.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">{getShortName(member.name)}</span>
                    <span className="text-xs text-muted-foreground truncate">{member.email}</span>
                </div>
            </div>
        );
    };

    // Draggable Task Component
    const DraggableTask = ({ task }: { task: any }) => {
        const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
            id: task.id.toString(),
            data: { task }
        });

        const { setNodeRef: setDropRef, isOver } = useDroppable({
            id: `side-task-drop-${task.id}`,
            data: { task, type: 'task' }
        });

        const style = {
            transform: CSS.Translate.toString(transform),
            opacity: isDragging ? 0.5 : 1,
        };

        // Combine refs
        const setNodeRef = (node: HTMLElement | null) => {
            setDragRef(node);
            setDropRef(node);
        };

        return (
            <div
                ref={setNodeRef}
                style={style}
                {...listeners}
                {...attributes}
                className={`p-2 border-l-4 rounded-md transition-all duration-150 group relative cursor-grab active:cursor-grabbing hover:shadow-md hover:scale-[1.02] ${getPriorityColor(task.priority)} ${isDragging ? 'ring-2 ring-blue-500 shadow-lg' : ''} ${isOver ? 'ring-2 ring-green-400 bg-green-50 dark:bg-green-950/20' : ''}`}
                title={`Drag to calendar (ID: ${task.id}) - Click and drag me! | Right-click to assign`}
                onClick={(e) => {
                    // Only open modal if not dragging
                    if (!isDragInProgress && !recentDragRef.current) {
                        e.stopPropagation();
                        setSelectedTaskForDetail(task);
                        setTaskDetailModalOpen(true);
                    }
                }}
                onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setTaskToAssign(task);
                    setAssignTaskModalOpen(true);
                }}
            >
                <div className="flex items-start justify-between mb-1 pr-8">
                    <h4 className="font-medium text-xs truncate flex-1">{task.title}</h4>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {task.assignees?.slice(0, 2).map((assignee: any) => (
                            <Avatar key={assignee.id} className="h-4 w-4 border">
                                <AvatarImage src={assignee.avatar} />
                                <AvatarFallback className="text-xs">
                                    {assignee.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        ))}
                        {task.assignees?.length > 2 && (
                            <div className="h-4 w-4 rounded-full bg-muted text-xs flex items-center justify-center">
                                +{task.assignees.length - 2}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pr-8">
                    <span className="truncate flex-1 mr-2">{task.boardName} • {task.listName}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {task.duration_days && task.duration_days > 1 && (
                            <Badge variant="secondary" className="text-xs">
                                {task.duration_days}d
                            </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                            {task.priority}
                        </Badge>
                    </div>
                </div>

                {/* Assignment button */}
                <button
                    className="absolute top-0 right-0 h-full w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-background to-transparent hover:bg-muted/50 rounded-r-md"
                    onClick={(e) => {
                        e.stopPropagation();
                        setTaskToAssign(task);
                        setAssignTaskModalOpen(true);
                    }}
                    title="Assign task"
                >
                    <Users className="h-3 w-3" />
                </button>
            </div>
        );
    };

    // Droppable Calendar Day Component
    const DroppableCalendarDay = ({ day }: { day: any }) => {
        const dropId = `calendar-day-${day.date.toISOString().split('T')[0]}`;
        const { setNodeRef, isOver } = useDroppable({
            id: dropId,
        });



        const dayTasks = getTasksForDate(day.date);

        return (
            <div
                ref={setNodeRef}
                className={`min-h-[140px] p-1 border-r border-b border-border last:border-r-0 transition-all duration-200 overflow-hidden ${
                    !day.isCurrentMonth
                        ? 'bg-muted/20 text-muted-foreground'
                        : 'bg-background hover:bg-muted/30'
                } ${isToday(day.date) ? 'bg-primary/10 border-primary/20' : ''} ${
                    isOver ? 'bg-blue-100 dark:bg-blue-950/30 border-blue-300 border-2 border-dashed' : ''
                }`}
            >
                <div className={`text-sm font-medium mb-1 ${
                    isToday(day.date) ? 'text-primary' : day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                    {day.date.getDate()}
                </div>

                <div className="space-y-0.5 relative">
                    {/* Show small task strips for this day */}
                    {dayTasks.slice(0, 4).map((task, index) => {
                        const { setNodeRef: setTaskDropRef, isOver: isTaskOver } = useDroppable({
                            id: `day-task-drop-${task.id}`,
                            data: { task, type: 'task' }
                        });

                        const taskDropFeedback = isTaskOver && draggedTask?.type === 'member';

                        return (
                            <div
                                key={`day-task-${task.id}-${day.date.toISOString()}`}
                                ref={setTaskDropRef}
                                className={`group relative mb-0.5 rounded-sm border-l-2 cursor-pointer transition-all duration-150 ${getPriorityColor(task.priority)} ${taskDropFeedback ? 'ring-2 ring-green-400 bg-green-50 dark:bg-green-950/20' : ''}`}
                                style={{
                                    height: '16px', // Slightly larger for better visibility
                                    zIndex: 10 + index // Ensure proper stacking
                                }}
                                title={`${task.title} - ${task.priority} priority${task.assignees?.length ? ` | Assigned to: ${task.assignees.map(a => a.name).join(', ')}` : ' | Unassigned'} | Right-click to assign`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isDragInProgress && !recentDragRef.current) {
                                        setSelectedTaskForDetail(task);
                                        setTaskDetailModalOpen(true);
                                    }
                                }}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setTaskToAssign(task);
                                    setAssignTaskModalOpen(true);
                                }}
                            >
                                {/* Main content - always visible */}
                                <div className="flex items-center h-full px-1.5 relative">
                                    <span className="text-xs truncate flex-1 opacity-90">
                                        {task.title}
                                    </span>

                                    {/* Show assignee count if any */}
                                    {task.assignees?.length > 0 && (
                                        <div className="flex items-center gap-0.5 ml-1 flex-shrink-0">
                                            <Users className="h-2 w-2 opacity-60" />
                                            <span className="text-xs opacity-60">{task.assignees.length}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {dayTasks.length > 4 && (
                        <div className="text-xs text-muted-foreground opacity-60 px-1">
                            +{dayTasks.length - 4} more
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Task Strip Component (handles both single day and multi-day tasks)
    const MultiDayTaskStrip = ({ task, calendarDays }: { task: any; calendarDays: any[] }) => {
        // Use local updates if available for real-time feedback, but preserve taskRow
        const localUpdate = localTaskUpdates[task.id] || {};
        const currentTask = {
            ...task,
            ...localUpdate,
            // Preserve taskRow from original task assignment
            taskRow: task.taskRow
        };



        // Safety checks - ensure we have valid data
        if (!currentTask || !currentTask.start_date || !currentTask.due_date || !calendarDays || calendarDays.length === 0) {
            return null;
        }

        // Ensure dates are valid
        const startDateStr = currentTask.start_date.split('T')[0];
        const dueDateStr = currentTask.due_date.split('T')[0];
        if (!startDateStr || !dueDateStr) {
            return null;
        }

        const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
            id: `multiday-task-${currentTask.id}`,
            data: { task: currentTask, source: 'calendar' }
        });

        const { setNodeRef: setDropRef, isOver } = useDroppable({
            id: `multiday-task-drop-${currentTask.id}`,
            data: { task: currentTask, type: 'task' }
        });

        // Show visual feedback when member is being dragged over
        const showDropFeedback = isOver && draggedTask?.type === 'member';

        const style = {
            transform: CSS.Translate.toString(transform),
            opacity: isDragging ? 0.5 : 1,
        };

        // Combine refs for the first segment only
        const setNodeRef = (node: HTMLElement | null) => {
            setDragRef(node);
            setDropRef(node);
        };

        // Calculate task position and span using validated date strings
        const startDate = new Date(startDateStr);
        const endDate = new Date(dueDateStr);

        // Validate the date objects
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return null;
        }

        // Find start and end positions in the calendar grid
        const startDayIndex = calendarDays.findIndex(day =>
            day.date.toISOString().split('T')[0] === startDateStr
        );
        const endDayIndex = calendarDays.findIndex(day =>
            day.date.toISOString().split('T')[0] === dueDateStr
        );

        if (startDayIndex === -1 || endDayIndex === -1) return null;

        // Calculate grid position
        const startRow = Math.floor(startDayIndex / 7);
        const startCol = startDayIndex % 7;
        const endRow = Math.floor(endDayIndex / 7);
        const endCol = endDayIndex % 7;

        // Handle tasks that span multiple weeks
        const taskSegments = [];
        let currentRow = startRow;
        let currentStartCol = startCol;

        while (currentRow <= endRow) {
            const isLastRow = currentRow === endRow;
            const segmentEndCol = isLastRow ? endCol : 6;
            const segmentSpan = segmentEndCol - currentStartCol + 1;

            taskSegments.push({
                row: currentRow,
                startCol: currentStartCol,
                span: segmentSpan,
                isFirst: currentRow === startRow,
                isLast: isLastRow
            });

            currentRow++;
            currentStartCol = 0;
        }

        return (
            <>
                {taskSegments.map((segment, index) => (
                    <div
                        key={`${currentTask.id}-segment-${index}-${currentTask.start_date}-${currentTask.due_date}`}
                        ref={index === 0 ? setNodeRef : undefined}
                        className={`group absolute h-6 ${getPriorityColor(currentTask.priority)} border-l-2 text-xs flex items-center cursor-grab active:cursor-grabbing transition-all duration-150 ease-out shadow-sm ${
                            segment.isFirst && segment.isLast ? 'rounded' :
                            segment.isFirst ? 'rounded-l' :
                            segment.isLast ? 'rounded-r' : ''
                        } ${isDragging ? 'ring-2 ring-blue-400 shadow-lg scale-105' : 'hover:shadow-md hover:z-30'} ${showDropFeedback && segment.isFirst ? 'ring-2 ring-green-400 bg-green-50 dark:bg-green-950/20' : ''}`}
                        style={{
                            top: `${segment.row * 140 + 40 + (currentTask.taskRow || 0) * 22}px`, // Updated for new calendar height
                            left: `calc(${(segment.startCol / 7) * 100}% + 4px)`, // Add padding from left edge
                            width: `calc(${(segment.span / 7) * 100}% - 8px)`, // Reduce width to add padding on both sides
                            ...(index === 0 ? style : {}),
                            zIndex: 20 + (currentTask.taskRow || 0) // Ensure proper layering
                        }}
                        {...(index === 0 ? { ...listeners, ...attributes } : {})}
                        onClick={(e) => {
                            if (!isDragging && !isDragInProgress && !recentDragRef.current && !(e.target as HTMLElement).closest('.resize-handle')) {
                                setSelectedTaskForDetail(task);
                                setTaskDetailModalOpen(true);
                            }
                        }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setTaskToAssign(currentTask);
                            setAssignTaskModalOpen(true);
                        }}
                        title={`${currentTask.title} - ${currentTask.priority} priority (${currentTask.duration_days}d) | ${currentTask.assignees?.length ? `Assigned to: ${currentTask.assignees.map(a => a.name).join(', ')}` : 'Unassigned'} | Drag to move, resize handles to extend/shrink | Right-click to assign`}
                    >
                        {/* Task content - only show on first segment */}
                        {segment.isFirst && (
                            <div className="flex items-center gap-1 flex-1 min-w-0 px-2 pr-8">
                                {/* Basic view - always visible */}
                                <div className="flex items-center gap-1 flex-1 min-w-0 group-hover:hidden">
                                    <span className="font-medium truncate text-xs">
                                        {currentTask.title}
                                    </span>
                                    {currentTask.duration_days > 1 && (
                                        <span className="text-xs opacity-60">({currentTask.duration_days}d)</span>
                                    )}
                                </div>

                                {/* Hover view - shows assignee info */}
                                <div className="hidden group-hover:flex items-center gap-1 flex-1 min-w-0">
                                    {currentTask.assignees?.[0] && (
                                        <Avatar className="h-4 w-4 flex-shrink-0 border border-white/20">
                                            <AvatarImage src={currentTask.assignees[0].avatar} />
                                            <AvatarFallback className="text-xs font-medium">
                                                {currentTask.assignees[0].name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate text-xs">
                                            {currentTask.title}
                                        </div>
                                    </div>
                                    <div className="text-xs opacity-75 flex items-center gap-1 flex-shrink-0">
                                        {currentTask.duration_days > 1 && <span>{currentTask.duration_days}d</span>}
                                        {currentTask.assignees?.length > 1 && (
                                            <span>+{currentTask.assignees.length - 1}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Show assignee indicator on first segment */}
                        {segment.isFirst && currentTask.assignees?.length > 0 && (
                            <div className="absolute right-1 top-1 flex items-center gap-0.5 opacity-80">
                                <Users className="h-2.5 w-2.5" />
                                <span className="text-xs">{currentTask.assignees.length}</span>
                            </div>
                        )}

                        {/* Resize handles - only on first and last segments */}
                        {segment.isFirst && (
                            <ResizeHandle
                                task={currentTask}
                                direction="start"
                                onResize={(newDuration) => handleTaskResize(task, newDuration)}
                            />
                        )}
                        {segment.isLast && (
                            <ResizeHandle
                                task={currentTask}
                                direction="end"
                                onResize={(newDuration) => handleTaskResize(task, newDuration)}
                            />
                        )}
                    </div>
                ))}
            </>
        );
    };

    // Task Assignment Modal Component
    const TaskAssignmentModal = ({ task, project, open, onOpenChange }: {
        task: any;
        project: Project;
        open: boolean;
        onOpenChange: (open: boolean) => void;
    }) => {
        const [selectedAssignees, setSelectedAssignees] = useState<number[]>([]);
        const [isAssigning, setIsAssigning] = useState(false);

        // Initialize selected assignees when task changes
        useEffect(() => {
            if (task) {
                setSelectedAssignees(task.assignees?.map((a: any) => a.id) || []);
            }
        }, [task]);

        const handleAssign = () => {
            if (!task) return;

            setIsAssigning(true);

            // Use Inertia router for task updates to handle redirects properly
            router.put(route('tasks.update', { project: project.id, task: task.id }), {
                title: task.title,
                description: task.description || '',
                priority: task.priority,
                status: task.status,
                estimate: task.estimate,
                due_date: task.due_date,
                start_date: task.start_date,
                duration_days: task.duration_days,
                list_id: task.list_id,
                assignee_ids: selectedAssignees,
                label_ids: task.labels?.map((l: any) => l.id) || [],
                is_archived: task.is_archived || false,
            }, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    onOpenChange(false);
                    // Page will reload automatically with updated data
                },
                onError: (errors) => {
                    console.error('Failed to assign task:', errors);
                },
                onFinish: () => {
                    setIsAssigning(false);
                }
            });
        };

        const toggleAssignee = (userId: number) => {
            setSelectedAssignees(prev =>
                prev.includes(userId)
                    ? prev.filter(id => id !== userId)
                    : [...prev, userId]
            );
        };

        const allMembers = [
            ...(project.members || []),
            ...(project.owner ? [project.owner] : [])
        ].filter((member, index, self) =>
            index === self.findIndex(m => m.id === member.id)
        );

        return (
            <div className={`fixed inset-0 z-50 ${open ? 'block' : 'hidden'}`}>
                <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
                <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Assign Task
                            </CardTitle>
                            <CardDescription>
                                {task?.title}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Select assignees:</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedAssignees([])}
                                    disabled={selectedAssignees.length === 0}
                                >
                                    Clear All
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {allMembers.map((member) => (
                                    <div
                                        key={member.id}
                                        className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                                            selectedAssignees.includes(member.id)
                                                ? 'bg-primary/10 border-primary'
                                                : 'hover:bg-muted/50'
                                        }`}
                                        onClick={() => toggleAssignee(member.id)}
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={member.avatar} />
                                            <AvatarFallback>
                                                {member.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="font-medium">{getShortName(member.name)}</div>
                                            <div className="text-sm text-muted-foreground">{member.email}</div>
                                        </div>
                                        {selectedAssignees.includes(member.id) && (
                                            <CheckCircle2 className="h-5 w-5 text-primary" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isAssigning}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAssign}
                                disabled={isAssigning}
                            >
                                {isAssigning ? 'Assigning...' : 'Assign'}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        );
    };

    // Task Duration Extension Modal Component
    const TaskDurationModal = ({ task, project, open, onOpenChange }: {
        task: any;
        project: Project;
        open: boolean;
        onOpenChange: (open: boolean) => void;
    }) => {
        const [newDuration, setNewDuration] = useState(1);
        const [isUpdating, setIsUpdating] = useState(false);

        // Initialize duration when task changes
        useEffect(() => {
            if (task) {
                setNewDuration(task.duration_days || 1);
            }
        }, [task]);

        const handleUpdateDuration = async () => {
            if (!task) return;

            setIsUpdating(true);

            try {
                // Calculate new due date based on start date and duration
                const startDate = task.start_date ? new Date(task.start_date.split('T')[0]) : new Date(task.due_date.split('T')[0]);
                const newDueDate = new Date(startDate);
                newDueDate.setDate(newDueDate.getDate() + newDuration - 1);

                // Temporarily disable server updates to prevent infinite loop
                console.log('Task duration update completed locally - server update disabled to prevent infinite loop');
                onOpenChange(false);
            } catch (error) {
                console.error('Error updating task duration:', error);
            } finally {
                setIsUpdating(false);
            }
        };

        return (
            <div className={`fixed inset-0 z-50 ${open ? 'block' : 'hidden'}`}>
                <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
                <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Set Task Duration
                            </CardTitle>
                            <CardDescription>
                                {task?.title}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Duration (days)</label>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setNewDuration(Math.max(1, newDuration - 1))}
                                        disabled={newDuration <= 1}
                                    >
                                        -
                                    </Button>
                                    <input
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={newDuration}
                                        onChange={(e) => setNewDuration(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-20 text-center border rounded px-2 py-1"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setNewDuration(newDuration + 1)}
                                        disabled={newDuration >= 365}
                                    >
                                        +
                                    </Button>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {task && (
                                        <>
                                            Start: {task.start_date ? new Date(task.start_date).toLocaleDateString() : new Date(task.due_date).toLocaleDateString()}
                                            <br />
                                            End: {(() => {
                                                const startDate = task.start_date ? new Date(task.start_date.split('T')[0]) : new Date(task.due_date.split('T')[0]);
                                                const endDate = new Date(startDate);
                                                endDate.setDate(endDate.getDate() + newDuration - 1);
                                                return endDate.toLocaleDateString();
                                            })()}
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isUpdating}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdateDuration}
                                disabled={isUpdating}
                            >
                                {isUpdating ? 'Updating...' : 'Update Duration'}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        );
    };

    // Task Detail Modal Component
    const TaskDetailModal = ({ task, project, open, onOpenChange }: {
        task: any;
        project: Project;
        open: boolean;
        onOpenChange: (open: boolean) => void;
    }) => {
        if (!task) return null;

        return (
            <div className={`fixed inset-0 z-50 ${open ? 'block' : 'hidden'}`}>
                <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
                <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="text-xl">{task.title}</CardTitle>
                                    <CardDescription className="mt-2">
                                        {task.project?.name || 'Inbox'} • {task.boardName} • {task.listName}
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onOpenChange(false)}
                                    className="h-8 w-8 p-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Task Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Priority</label>
                                    <Badge variant="outline" className={`mt-1 ${getPriorityColor(task.priority)}`}>
                                        {task.priority}
                                    </Badge>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                                    <Badge variant="outline" className="mt-1 capitalize">
                                        {task.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                                {task.due_date && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                                        <p className="mt-1 text-sm">{new Date(task.due_date).toLocaleDateString()}</p>
                                    </div>
                                )}
                                {task.duration_days && task.duration_days > 1 && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Duration</label>
                                        <p className="mt-1 text-sm">{task.duration_days} days</p>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            {task.description && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                                    <p className="mt-1 text-sm whitespace-pre-wrap">{task.description}</p>
                                </div>
                            )}

                            {/* Assignees */}
                            {task.assignees && task.assignees.length > 0 && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Assignees</label>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {task.assignees.map((assignee: any) => (
                                            <div key={assignee.id} className="flex items-center gap-2 bg-muted rounded-lg p-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={assignee.avatar} />
                                                    <AvatarFallback className="text-xs">
                                                        {assignee.name.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm">{assignee.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button
                                onClick={() => onOpenChange(false)}
                            >
                                Close
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        );
    };

    // Enhanced Resize Handle Component with colored edges
    const ResizeHandle = ({ task, direction, onResize }: { task: any; direction: 'start' | 'end'; onResize: (newDuration: number) => void }) => {
        const [isResizing, setIsResizing] = useState(false);

        const handleMouseDown = (e: React.MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            e.nativeEvent.stopImmediatePropagation();

            console.log(`Starting resize: direction=${direction}, currentDuration=${task.duration_days}`);

            const startXPos = e.clientX;
            const originalDur = task.duration_days || 1;

            setIsResizing(true);
            setIsAnyHandleResizing(true);

            // Create handlers with captured values
            const mouseMoveHandler = (e: MouseEvent) => {
                const deltaX = e.clientX - startXPos;
                const dayWidth = 120; // Updated for smaller calendar
                const daysDelta = Math.round(deltaX / dayWidth);

                let newDuration = originalDur;
                if (direction === 'end') {
                    // For end handle: positive delta = extend, negative delta = shrink
                    newDuration = Math.max(1, originalDur + daysDelta);
                } else {
                    // For start handle: negative delta = extend backward, positive delta = shrink from start
                    newDuration = Math.max(1, originalDur - daysDelta);
                }

                if (newDuration !== originalDur) {
                    console.log(`Mouse move: ${originalDur} -> ${newDuration} (delta: ${daysDelta}, direction: ${direction})`);
                    onResize(newDuration);
                }
            };

            const mouseUpHandler = (e: MouseEvent) => {
                const deltaX = e.clientX - startXPos;
                const dayWidth = 120; // Updated for smaller calendar
                const daysDelta = Math.round(deltaX / dayWidth);

                let newDuration = originalDur;
                if (direction === 'end') {
                    // For end handle: positive delta = extend, negative delta = shrink
                    newDuration = Math.max(1, originalDur + daysDelta);
                } else {
                    // For start handle: negative delta = extend backward, positive delta = shrink from start
                    newDuration = Math.max(1, originalDur - daysDelta);
                }

                if (newDuration !== originalDur) {
                    console.log(`Resize complete: ${originalDur} -> ${newDuration} days (direction: ${direction})`);
                    onResize(newDuration);
                }

                setIsResizing(false);
                setIsAnyHandleResizing(false);
                document.removeEventListener('mousemove', mouseMoveHandler);
                document.removeEventListener('mouseup', mouseUpHandler);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            };

            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        };



        // Get priority-based colors for the resize handles - clean and simple
        const getHandleColor = (priority: string) => {
            switch (priority) {
                case 'urgent': return 'bg-red-500/90 hover:bg-red-500';
                case 'high': return 'bg-orange-500/90 hover:bg-orange-500';
                case 'medium': return 'bg-yellow-500/90 hover:bg-yellow-500';
                case 'low': return 'bg-green-500/90 hover:bg-green-500';
                default: return 'bg-blue-500/90 hover:bg-blue-500';
            }
        };

        return (
            <div
                className={`resize-handle absolute ${direction === 'start' ? 'left-0' : 'right-0'} top-0 bottom-0 w-2 cursor-col-resize transition-all duration-200 ease-out ${isResizing ? 'opacity-100 bg-white/40' : 'opacity-0 group-hover:opacity-60 hover:bg-white/20'} ${direction === 'start' ? 'rounded-l' : 'rounded-r'}`}
                onMouseDown={handleMouseDown}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                title={`Drag to ${direction === 'start' ? 'move start date' : 'extend/shrink duration'}`}
                style={{
                    zIndex: 25,
                }}
            >
                {/* Visual indicator - only visible when active */}
                {isResizing && (
                    <div className={`absolute inset-0 ${direction === 'start' ? 'rounded-l' : 'rounded-r'} overflow-hidden`}>
                        <div className="absolute inset-0 bg-white/20"></div>
                        <div className="absolute inset-y-2 left-1/2 transform -translate-x-1/2 w-px bg-white/80"></div>
                    </div>
                )}
            </div>
        );
    };

    // Handle task resize
    const handleTaskResize = async (task: any, newDuration: number) => {
        console.log(`handleTaskResize called: task ${task.id}, newDuration: ${newDuration}`);

        // Get current task data (including any local updates)
        const currentTask = { ...task, ...(localTaskUpdates[task.id] || {}) };

        if (newDuration === currentTask.duration_days) {
            console.log('Duration unchanged, skipping update');
            return;
        }

        // Calculate new dates based on the current task
        const startDate = currentTask.start_date ? new Date(currentTask.start_date.split('T')[0]) : new Date(currentTask.due_date.split('T')[0]);
        const newDueDate = new Date(startDate);
        newDueDate.setDate(newDueDate.getDate() + newDuration - 1);

        console.log(`Updating task ${task.id}: ${currentTask.duration_days}d -> ${newDuration}d`);
        console.log(`New dates: ${startDate.toISOString().split('T')[0]} to ${newDueDate.toISOString().split('T')[0]}`);

        // Apply optimistic update immediately for real-time feedback
        setLocalTaskUpdates(prev => ({
            ...prev,
            [task.id]: {
                ...prev[task.id],
                start_date: startDate.toISOString().split('T')[0],
                due_date: newDueDate.toISOString().split('T')[0],
                duration_days: newDuration
            }
        }));

        // Send update to server to persist changes
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            await axios.patch(route('tasks.update-due-date', { project: project.id, task: task.id }), {
                start_date: startDate.toISOString().split('T')[0],
                due_date: newDueDate.toISOString().split('T')[0],
                duration_days: newDuration
            }, {
                headers: {
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });
            console.log('Task duration updated successfully on server');
        } catch (error) {
            console.error('Failed to update task duration on server:', error);
            // Revert optimistic update on error
            setLocalTaskUpdates(prev => {
                const updated = { ...prev };
                if (updated[task.id]) {
                    // Restore original values
                    updated[task.id] = {
                        ...updated[task.id],
                        start_date: currentTask.start_date,
                        due_date: currentTask.due_date,
                        duration_days: currentTask.duration_days
                    };
                }
                return updated;
            });
        }
    };



    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={project.name} />
            <div className="space-y-6">
                <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                            {project.background_color && (
                                <div
                                    className="w-12 h-12 rounded-xl shadow-sm border"
                                    style={{ backgroundColor: project.background_color }}
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <h1 className="text-3xl font-bold flex flex-wrap items-center gap-2 break-words">
                                    <span className="break-words">{project.name}</span>
                                </h1>
                                <div className="flex items-center gap-3 mt-1">
                                    {project.is_public ? (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Globe className="h-4 w-4" />
                                            <span>Public</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Shield className="h-4 w-4" />
                                            <span>Private</span>
                                        </div>
                                    )}
                                    {project.is_archived && (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Archive className="h-4 w-4" />
                                            <span>Archived</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Crown className="h-4 w-4" />
                                        <span>Owner: {getShortName(project.owner?.name || '')}</span>
                                    </div>
                                </div>
                            </div>
                            {canEdit ? (
                                <Link href={route('projects.edit', { project: project.id })}>
                                    <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md">
                                        <Settings className="h-4 w-4 mr-2" />
                                        Settings
                                    </Button>
                                </Link>
                            ) : (
                                <Button variant="outline" size="sm" disabled className="shadow-sm">
                                    <Lock className="h-4 w-4 mr-2" />
                                    Settings
                                </Button>
                            )}
                        </div>
                        {project.description && (
                            <p className="text-muted-foreground mt-2 text-base leading-relaxed">
                                {project.description}
                            </p>
                        )}

                        {/* Members Preview */}
                        {project.members && project.members.length > 1 && (
                            <div className="flex items-center gap-2 mt-3">
                                <div className="flex -space-x-2">
                                    {project.members.slice(1, 6).map((member) => (
                                        <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                                            <AvatarImage src={member.avatar} />
                                            <AvatarFallback className="text-xs">
                                                {member.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    ))}
                                    {project.members.length > 6 && (
                                        <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                                            <span className="text-xs text-muted-foreground">
                                                +{project.members.length - 6}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {project.members.length - 1} other member{project.members.length - 1 !== 1 ? 's' : ''}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Project Tabs */}
                <div className="w-full">
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-6 h-12 p-1 bg-muted/50 rounded-b-none border-b-0">
                        <TabsTrigger
                            value="list"
                            className="flex items-center gap-2 h-10 data-[state=active]:bg-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-teal-50 dark:hover:bg-teal-950/50"
                        >
                            <Menu className="h-4 w-4" />
                            <span className="font-medium">List</span>
                            {project.boards && project.boards[0]?.lists && (
                                <Badge variant="secondary" className="ml-1 text-xs">
                                    {project.boards[0].lists.reduce((acc, list) => acc + (list.tasks?.length || 0), 0)}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="boards"
                            className="flex items-center gap-2 h-10 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-blue-50 dark:hover:bg-blue-950/50"
                        >
                            <ListTodo className="h-4 w-4" />
                            <span className="font-medium">Board</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="calendar"
                            className="flex items-center gap-2 h-10 data-[state=active]:bg-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                        >
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">Calendar</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="members"
                            className="flex items-center gap-2 h-10 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-green-50 dark:hover:bg-green-950/50"
                        >
                            <Users className="h-4 w-4" />
                            <span className="font-medium">Members</span>
                            <Badge variant="secondary" className="ml-1 text-xs">
                                {project.members?.length || 0}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger
                            value="labels"
                            className="flex items-center gap-2 h-10 data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-purple-50 dark:hover:bg-purple-950/50"
                        >
                            <Tag className="h-4 w-4" />
                            <span className="font-medium">Labels</span>
                            <Badge variant="secondary" className="ml-1 text-xs">
                                {project.labels?.length || 0}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger
                            value="details"
                            className="flex items-center gap-2 h-10 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-orange-50 dark:hover:bg-orange-950/50"
                        >
                            <Settings className="h-4 w-4" />
                            <span className="font-medium">Details</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="list" className="mt-0">
                        <div className="flex h-[calc(100vh-200px)]">
                            {/* Main List Content */}
                            <div className={`flex-1 ${inspectorOpen ? 'mr-0' : ''}`}>
                                <Card className="rounded-t-none border-t-0 h-full">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Menu className="h-5 w-5" />
                                                    Task List
                                                </CardTitle>
                                                <CardDescription>
                                                    Hierarchical outline view with inspector panel
                                                </CardDescription>
                                            </div>

                                            {/* View Mode Toggle and Actions */}
                                            <div className="flex items-center gap-2">
                                                {project.can_manage_tasks && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            router.get(route('tasks.create', {
                                                                project: project.id,
                                                                board: project.boards[0].id,
                                                                list: project.boards[0].lists[0].id,
                                                                tab: 'list'
                                                            }));
                                                        }}
                                                    >
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Add Task
                                                    </Button>
                                                )}
                                                <Separator orientation="vertical" className="h-6" />
                                                <Button
                                                    variant={listViewMode === 'sections' ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setListViewMode('sections')}
                                                >
                                                    <Layers className="h-4 w-4 mr-2" />
                                                    Sections
                                                </Button>
                                                <Button
                                                    variant={listViewMode === 'status' ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setListViewMode('status')}
                                                >
                                                    <ListTodo className="h-4 w-4 mr-2" />
                                                    Status
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1 overflow-y-auto">
                                        {project.boards && project.boards.length > 0 ? (
                                            <DndContext
                                                sensors={sensors}
                                                collisionDetection={closestCenter}
                                                onDragStart={handleListDragStart}
                                                onDragEnd={handleListDragEnd}
                                                modifiers={[restrictToWindowEdges]}
                                            >
                                                <div className="space-y-4">
                                                    {getOrganizedTasks().map((section) => {
                                                        // Create droppable section component
                                                        const DroppableSection = () => {
                                                            const { setNodeRef, isOver } = useDroppable({
                                                                id: `list-section-${section.id}`,
                                                                data: {
                                                                    type: 'section',
                                                                    section,
                                                                    sectionId: section.id
                                                                }
                                                            });

                                                            return (
                                                                <div
                                                                    ref={setNodeRef}
                                                                    className={`space-y-3 ${isOver ? 'bg-blue-50 dark:bg-blue-950/20 rounded-lg p-2' : ''}`}
                                                                >
                                                                    {/* Section Header */}
                                                                    <div className="flex items-center gap-3 pb-2 border-b">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-6 w-6 p-0"
                                                                            onClick={() => toggleSectionCollapse(section.id)}
                                                                        >
                                                                            {collapsedSections.has(section.id) ?
                                                                                <ChevronRight className="h-4 w-4" /> :
                                                                                <ChevronDown className="h-4 w-4" />
                                                                            }
                                                                        </Button>

                                                                        <div className="flex items-center gap-2">
                                                                            {section.color && (
                                                                                <div
                                                                                    className="w-3 h-3 rounded-full"
                                                                                    style={{ backgroundColor: section.color }}
                                                                                />
                                                                            )}
                                                                            <h3 className="text-lg font-semibold">{section.name}</h3>
                                                                        </div>

                                                                        <Badge variant="secondary" className="text-xs">
                                                                            {section.tasks?.length || 0} tasks
                                                                        </Badge>

                                                                        {/* Section Actions */}
                                                                        {project.can_manage_tasks && section.type === 'section' && (
                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger asChild>
                                                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                                    </Button>
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuContent align="end">
                                                                                    <DropdownMenuItem onClick={() => {
                                                                                        router.get(route('tasks.create', {
                                                                                            project: project.id,
                                                                                            board: project.boards[0].id,
                                                                                            list: section.id,
                                                                                            tab: 'list'
                                                                                        }));
                                                                                    }}>
                                                                                        <Plus className="h-4 w-4 mr-2" />
                                                                                        Add Task
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem onClick={() => handleEditSection(section)}>
                                                                                        <Edit className="h-4 w-4 mr-2" />
                                                                                        Edit Section
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuSeparator />
                                                                                    <DropdownMenuItem
                                                                                        className="text-destructive"
                                                                                        onClick={() => handleDeleteSection(section)}
                                                                                    >
                                                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                                                        Delete Section
                                                                                    </DropdownMenuItem>
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>
                                                                        )}
                                                                    </div>

                                                                    {/* Tasks in this section */}
                                                                    {!collapsedSections.has(section.id) && (
                                                                        <div className="space-y-2">
                                                                            {section.tasks && section.tasks.length > 0 ? (
                                                                                <SortableContext
                                                                                    items={section.tasks.map(task => `list-task-${task.id}`)}
                                                                                    strategy={verticalListSortingStrategy}
                                                                                >
                                                                                    {section.tasks.map((task) => (
                                                                                        <ListTaskItem key={task.id} task={task} sectionId={section.id} />
                                                                                    ))}
                                                                                </SortableContext>
                                                                            ) : (
                                                                                <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
                                                                                    <ListTodo className="h-8 w-8 mx-auto mb-2" />
                                                                                    <p>No tasks in this section</p>
                                                                                    {project.can_manage_tasks && (
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            className="mt-2"
                                                                                            onClick={() => {
                                                                                                if (section.type === 'section') {
                                                                                                    router.get(route('tasks.create', {
                                                                                                        project: project.id,
                                                                                                        board: project.boards[0].id,
                                                                                                        list: section.id,
                                                                                                        tab: 'list'
                                                                                                    }));
                                                                                                } else {
                                                                                                    // For status-based sections, use the first available list
                                                                                                    const firstList = project.boards[0]?.lists?.[0];
                                                                                                    if (firstList) {
                                                                                                        router.get(route('tasks.create', {
                                                                                                            project: project.id,
                                                                                                            board: project.boards[0].id,
                                                                                                            list: firstList.id,
                                                                                                            status: section.id,
                                                                                                            tab: 'list'
                                                                                                        }));
                                                                                                    }
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            <Plus className="h-4 w-4 mr-2" />
                                                                                            Add Task
                                                                                        </Button>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                            };

                                            return <DroppableSection key={section.id} />;
                                        })}
                                </div>

                                {/* Drag overlay for visual feedback */}
                                <DragOverlay>
                                    {listActiveId && listActiveItem?.type === 'task' && listActiveItem.task && (
                                        <div className="p-3 border-l-4 rounded-lg shadow-lg opacity-80 border-2 border-primary bg-background">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="font-medium">{listActiveItem.task.title}</div>
                                                    {listActiveItem.task.status === 'done' && (
                                                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                    )}
                                                </div>
                                                {listActiveItem.task.description && (
                                                    <div className="text-sm text-muted-foreground line-clamp-2">
                                                        {listActiveItem.task.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </DragOverlay>
                            </DndContext>
                        ) : (
                            <div className="text-center py-16 bg-gradient-to-br from-muted/20 to-muted/40 rounded-xl border-2 border-dashed border-muted-foreground/30">
                                <div className="w-20 h-20 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Menu className="h-10 w-10 text-teal-600" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">No Tasks Available</h3>
                                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                                    This project doesn't have any tasks yet. Create your first task to see the hierarchical list view.
                                </p>
                            </div>
                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Inspector Panel */}
                            {inspectorOpen && (
                                <TaskInspector
                                    inspectorTask={inspectorTask}
                                    onClose={closeInspector}
                                    project={project}
                                />
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="boards" className="mt-0">
                        <Card className="rounded-t-none border-t-0">
                            <CardHeader className="pb-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <ListTodo className="h-5 w-5" />
                                        Board
                                    </CardTitle>
                                    <CardDescription>
                                        Organize and manage your tasks
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {project.boards && project.boards.length > 0 ? (
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragStart={handleBoardDragStart}
                                        onDragEnd={handleBoardDragEnd}
                                        modifiers={[restrictToWindowEdges]}
                                    >
                                        <div className="flex gap-4 overflow-x-auto pb-4 w-full pr-4">
                                            <SortableContext
                                                items={lists.map(list => `list-${list.id}`)}
                                                strategy={horizontalListSortingStrategy}
                                            >
                                                {lists.map((list) => (
                                                    <SortableList key={list.id} list={list}>
                                                        <SortableContext
                                                            items={(list.tasks || []).map(task => `task-${task.id}`)}
                                                            strategy={verticalListSortingStrategy}
                                                        >
                                                            {list.tasks && list.tasks.length > 0 ? (
                                                                list.tasks.map((task) => (
                                                                    <SortableTask key={task.id} task={task} />
                                                                ))
                                                            ) : (
                                                                <div className="text-center py-8 text-muted-foreground text-sm">
                                                                    No tasks yet. Click "Add Task" to create one.
                                                                </div>
                                                            )}
                                                        </SortableContext>
                                                    </SortableList>
                                                ))}
                                            </SortableContext>
                                        </div>

                                        {/* Drag overlay for visual feedback */}
                                        <DragOverlay>
                                            {activeId && activeItem?.type === 'task' && activeItem.task && (
                                                <div className="mb-2 rounded-md border bg-card p-3 shadow-sm opacity-80 border-2 border-primary">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="font-medium">{activeItem.task.title}</div>
                                                            {activeItem.task.status === 'done' && (
                                                                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                            )}
                                                        </div>
                                                        {activeItem.task.description && (
                                                            <div className="text-sm text-muted-foreground line-clamp-2">
                                                                {activeItem.task.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </DragOverlay>
                                    </DndContext>
                                ) : (
                                    <div className="text-center py-16 bg-gradient-to-br from-muted/20 to-muted/40 rounded-xl border-2 border-dashed border-muted-foreground/30">
                                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <ListTodo className="h-10 w-10 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-3">No Board Available</h3>
                                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                                            This project doesn't have a board yet. A board will be automatically created when you create your first task.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="calendar" className="mt-0">
                        <DndContext
                            sensors={calendarSensors}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onDragCancel={handleDragCancel}
                        >
                            <Card className="rounded-t-none border-t-0">
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Calendar className="h-5 w-5" />
                                                Project Calendar
                                            </CardTitle>
                                            <CardDescription>
                                                Drag tasks from the list to calendar days to set deadlines
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Team Members Panel Toggle */}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setMemberPanelOpen(!memberPanelOpen)}
                                                className="flex items-center gap-2"
                                            >
                                                <Users className="h-4 w-4" />
                                                <span className="hidden sm:inline">Team</span>
                                                {memberPanelOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </Button>

                                            <Separator orientation="vertical" className="h-6" />

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigateMonth('prev')}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentDate(new Date())}
                                            >
                                                Today
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigateMonth('next')}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="text-center text-lg font-semibold text-primary">
                                        {formatMonthYear(currentDate)}
                                    </div>

                                    {/* Collapsible Team Members Panel */}
                                    {memberPanelOpen && (
                                        <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
                                            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                                <Users className="h-4 w-4" />
                                                Team Members - Drag to assign tasks
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {project.members?.map((member) => (
                                                    <DraggableMember key={member.id} member={member} />
                                                ))}
                                                {(!project.members || project.members.length === 0) && (
                                                    <div className="text-sm text-muted-foreground">
                                                        No team members in this project
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                        {/* Task List - Left Side */}
                                        <div className="lg:col-span-1">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-lg flex items-center gap-2">
                                                        Project Tasks
                                                        {isUpdatingTask && (
                                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                                        )}

                                                    </CardTitle>
                                                    <CardDescription>
                                                        Drag tasks to calendar days to set deadlines
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                                        {(() => {
                                                            const allTasks = getAllProjectTasks();
                                                            const tasksWithoutDueDate = allTasks.filter(task => !task.due_date);
                                                            const tasksWithDueDate = allTasks.filter(task => task.due_date);

                                                            if (allTasks.length === 0) {
                                                                return (
                                                                    <div className="text-center py-8 text-muted-foreground">
                                                                        <ListTodo className="h-8 w-8 mx-auto mb-2" />
                                                                        <p>No tasks in this project</p>
                                                                    </div>
                                                                );
                                                            }

                                                            return (
                                                                <div className="space-y-3">
                                                                    {/* Tasks without due dates */}
                                                                    {tasksWithoutDueDate.length > 0 && (
                                                                        <div>
                                                                            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                                                                <Clock className="h-4 w-4" />
                                                                                Unscheduled ({tasksWithoutDueDate.length})
                                                                            </h4>
                                                                            <div className="space-y-1">
                                                                                {tasksWithoutDueDate.map((task) => (
                                                                                    <DraggableTask key={task.id} task={task} />
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Tasks with due dates */}
                                                                    {tasksWithDueDate.length > 0 && (
                                                                        <div>
                                                                            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                                                                <Calendar className="h-4 w-4" />
                                                                                Scheduled ({tasksWithDueDate.length})
                                                                            </h4>
                                                                            <div className="space-y-1">
                                                                                {tasksWithDueDate
                                                                                    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                                                                                    .map((task) => (
                                                                                        <DraggableTask key={task.id} task={task} />
                                                                                    ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Calendar - Right Side */}
                                        <div className="lg:col-span-3">
                                            <div className="border rounded-lg overflow-hidden bg-background">
                                                {/* Week days header */}
                                                <div className="grid grid-cols-7 bg-muted/50">
                                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                                        <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-r border-border last:border-r-0">
                                                            {day}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Calendar weeks */}
                                                <div className="relative">
                                                    {weeks && weeks.length > 0 ? weeks.map((week, weekIndex) => (
                                                        <div key={`week-${weekIndex}`} className="grid grid-cols-7">
                                                            {week && week.length > 0 ? week.map((day, dayIndex) => (
                                                                <DroppableCalendarDay key={`day-${day?.date?.toISOString() || `${weekIndex}-${dayIndex}`}`} day={day} />
                                                            )) : null}
                                                        </div>
                                                    )) : (
                                                        <div className="text-center py-8 text-muted-foreground">
                                                            Loading calendar...
                                                        </div>
                                                    )}

                                                    {/* All task strips overlay */}
                                                    {weeks && weeks.length > 0 && getAllTasksWithRows().map((task) => (
                                                        <MultiDayTaskStrip
                                                            key={`task-strip-${task.id}`}
                                                            task={task}
                                                            calendarDays={weeks.flat()}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Calendar Legend */}
                                    <div className="mt-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg">Calendar Guide</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {/* How to use */}
                                                    <div>
                                                        <h4 className="font-medium mb-2">How to Use:</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-4 h-4 bg-blue-100 border-l-2 border-blue-500 rounded"></div>
                                                                <span>Drag tasks from left panel to calendar days</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Users className="w-4 h-4 text-muted-foreground" />
                                                                <span>Right-click on tasks to assign users</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-4 h-4 rounded-full bg-muted border flex items-center justify-center">
                                                                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                                                                </div>
                                                                <span>Small avatars show task assignees</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-4 h-4 bg-muted rounded cursor-pointer"></div>
                                                                <span>Left-click on tasks to view/edit details</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-4 bg-blue-100 border-l-2 border-blue-500 rounded-l flex items-center justify-center text-xs">━━</div>
                                                                <span>Multi-day tasks span across calendar days</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-4 h-4 bg-muted rounded cursor-pointer border-2 border-dashed border-blue-300"></div>
                                                                <span>Drag task edges to resize duration</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Priority colors */}
                                                    <div>
                                                        <h4 className="font-medium mb-2">Priority Colors:</h4>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-4 h-4 bg-red-100 border-l-2 border-red-500 rounded"></div>
                                                                <span>Urgent</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-4 h-4 bg-orange-100 border-l-2 border-orange-500 rounded"></div>
                                                                <span>High</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-4 h-4 bg-yellow-100 border-l-2 border-yellow-500 rounded"></div>
                                                                <span>Medium</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-4 h-4 bg-green-100 border-l-2 border-green-500 rounded"></div>
                                                                <span>Low</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Drag Overlay */}
                            <DragOverlay>
                                {activeTask ? (
                                    activeTask.type === 'member' ? (
                                        // Member drag overlay
                                        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border rounded-lg shadow-lg opacity-90">
                                            <Avatar className="h-8 w-8 border">
                                                <AvatarImage src={activeTask.avatar} />
                                                <AvatarFallback className="text-sm font-medium">
                                                    {activeTask.name?.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-medium truncate">{activeTask.name}</span>
                                                <span className="text-xs text-muted-foreground truncate">Drag to assign to task</span>
                                            </div>
                                        </div>
                                    ) : (
                                        // Task drag overlay
                                        <div className="p-3 border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/20 rounded-lg shadow-lg opacity-90">
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-medium text-sm">{activeTask.title}</h4>
                                                <div className="flex items-center gap-1">
                                                    {activeTask.assignees?.slice(0, 2).map((assignee: any) => (
                                                        <Avatar key={assignee.id} className="h-5 w-5 border">
                                                            <AvatarImage src={assignee.avatar} />
                                                            <AvatarFallback className="text-xs">
                                                                {assignee.name.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>{activeTask.boardName} • {activeTask.listName}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {activeTask.priority}
                                                </Badge>
                                            </div>
                                        </div>
                                    )
                                ) : null}
                            </DragOverlay>
                        </DndContext>
                    </TabsContent>

                    <TabsContent value="members" className="mt-0">
                        <Card className="rounded-t-none border-t-0">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="h-5 w-5" />
                                            Members
                                        </CardTitle>
                                        <CardDescription>
                                            Manage who has access to this project and their roles
                                        </CardDescription>
                                    </div>
                                    {project.can_manage_members && (
                                        <Button
                                            onClick={() => setInviteModalOpen(true)}
                                            className="shadow-sm hover:shadow-md"
                                        >
                                            <UserPlus className="h-4 w-4 mr-2" />
                                            Invite Member
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {project.members && project.members.length > 0 ? (
                                    <div className="space-y-3">
                                        {project.members.map((member) => (
                                            <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={member.avatar} />
                                                            <AvatarFallback className="text-sm">
                                                                {member.name.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        {member.id === project.owner_id && (
                                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                                                                <Crown className="h-2 w-2 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-medium">{getShortName(member.name)}</h4>
                                                            <Badge
                                                                variant={member.id === project.owner_id ? "default" : "secondary"}
                                                                className="text-xs"
                                                            >
                                                                {member.id === project.owner_id ? 'Owner' : (member.pivot?.role || 'Member')}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">{member.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {project.can_manage_members && member.id !== project.owner_id ? (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                                title="Manage permissions"
                                                                onClick={() => {
                                                                    setEditingMember(member);
                                                                    setPermissionModalOpen(true);
                                                                }}
                                                            >
                                                                <Settings className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                                title="Remove member"
                                                                onClick={() => {
                                                                    setMemberToDelete(member);
                                                                    setDeleteDialogOpen(true);
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    ) : member.id !== project.owner_id ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            disabled
                                                            title="No permission to manage"
                                                        >
                                                            <Lock className="h-4 w-4" />
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 bg-gradient-to-br from-muted/20 to-muted/40 rounded-xl border-2 border-dashed border-muted-foreground/30">
                                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Users className="h-10 w-10 text-green-600" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-3">Invite Team Members</h3>
                                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                                            Collaboration makes projects successful. Invite team members to work together
                                            on tasks, share ideas, and achieve your project goals.
                                        </p>
                                        {project.can_manage_members ? (
                                            <Button
                                                onClick={() => setInviteModalOpen(true)}
                                                size="lg"
                                                className="shadow-lg hover:shadow-xl transition-shadow"
                                            >
                                                <UserPlus className="h-5 w-5 mr-2" />
                                                Invite Your First Member
                                            </Button>
                                        ) : (
                                            <Button size="lg" disabled className="shadow-lg">
                                                <Lock className="h-5 w-5 mr-2" />
                                                No Permission to Invite Members
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="labels" className="mt-0">
                        <Card className="rounded-t-none border-t-0">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Tag className="h-5 w-5" />
                                            Project Labels
                                        </CardTitle>
                                        <CardDescription>
                                            Create custom labels to organize and categorize tasks
                                        </CardDescription>
                                    </div>
                                    {canEdit && (
                                        <Link href={route('labels.index', { project: project.id })}>
                                            <Button className="shadow-sm hover:shadow-md">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Manage Labels
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
                                    <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-muted-foreground mb-2">Label Management</h3>
                                    <p className="text-sm text-muted-foreground mb-6">
                                        Create and manage custom labels to organize your tasks effectively
                                    </p>
                                    <Link href={route('labels.index', { project: project.id })}>
                                        <Button variant="outline">
                                            <Tag className="h-4 w-4 mr-2" />
                                            Manage Labels
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="details" className="mt-0">
                        <Card className="rounded-t-none border-t-0">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Settings className="h-5 w-5" />
                                            Project Details
                                        </CardTitle>
                                        <CardDescription>
                                            View and manage project information and settings
                                        </CardDescription>
                                    </div>
                                    {canEdit && (
                                        <Link href={route('projects.edit', { project: project.id })}>
                                            <Button className="shadow-sm hover:shadow-md">
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit Project
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Project Information */}
                                    <Card className="border-2">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Project Information</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-1 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-muted-foreground">Visibility</label>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {project.is_public ? (
                                                            <>
                                                                <Globe className="h-4 w-4 text-green-600" />
                                                                <span className="text-green-600 font-medium">Public</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Shield className="h-4 w-4 text-blue-600" />
                                                                <span className="text-blue-600 font-medium">Private</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Description</label>
                                                <p className="mt-1 text-sm bg-muted/50 px-3 py-2 rounded-md min-h-[60px]">
                                                    {project.description || 'No description provided'}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                                                    <p className="text-sm mt-1">
                                                        {new Date(project.created_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                                                    <p className="text-sm mt-1">
                                                        {new Date(project.updated_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Project Statistics */}
                                    <Card className="border-2">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Project Statistics</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg text-center">
                                                    <div className="text-2xl font-bold text-blue-600">{project.boards?.length || 0}</div>
                                                    <div className="text-sm text-blue-600/80">Boards</div>
                                                </div>
                                                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg text-center">
                                                    <div className="text-2xl font-bold text-green-600">{project.members?.length || 0}</div>
                                                    <div className="text-sm text-green-600/80">Members</div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg text-center">
                                                    <div className="text-2xl font-bold text-purple-600">
                                                        {project.boards?.reduce((acc, board) =>
                                                            acc + (board.lists?.reduce((listAcc, list) =>
                                                                listAcc + (list.tasks?.length || 0), 0) || 0), 0) || 0}
                                                    </div>
                                                    <div className="text-sm text-purple-600/80">Total Tasks</div>
                                                </div>
                                                <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg text-center">
                                                    <div className="text-2xl font-bold text-orange-600">
                                                        {project.boards?.reduce((acc, board) =>
                                                            acc + (board.lists?.reduce((listAcc, list) =>
                                                                listAcc + (list.tasks?.filter(task => task.status === 'done').length || 0), 0) || 0), 0) || 0}
                                                    </div>
                                                    <div className="text-sm text-orange-600/80">Completed</div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Project Owner Information */}
                                <Card className="border-2">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Owner</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-16 w-16 border-2 border-background shadow-md">
                                                <AvatarImage src={project.owner?.avatar} />
                                                <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-yellow-400/20 to-yellow-600/20">
                                                    {project.owner?.name?.charAt(0).toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-lg">{getShortName(project.owner?.name || '')}</h4>
                                                <p className="text-muted-foreground">{project.owner?.email}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Badge variant="default" className="flex items-center gap-1">
                                                        <Crown className="h-3 w-3" />
                                                        Project Owner
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </CardContent>
                        </Card>
                    </TabsContent>


                    </Tabs>
                </div>
            </div>

            <InviteMemberModal
                project={project}
                open={inviteModalOpen}
                onOpenChange={setInviteModalOpen}
            />

            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Remove Team Member"
                description={`Are you sure you want to remove ${memberToDelete?.name} from this project? They will lose access to all project resources.`}
                onConfirm={handleDeleteMember}
                confirmText="Remove"
                cancelText="Cancel"
                variant="destructive"
            />

            <MemberPermissionModal
                project={project}
                member={editingMember}
                open={permissionModalOpen}
                onOpenChange={setPermissionModalOpen}
            />

            {/* Task Assignment Modal */}
            <TaskAssignmentModal
                task={taskToAssign}
                project={project}
                open={assignTaskModalOpen}
                onOpenChange={setAssignTaskModalOpen}
            />

            {/* Task Duration Modal */}
            <TaskDurationModal
                task={taskToExtend}
                project={project}
                open={durationModalOpen}
                onOpenChange={setDurationModalOpen}
            />

            {/* Task Detail Modal */}
            <TaskDetailModal
                task={selectedTaskForDetail}
                project={project}
                open={taskDetailModalOpen}
                onOpenChange={setTaskDetailModalOpen}
            />

            {/* Board Task Modals */}
            {selectedTask && (
                <TaskEditModal
                    open={taskEditModalOpen}
                    onOpenChange={setTaskEditModalOpen}
                    project={project}
                    task={selectedTask}
                    members={project.members || []}
                    labels={[]}
                    lists={lists}
                />
            )}

            {selectedTask && (
                <TaskViewModal
                    open={taskViewModalOpen}
                    onOpenChange={setTaskViewModalOpen}
                    project={project}
                    task={selectedTask}
                    onEdit={project.can_manage_tasks ? handleEditFromView : undefined}
                />
            )}

            {/* Section Edit Modal */}
            <Dialog open={sectionEditModalOpen} onOpenChange={setSectionEditModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Section</DialogTitle>
                        <DialogDescription>
                            Update the section name and description.
                        </DialogDescription>
                    </DialogHeader>
                    {editingSection && (
                        <SectionEditForm
                            section={editingSection}
                            project={project}
                            onClose={() => setSectionEditModalOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
