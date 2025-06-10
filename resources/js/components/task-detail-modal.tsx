import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Project, Task } from '@/types/project-manager';
import { router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { route } from 'ziggy-js';
import {
    X,
    Calendar,
    Clock,
    User,
    Tag,
    AlertCircle,
    CheckCircle2,
    Timer,
    FileText,
    Users,
    Briefcase,
    Flag,
    TrendingUp,
    Activity,
    ChevronDown,
    ExternalLink,
    Layers
} from 'lucide-react';

interface TaskDetailModalProps {
    task: any;
    project?: Project;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    availableLists?: any[];
}

export default function TaskDetailModal({ task, project, open, onOpenChange, availableLists = [] }: TaskDetailModalProps) {
    if (!task) return null;

    // State for managing task updates
    const [currentListId, setCurrentListId] = useState(task.list_id);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Update local state when task changes
    useEffect(() => {
        setCurrentListId(task.list_id);
    }, [task.list_id]);

    // Get current list info - prioritize task.list if it has board info
    const currentList = (task.list && task.list.board) ? task.list :
                       availableLists.find(list => list.id === currentListId) ||
                       availableLists.find(list => list.id == currentListId) || // Try loose comparison
                       task.list ||
                       {
                           id: task.list_id,
                           name: task.listName || task.list?.name || 'Unknown List',
                           color: task.list?.color || '#3498db',
                           board: task.list?.board || null
                       };

    // Get board info - try multiple sources
    const currentBoard = currentList.board ||
                        task?.list?.board ||
                        (project?.boards?.find(board =>
                            board.lists?.some(list => list.id === currentListId)
                        )) ||
                        { id: null, name: 'Unknown Board' };







    // Helper function to map list name to task status for progress bar
    const getStatusFromListName = (listName: string): string => {
        const name = listName.toLowerCase().trim();
        switch (name) {
            case 'to do':
            case 'todo':
            case 'backlog':
            case 'new':
            case 'open':
                return 'to_do';
            case 'in progress':
            case 'in-progress':
            case 'inprogress':
            case 'doing':
            case 'active':
            case 'working':
            case 'review':
            case 'testing':
            case 'qa':
            case 'pending review':
                return 'in_progress';
            case 'done':
            case 'completed':
            case 'finished':
            case 'closed':
            case 'complete':
                return 'done';
            default:
                return task.status || 'to_do';
        }
    };

    const currentStatus = getStatusFromListName(currentList.name);

    // Handle list change
    const handleListChange = async (newListId: string) => {
        if (newListId === currentListId || isUpdating) return;

        const newList = availableLists.find(list => list.id === newListId);
        if (!newList) return;

        setIsUpdating(true);
        setCurrentListId(newListId);

        try {
            // Update the task list (which will automatically update status)
            await router.put(route('tasks.update', { project: project?.id || task.project_id, task: task.id }), {
                title: task.title,
                description: task.description || '',
                priority: task.priority,
                status: task.status, // Keep existing status, let backend handle list-based status
                estimate: task.estimate,
                due_date: task.due_date,
                start_date: task.start_date,
                duration_days: task.duration_days,
                list_id: newListId,
                assignee_ids: task.assignees?.map((a: any) => a.id) || [],
                label_ids: task.labels?.map((l: any) => l.id) || [],
                is_archived: task.is_archived || false,
            }, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    // Show success indicator briefly
                    setShowSuccess(true);
                    setTimeout(() => setShowSuccess(false), 2000);
                },
                onError: (errors) => {
                    console.error('Failed to update task list:', errors);
                    // Revert list on error
                    setCurrentListId(task.list_id);
                },
                onFinish: () => {
                    setIsUpdating(false);
                }
            });
        } catch (error) {
            console.error('Error updating task list:', error);
            setCurrentListId(task.list_id);
            setIsUpdating(false);
        }
    };

    // Get priority color styling
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'text-red-700 bg-red-100 border-red-300 dark:text-red-300 dark:bg-red-950/30 dark:border-red-700';
            case 'high':
                return 'text-orange-700 bg-orange-100 border-orange-300 dark:text-orange-300 dark:bg-orange-950/30 dark:border-orange-700';
            case 'medium':
                return 'text-yellow-700 bg-yellow-100 border-yellow-300 dark:text-yellow-300 dark:bg-yellow-950/30 dark:border-yellow-700';
            case 'low':
                return 'text-green-700 bg-green-100 border-green-300 dark:text-green-300 dark:bg-green-950/30 dark:border-green-700';
            default:
                return 'text-blue-700 bg-blue-100 border-blue-300 dark:text-blue-300 dark:bg-blue-950/30 dark:border-blue-700';
        }
    };

    // Get status color and icon based on list
    const getListStatusInfo = (listName: string, listColor?: string) => {
        const status = getStatusFromListName(listName);
        const baseColor = listColor || '#3498db';

        switch (status) {
            case 'done':
                return {
                    color: 'text-green-700 bg-green-100 border-green-300 dark:text-green-300 dark:bg-green-950/30 dark:border-green-700',
                    icon: CheckCircle2,
                    label: listName
                };
            case 'in_progress':
                return {
                    color: 'text-blue-700 bg-blue-100 border-blue-300 dark:text-blue-300 dark:bg-blue-950/30 dark:border-blue-700',
                    icon: Timer,
                    label: listName
                };
            case 'to_do':
            default:
                return {
                    color: 'text-gray-700 bg-gray-100 border-gray-300 dark:text-gray-300 dark:bg-gray-950/30 dark:border-gray-700',
                    icon: AlertCircle,
                    label: listName
                };
        }
    };

    const statusInfo = getListStatusInfo(currentList.name, currentList.color);
    const StatusIcon = statusInfo.icon;

    // Check if task is overdue
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && currentStatus !== 'done';

    return (
        <div className={`fixed inset-0 z-50 transition-all duration-300 ${open ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
                onClick={() => onOpenChange(false)}
            />
            <div className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] overflow-hidden transition-all duration-300 ${open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                <Card className="shadow-2xl border-0 bg-white dark:bg-gray-950">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`p-2 rounded-lg ${getPriorityColor(task.priority)}`}>
                                        <Flag className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 break-words">
                                            {task.title}
                                        </CardTitle>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                            <Briefcase className="h-4 w-4" />
                                            <span>
                                                {task.project?.name || project?.name || 'Inbox'}
                                                {task.boardName && ` • ${task.boardName}`}
                                                {task.listName && ` • ${task.listName}`}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status and Priority Badges */}
                                <div className="flex items-center gap-3 flex-wrap">
                                    {/* Interactive List/Status Dropdown */}
                                    <div className="flex items-center gap-2">
                                        {availableLists.length > 0 ? (
                                            <Select
                                                value={currentListId}
                                                onValueChange={handleListChange}
                                                disabled={isUpdating}
                                            >
                                                <SelectTrigger
                                                    className={`w-auto h-auto px-3 py-1 border-2 font-medium text-sm transition-all ${statusInfo.color} ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 hover:scale-105 cursor-pointer'}`}
                                                    title="Click to move task to different list"
                                                >
                                                    <div className="flex items-center gap-1">
                                                        <StatusIcon className="h-3 w-3" />
                                                        <span>{currentList.name}</span>
                                                        {isUpdating ? (
                                                            <div className="ml-1 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                        ) : (
                                                            <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
                                                        )}
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableLists.map((list) => {
                                                        const listStatusInfo = getListStatusInfo(list.name, list.color);
                                                        const ListIcon = listStatusInfo.icon;
                                                        return (
                                                            <SelectItem key={list.id} value={list.id} className="cursor-pointer">
                                                                <div className="flex items-center gap-2">
                                                                    <ListIcon className="h-4 w-4" style={{ color: list.color }} />
                                                                    <span>{list.name}</span>
                                                                </div>
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Badge variant="outline" className={`${statusInfo.color} font-medium px-3 py-1`}>
                                                <StatusIcon className="h-3 w-3 mr-1" />
                                                {currentList.name}
                                            </Badge>
                                        )}
                                    </div>
                                    <Badge variant="outline" className={`${getPriorityColor(task.priority)} font-medium px-3 py-1`}>
                                        <Flag className="h-3 w-3 mr-1" />
                                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                                    </Badge>
                                    {isOverdue && (
                                        <Badge variant="destructive" className="font-medium px-3 py-1 animate-pulse">
                                            <AlertCircle className="h-3 w-3 mr-1" />
                                            Overdue
                                        </Badge>
                                    )}
                                    {task.estimate && (
                                        <Badge variant="secondary" className="font-medium px-3 py-1">
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                            {task.estimate}h estimated
                                        </Badge>
                                    )}
                                </div>

                                {/* Progress Bar for Status */}
                                <div className="mt-4">
                                    {(() => {
                                        // Calculate progress based on position in board workflow
                                        const calculateProgress = () => {
                                            if (!availableLists || availableLists.length === 0) {
                                                return { percentage: 0, position: 0, total: 0 };
                                            }

                                            // Sort lists by position to get correct workflow order
                                            const sortedLists = [...availableLists].sort((a, b) => (a.position || 0) - (b.position || 0));

                                            // Try to find current list by ID (both string and number comparison)
                                            let currentListIndex = sortedLists.findIndex(list =>
                                                list.id === currentListId ||
                                                list.id == currentListId ||
                                                String(list.id) === String(currentListId)
                                            );

                                            // If not found by ID, try to find by name as fallback
                                            if (currentListIndex === -1) {
                                                currentListIndex = sortedLists.findIndex(list =>
                                                    list.name === currentList.name
                                                );
                                            }

                                            if (currentListIndex === -1) {
                                                return {
                                                    percentage: 0,
                                                    position: 0,
                                                    total: sortedLists.length
                                                };
                                            }

                                            // Calculate percentage: (current position + 1) / total lists * 100
                                            // +1 because we want to show progress when task enters a list
                                            const percentage = Math.round(((currentListIndex + 1) / sortedLists.length) * 100);

                                            return {
                                                percentage,
                                                position: currentListIndex + 1,
                                                total: sortedLists.length,
                                                currentListName: sortedLists[currentListIndex]?.name || currentList.name
                                            };
                                        };

                                        const progress = calculateProgress();

                                        // Determine color based on progress
                                        const getProgressColor = (percentage: number) => {
                                            if (percentage >= 100) return 'bg-green-500';
                                            if (percentage >= 75) return 'bg-blue-500';
                                            if (percentage >= 50) return 'bg-yellow-500';
                                            if (percentage >= 25) return 'bg-orange-500';
                                            return 'bg-gray-400';
                                        };

                                        return (
                                            <>
                                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                                                    <span>Workflow Progress</span>
                                                    <span>{progress.percentage}% ({progress.position}/{progress.total})</span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                                    <div
                                                        className={`h-2.5 rounded-full transition-all duration-700 ease-in-out ${getProgressColor(progress.percentage)}`}
                                                        style={{ width: `${progress.percentage}%` }}
                                                    />
                                                </div>
                                                <div className="mt-1 text-xs text-muted-foreground">
                                                    Step {progress.position} of {progress.total}: {progress.currentListName}
                                                </div>
                                            </>
                                        );
                                    })()}
                                    {isUpdating && (
                                        <div className="mt-1 text-xs text-muted-foreground italic">
                                            Moving task...
                                        </div>
                                    )}
                                    {showSuccess && (
                                        <div className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1 animate-fade-in">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Task moved successfully
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onOpenChange(false)}
                                className="h-8 w-8 p-0 hover:bg-white/50 dark:hover:bg-gray-800/50"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 max-h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Main Content */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Description */}
                                {task.description ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Description</h3>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border">
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                                                {task.description}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Description</h3>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-dashed">
                                            <p className="text-sm text-muted-foreground italic">
                                                No description provided
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Labels */}
                                {task.labels && task.labels.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Tag className="h-4 w-4 text-muted-foreground" />
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Labels</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {task.labels.map((label: any) => (
                                                <Badge
                                                    key={label.id}
                                                    variant="outline"
                                                    className="px-3 py-1 font-medium"
                                                    style={{
                                                        backgroundColor: label.color + '15',
                                                        borderColor: label.color,
                                                        color: label.color
                                                    }}
                                                >
                                                    <Tag className="h-3 w-3 mr-1" />
                                                    {label.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                {/* Task Details */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Task Details
                                    </h3>

                                    {/* Project */}
                                    {task?.project && (
                                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                                                <span className="text-sm font-medium">Project</span>
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {task.project.name}
                                            </span>
                                        </div>
                                    )}

                                    {/* Current List */}
                                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: currentList.color || '#3498db' }}
                                            />
                                            <span className="text-sm font-medium">Current List</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {currentList.name}
                                        </span>
                                    </div>

                                    {/* Board Link */}
                                    {currentBoard.id && (
                                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                                            <div className="flex items-center gap-2">
                                                <Layers className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm font-medium">Board</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {currentBoard.name}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-auto p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                                    onClick={() => {
                                                        try {
                                                            const projectId = project?.id || task?.project?.id;
                                                            if (projectId) {
                                                                const url = route('boards.show', {
                                                                    project: projectId,
                                                                    board: currentBoard.id
                                                                });
                                                                window.open(url, '_blank');
                                                            } else {
                                                                console.error('No project ID available');
                                                            }
                                                        } catch (error) {
                                                            console.error('Error opening board:', error);
                                                            // Fallback to manual URL construction
                                                            const projectId = project?.id || task?.project?.id;
                                                            if (projectId) {
                                                                const fallbackUrl = `/projects/${projectId}/boards/${currentBoard.id}`;
                                                                window.open(fallbackUrl, '_blank');
                                                            }
                                                        }
                                                    }}
                                                    title="Open board in new tab"
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {/* Due Date */}
                                        {task.due_date && (
                                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm font-medium">Due Date</span>
                                                </div>
                                                <span className={`text-sm font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {new Date(task.due_date).toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        )}

                                        {/* Duration */}
                                        {task.duration_days && task.duration_days > 1 && (
                                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                                                <div className="flex items-center gap-2">
                                                    <Timer className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm font-medium">Duration</span>
                                                </div>
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {task.duration_days} day{task.duration_days !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        )}

                                        {/* Estimate */}
                                        {task.estimate && (
                                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm font-medium">Estimate</span>
                                                </div>
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {task.estimate}h
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Assignees */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Assignees
                                    </h3>

                                    {task.assignees && task.assignees.length > 0 ? (
                                        <div className="space-y-2">
                                            {task.assignees.map((assignee: any) => (
                                                <div key={assignee.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={assignee.avatar} />
                                                        <AvatarFallback className="text-sm font-medium">
                                                            {assignee.name.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                            {assignee.name}
                                                        </p>
                                                        {assignee.email && (
                                                            <p className="text-xs text-muted-foreground truncate">
                                                                {assignee.email}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed">
                                            <p className="text-sm text-muted-foreground italic">
                                                No assignees
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Created Info */}
                                {task.creator && (
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Created By
                                        </h3>

                                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={task.creator.avatar} />
                                                <AvatarFallback className="text-sm font-medium">
                                                    {task.creator.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {task.creator.name}
                                                </p>
                                                {task.created_at && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(task.created_at).toLocaleDateString('en-US', {
                                                            weekday: 'short',
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                    <Separator />
                    <CardFooter className="bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>
                                    {task.updated_at ? (
                                        `Last updated ${new Date(task.updated_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}`
                                    ) : (
                                        `Created ${task.created_at ? new Date(task.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric'
                                        }) : 'recently'}`
                                    )}
                                </span>
                            </div>

                            {/* Activity indicator for recently updated tasks */}
                            {task.updated_at && new Date(task.updated_at) > new Date(Date.now() - 24 * 60 * 60 * 1000) && (
                                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                    <Activity className="h-3 w-3" />
                                    <span>Recently active</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {showSuccess && (
                                <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 animate-fade-in">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>Changes saved</span>
                                </div>
                            )}
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="hover:bg-white dark:hover:bg-gray-800 transition-colors"
                                disabled={isUpdating}
                            >
                                Close
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
