import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UrgencyIndicator } from './UrgencyIndicator';
import { ChecklistProgress } from './ChecklistProgress';
import { useTaskDisplayPreferences } from '@/hooks/use-task-display-preferences';
import { Task } from '@/types/project-manager';
import { Calendar, FileText, User } from 'lucide-react';

interface TaskDisplayProps {
    task: Task;
    className?: string;
    compact?: boolean;
}

export function TaskDisplay({ task, className = '', compact = false }: TaskDisplayProps) {
    const { preferences } = useTaskDisplayPreferences();

    const formatDate = (dateString: string | null) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'to_do': return 'bg-gray-100 text-gray-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'done': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'to_do': return 'To Do';
            case 'in_progress': return 'In Progress';
            case 'done': return 'Done';
            default: return status;
        }
    };

    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Main task info */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <h3 className={`font-medium truncate ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                    </h3>
                    {preferences.show_notes && task.description && !compact && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                        </p>
                    )}
                </div>
                
                {/* Urgency indicator */}
                {preferences.show_urgency && (
                    <UrgencyIndicator priority={task.priority} />
                )}
            </div>

            {/* Task metadata */}
            <div className="flex items-center gap-3 text-sm">
                {/* Status */}
                {preferences.show_status && (
                    <Badge variant="outline" className={getStatusColor(task.status)}>
                        {getStatusLabel(task.status)}
                    </Badge>
                )}

                {/* Due date */}
                {preferences.show_deadline && task.due_date && (
                    <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                        <Calendar className="h-3 w-3" />
                        <span className={isOverdue ? 'font-medium' : ''}>
                            {formatDate(task.due_date)}
                            {isOverdue && ' (Overdue)'}
                        </span>
                    </div>
                )}

                {/* Checklist progress */}
                {preferences.show_checklist_progress && (
                    <ChecklistProgress checklistItems={task.checklist_items} />
                )}

                {/* Assignees */}
                {preferences.show_assignee && task.assignees && task.assignees.length > 0 && (
                    <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <div className="flex -space-x-1">
                            {task.assignees.slice(0, 3).map((assignee) => (
                                <Avatar key={assignee.id} className="h-5 w-5 border border-background">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${assignee.name}`} />
                                    <AvatarFallback className="text-xs">
                                        {assignee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                            {task.assignees.length > 3 && (
                                <div className="h-5 w-5 rounded-full bg-muted border border-background flex items-center justify-center text-xs text-muted-foreground">
                                    +{task.assignees.length - 3}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Notes indicator */}
                {preferences.show_notes && task.description && compact && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <FileText className="h-3 w-3" />
                    </div>
                )}
            </div>
        </div>
    );
}
