import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, User as UserIcon, FolderOpen, Plus, Inbox } from 'lucide-react';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo, useCallback, memo } from 'react';

interface Task {
    id: number;
    title: string;
    description: string | null;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'to_do' | 'in_progress' | 'review' | 'done';
    due_date: string;
    project?: {
        id: number;
        name: string;
        key: string;
    };
    assignees?: { id: number; name: string }[];
    is_inbox: boolean;
    created_at?: string;
}

interface Project {
    id: number;
    name: string;
    key: string;
}

interface CalendarDay {
    date: string;
    day: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    tasks: Task[];
}

interface CalendarPageProps {
    tasks: Task[];
    projects: Project[];
    tasksByDate: Record<string, Task[]>;
    calendarData: CalendarDay[];
    currentMonth: number;
    currentYear: number;
    monthName: string;
}

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Memoized CalendarDay component for better performance
const CalendarDayComponent = memo(({
    day,
    dayIndex,
    weekIndex,
    weeksLength,
    onDayClick,
    onTaskClick,
    getTaskStateColor
}: {
    day: CalendarDay;
    dayIndex: number;
    weekIndex: number;
    weeksLength: number;
    onDayClick: (day: CalendarDay) => void;
    onTaskClick: (task: Task) => void;
    getTaskStateColor: (task: Task) => string;
}) => {
    const handleClick = useCallback(() => onDayClick(day), [day, onDayClick]);

    return (
        <div
            onClick={handleClick}
            className={`group flex-1 p-2 min-h-[120px] cursor-pointer subtle-hover relative ${dayIndex < 6 ? 'border-r border-border' : ''} ${weekIndex < weeksLength - 1 ? 'border-b border-border' : ''} ${
                !day.isCurrentMonth
                    ? 'bg-muted/30 text-muted-foreground'
                    : 'bg-background'
            } ${day.isToday ? 'bg-primary/10 border-primary/20' : ''}`}
        >
            <div className={`text-sm font-medium mb-1 transition-colors duration-200 ${
                day.isToday ? 'text-primary' : day.isCurrentMonth ? 'text-foreground group-hover:text-primary' : 'text-muted-foreground'
            }`}>
                {day.day}
            </div>

            <div className="space-y-1">
                {day.tasks.length === 0 && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-muted-foreground/60 italic py-2">
                        Click to add task...
                    </div>
                )}
                {day.tasks.slice(0, 3).map((task) => (
                    <button
                        key={task.id}
                        className={`w-full text-left text-xs p-1 rounded cursor-pointer hover:scale-105 hover:shadow-sm transition-all duration-150 border ${
                            task.status === 'done' ? 'opacity-80 line-through' : ''
                        } ${getTaskStateColor(task)}`}
                        title={`${task.title} - ${task.project?.name || 'Inbox'} - Due: ${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onTaskClick(task);
                        }}
                    >
                        <div className="truncate font-medium">{task.title}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                            {task.project ? (
                                <>
                                    <FolderOpen className="h-2.5 w-2.5" />
                                    <span className="truncate">{task.project.key}</span>
                                </>
                            ) : (
                                <Inbox className="h-2.5 w-2.5 opacity-75" />
                            )}
                        </div>
                    </button>
                ))}
                {day.tasks.length > 3 && (
                    <div className="text-xs text-muted-foreground p-1 transition-colors duration-200 group-hover:text-foreground">
                        +{day.tasks.length - 3} more
                    </div>
                )}
            </div>
        </div>
    );
});

export default function Calendar({
    tasks = [],
    projects = [],
    tasksByDate = {},
    calendarData = [],
    currentMonth,
    currentYear,
    monthName
}: CalendarPageProps) {
    const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);
    const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'medium',
        due_date: ''
    });
    const navigateMonth = useCallback((direction: 'prev' | 'next') => {
        let newMonth = currentMonth;
        let newYear = currentYear;

        if (direction === 'prev') {
            newMonth = currentMonth === 1 ? 12 : currentMonth - 1;
            newYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        } else {
            newMonth = currentMonth === 12 ? 1 : currentMonth + 1;
            newYear = currentMonth === 12 ? currentYear + 1 : currentYear;
        }

        router.get(route('calendar'), {
            month: newMonth,
            year: newYear
        }, {
            preserveState: true,
            preserveScroll: true,
            only: ['tasks', 'calendarData', 'currentMonth', 'currentYear', 'monthName']
        });
    }, [currentMonth, currentYear]);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
            case 'medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
            case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'to_do': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
            case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'done': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
        }
    };

    const getTaskStateColor = useCallback((task: Task) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dueDate = task.due_date ? new Date(task.due_date) : null;
        const hasProject = task.project && task.project.id;

        // Completed tasks - green (with different shades for project vs non-project)
        if (task.status === 'done') {
            return hasProject
                ? 'bg-green-500 text-white border-green-600'
                : 'bg-green-400 text-white border-green-500';
        }

        if (!dueDate) {
            // No due date - different colors for project vs non-project
            return hasProject
                ? 'bg-blue-500 text-white border-blue-600'
                : 'bg-slate-400 text-white border-slate-500';
        }

        // Normalize due date to start of day for accurate comparison
        const normalizedDueDate = new Date(dueDate);
        normalizedDueDate.setHours(0, 0, 0, 0);

        const timeDiff = normalizedDueDate.getTime() - today.getTime();
        const daysDiff = Math.round(timeDiff / (1000 * 3600 * 24));

        // Overdue - red (with different shades for project vs non-project)
        if (daysDiff < 0) {
            return hasProject
                ? 'bg-red-500 text-white border-red-600'
                : 'bg-red-400 text-white border-red-500';
        }

        // Due today or within next 2 days (0, 1, 2 days) - yellow/orange
        if (daysDiff <= 2) {
            return hasProject
                ? 'bg-yellow-500 text-white border-yellow-600'
                : 'bg-orange-400 text-white border-orange-500';
        }

        // Upcoming (3+ days away) - blue
        return hasProject
            ? 'bg-blue-500 text-white border-blue-600'
            : 'bg-slate-400 text-white border-slate-500';
    }, []);

    const getTaskBorderColor = (task: Task) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dueDate = task.due_date ? new Date(task.due_date) : null;
        const hasProject = task.project && task.project.id;

        // Completed tasks - green (with different shades for project vs non-project)
        if (task.status === 'done') {
            return hasProject ? 'border-l-green-500' : 'border-l-green-400';
        }

        if (!dueDate) {
            // No due date - different colors for project vs non-project
            return hasProject ? 'border-l-blue-500' : 'border-l-slate-400';
        }

        // Normalize due date to start of day for accurate comparison
        const normalizedDueDate = new Date(dueDate);
        normalizedDueDate.setHours(0, 0, 0, 0);

        const timeDiff = normalizedDueDate.getTime() - today.getTime();
        const daysDiff = Math.round(timeDiff / (1000 * 3600 * 24));

        // Overdue - red (with different shades for project vs non-project)
        if (daysDiff < 0) {
            return hasProject ? 'border-l-red-500' : 'border-l-red-400';
        }

        // Due today or within next 2 days (0, 1, 2 days) - yellow/orange
        if (daysDiff <= 2) {
            return hasProject ? 'border-l-yellow-500' : 'border-l-orange-400';
        }

        // Upcoming (3+ days away) - blue
        return hasProject ? 'border-l-blue-500' : 'border-l-slate-400';
    };

    const handleDayClick = (day: CalendarDay) => {
        setSelectedDay(day);
        setIsDayDetailOpen(true);
    };

    const handleTaskClick = useCallback((task: Task) => {
        setSelectedTask(task);
        setIsTaskDetailOpen(true);
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleAddTask = () => {
        if (selectedDay) {
            setNewTask(prev => ({
                ...prev,
                due_date: selectedDay.date
            }));
            setIsAddTaskOpen(true);
            setIsDayDetailOpen(false);
        }
    };

    const handleSubmitTask = () => {
        if (!newTask.title.trim()) return;

        // Create as inbox task - calendar tasks are standalone tasks
        router.post(route('inbox.tasks.store'), {
            title: newTask.title,
            description: newTask.description,
            priority: newTask.priority,
            due_date: newTask.due_date,
            status: 'to_do'
        }, {
            onSuccess: () => {
                setIsAddTaskOpen(false);
                setNewTask({
                    title: '',
                    description: '',
                    priority: 'medium',
                    due_date: ''
                });
                // Refresh the calendar data by navigating to current month/year
                router.get(route('calendar'), {
                    month: currentMonth,
                    year: currentYear
                }, {
                    preserveState: true,
                    preserveScroll: true,
                    only: ['tasks', 'calendarData']
                });
            }
        });
    };

    // Group calendar data into weeks - memoized for performance
    const weeks = useMemo(() => {
        const weekGroups = [];
        for (let i = 0; i < calendarData.length; i += 7) {
            weekGroups.push(calendarData.slice(i, i + 7));
        }
        return weekGroups;
    }, [calendarData]);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Calendar', href: route('calendar') },
            ]}
        >
            <Head title="Calendar" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CalendarIcon className="h-8 w-8 text-primary" />
                        <div>
                            <h1 className="text-2xl font-semibold">Calendar</h1>
                            <p className="text-muted-foreground">
                                View and manage your schedule and deadlines
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateMonth('prev')}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="px-4 py-2 text-lg font-semibold min-w-[140px] text-center">
                            {monthName} {currentYear}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateMonth('next')}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Calendar View</CardTitle>
                                <CardDescription>
                                    Your tasks and events organized by date
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-3 text-xs flex-wrap">
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                                    <span>Overdue</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                                    <span>Due Soon (≤2 days)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                    <span>Project Tasks</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-slate-400 rounded"></div>
                                    <span>No Project</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                                    <span>Completed</span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg overflow-hidden">
                            {/* Week day headers */}
                            <div className="flex bg-muted">
                                {weekDays.map((day, index) => (
                                    <div key={day} className={`flex-1 p-3 text-center text-sm font-medium text-muted-foreground ${index < 6 ? 'border-r border-border' : ''}`}>
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar weeks */}
                            {weeks.map((week, weekIndex) => (
                                <div key={weekIndex} className="flex">
                                    {week.map((day, dayIndex) => (
                                        <CalendarDayComponent
                                            key={day.date}
                                            day={day}
                                            dayIndex={dayIndex}
                                            weekIndex={weekIndex}
                                            weeksLength={weeks.length}
                                            onDayClick={handleDayClick}
                                            onTaskClick={handleTaskClick}
                                            getTaskStateColor={getTaskStateColor}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Task Summary */}
                {tasks.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Tasks This Month</CardTitle>
                            <CardDescription>
                                All tasks with due dates in {monthName} {currentYear}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className={`flex items-center justify-between p-3 bg-muted/50 rounded-lg border-l-4 cursor-pointer hover:bg-muted/70 transition-colors ${getTaskBorderColor(task)}`}
                                        onClick={() => handleTaskClick(task)}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className={`font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                                                    {task.title}
                                                </h4>
                                                <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                                    {task.priority}
                                                </Badge>
                                                <Badge variant="outline" className={getStatusColor(task.status)}>
                                                    {task.status.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{new Date(task.due_date).toLocaleDateString()}</span>
                                                </div>
                                                {task.project ? (
                                                    <div className="flex items-center gap-1">
                                                        <FolderOpen className="h-3 w-3" />
                                                        <span>{task.project.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">No Project</span>
                                                )}
                                                {task.assignees && task.assignees.length > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <UserIcon className="h-3 w-3" />
                                                        <span>{task.assignees.map(a => a.name).join(', ')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Day Detail Modal */}
                <Dialog open={isDayDetailOpen} onOpenChange={setIsDayDetailOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5" />
                                {selectedDay && formatDate(selectedDay.date)}
                            </DialogTitle>
                            <DialogDescription>
                                {selectedDay?.tasks.length === 0
                                    ? 'No tasks scheduled for this day'
                                    : `${selectedDay?.tasks.length} task${selectedDay?.tasks.length !== 1 ? 's' : ''} scheduled for this day`
                                }
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            {selectedDay?.tasks.length === 0 ? (
                                <div className="text-center py-8">
                                    <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground mb-4">No tasks scheduled for this day</p>
                                    <Button size="sm" onClick={handleAddTask}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Task
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                        {selectedDay?.tasks.map((task) => (
                                            <div
                                                key={task.id}
                                                className={`p-4 border rounded-lg bg-card border-l-4 cursor-pointer hover:bg-accent/50 transition-colors ${getTaskBorderColor(task)}`}
                                                onClick={() => handleTaskClick(task)}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className={`font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                                                        {task.title}
                                                    </h4>
                                                    <div className="flex gap-2">
                                                        <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                                            {task.priority}
                                                        </Badge>
                                                        <Badge variant="outline" className={getStatusColor(task.status)}>
                                                            {task.status.replace('_', ' ')}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                {task.description && (
                                                    <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                                                )}

                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                                                    </div>
                                                    {task.project ? (
                                                        <div className="flex items-center gap-1">
                                                            <FolderOpen className="h-3 w-3" />
                                                            <span>{task.project.name} ({task.project.key})</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">No Project</span>
                                                    )}
                                                    {task.assignees && task.assignees.length > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            <UserIcon className="h-3 w-3" />
                                                            <span>{task.assignees.map(a => a.name).join(', ')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-4 border-t">
                                        <Button size="sm" variant="outline" onClick={handleAddTask} className="w-full">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Another Task
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Add Task Modal */}
                <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Plus className="h-5 w-5" />
                                Add New Task
                            </DialogTitle>
                            <DialogDescription>
                                Create a new task for {selectedDay && formatDate(selectedDay.date)}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Title</label>
                                <Input
                                    placeholder="Enter task title..."
                                    value={newTask.title}
                                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Description</label>
                                <Textarea
                                    placeholder="Enter task description..."
                                    value={newTask.description}
                                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Priority</label>
                                <Select value={newTask.priority} onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value }))}>
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
                                <p className="text-xs text-muted-foreground mt-1">
                                    Tasks created from calendar will be added to your inbox
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddTaskOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmitTask} disabled={!newTask.title.trim()}>
                                Create Task
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Task Detail Modal */}
                <Dialog open={isTaskDetailOpen} onOpenChange={setIsTaskDetailOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5" />
                                Task Details
                            </DialogTitle>
                            <DialogDescription>
                                View task information and details
                            </DialogDescription>
                        </DialogHeader>

                        {selectedTask && (
                            <div className="space-y-4">
                                <div className={`p-4 border rounded-lg bg-card border-l-4 ${getTaskBorderColor(selectedTask)}`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className={`text-lg font-semibold ${selectedTask.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                                            {selectedTask.title}
                                        </h3>
                                        <div className="flex gap-2">
                                            <Badge variant="outline" className={getPriorityColor(selectedTask.priority)}>
                                                {selectedTask.priority}
                                            </Badge>
                                            <Badge variant="outline" className={getStatusColor(selectedTask.status)}>
                                                {selectedTask.status.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    </div>

                                    {selectedTask.description && (
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium mb-2">Description</h4>
                                            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                                                {selectedTask.description}
                                            </p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">Due Date:</span>
                                                <span>{selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString() : 'No due date'}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">Project:</span>
                                                <span>{selectedTask.project ? `${selectedTask.project.name} (${selectedTask.project.key})` : 'None'}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {selectedTask.assignees && selectedTask.assignees.length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">Assigned to:</span>
                                                    <span>{selectedTask.assignees.map(a => a.name).join(', ')}</span>
                                                </div>
                                            )}

                                            {selectedTask.created_at && (
                                                <div className="flex items-center gap-2">
                                                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">Created:</span>
                                                    <span>{new Date(selectedTask.created_at).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setIsTaskDetailOpen(false)}>
                                        Close
                                    </Button>
                                    {selectedTask.project ? (
                                        <Button
                                            onClick={() => {
                                                router.visit(route('tasks.show', [selectedTask.project!.id, selectedTask.id]));
                                            }}
                                        >
                                            View Full Task
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => {
                                                router.visit(route('inbox'));
                                            }}
                                        >
                                            Go to Inbox
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
