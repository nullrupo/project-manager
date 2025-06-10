import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UrgencyIndicator } from './UrgencyIndicator';
import { ChecklistProgress } from './ChecklistProgress';
import { TagBadge } from '../tag/TagBadge';
import { useTaskDisplayPreferences } from '@/hooks/use-task-display-preferences';
import { useTaskDisplayPreferencesContext } from '@/contexts/TaskDisplayPreferencesContext';
import { Task } from '@/types/project-manager';
import { Calendar, FileText, User } from 'lucide-react';

interface TaskDisplayProps {
    task: Task;
    className?: string;
    compact?: boolean;
    pageKey?: string; // Optional page key for page-specific preferences
}

export function TaskDisplay({ task, className = '', compact = false, pageKey }: TaskDisplayProps) {
    const globalPrefs = useTaskDisplayPreferences();
    const preferencesContext = useTaskDisplayPreferencesContext();

    // Initialize preferences for this page on mount
    useEffect(() => {
        if (pageKey && pageKey.trim()) {
            preferencesContext.initializePreferences(pageKey);
        }
    }, [pageKey, preferencesContext]);

    // Use page-specific preferences if pageKey is provided, otherwise use global preferences
    const preferences = pageKey && pageKey.trim()
        ? preferencesContext.getPreferences(pageKey)
        : globalPrefs.preferences;





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
            case 'review': return 'bg-purple-100 text-purple-800';
            case 'done': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'to_do': return 'To Do';
            case 'in_progress': return 'Doing';
            case 'review': return 'Review';
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

            {/* Labels and Tags */}
            {(preferences.show_labels || preferences.show_tags) && (
                <div className="flex flex-wrap gap-1">
                    {/* Project Labels */}
                    {preferences.show_labels && task.labels && task.labels.length > 0 && (
                        <>
                            {task.labels.map(label => (
                                <Badge
                                    key={`label-${label.id}`}
                                    variant="secondary"
                                    className="text-xs px-2 py-1 border"
                                    style={{
                                        backgroundColor: `${label.color}20`,
                                        borderColor: label.color,
                                        color: label.color
                                    }}
                                >
                                    {label.name}
                                </Badge>
                            ))}
                        </>
                    )}

                    {/* Personal Tags */}
                    {preferences.show_tags && task.tags && task.tags.length > 0 && (
                        <>
                            {task.tags.map(tag => (
                                <TagBadge key={`tag-${tag.id}`} tag={tag} size="sm" />
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
