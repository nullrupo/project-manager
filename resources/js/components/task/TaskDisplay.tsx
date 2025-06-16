import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UrgencyIndicator } from './UrgencyIndicator';
import { ChecklistProgress } from './ChecklistProgress';
import { TagBadge } from '../tag/TagBadge';
import { useTaskDisplayPreferences } from '@/hooks/use-task-display-preferences';
import { useTaskDisplayPreferencesContext } from '@/contexts/TaskDisplayPreferencesContext';
import { getStatusFromColumnName } from '@/utils/statusMapping';
import { Task } from '@/types/project-manager';
import { Calendar, FileText, User, CheckCircle2 } from 'lucide-react';

interface TaskDisplayProps {
    task: Task;
    className?: string;
    compact?: boolean;
    pageKey?: string; // Optional page key for page-specific preferences
    columnName?: string; // Optional column name to derive status from
}

export function TaskDisplay({ task, className = '', compact = false, pageKey, columnName }: TaskDisplayProps) {
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

    // Determine the display status - use column-derived status if available, otherwise task status
    const displayStatus = columnName ? getStatusFromColumnName(columnName) : task.status;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'to_do': return 'bg-gray-100 text-gray-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'in_review': return 'bg-purple-100 text-purple-800';
            case 'blocked': return 'bg-red-100 text-red-800';
            case 'done': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        // If we have a column name, use it directly as the label
        if (columnName) {
            return columnName;
        }

        // Otherwise use the default status labels
        switch (status) {
            case 'to_do': return 'To Do';
            case 'in_progress': return 'In Progress';
            case 'in_review': return 'In Review';
            case 'blocked': return 'Blocked';
            case 'done': return 'Done';
            default: return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
    };

    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && displayStatus !== 'done';

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Main task info */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className={`font-medium truncate ${displayStatus === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                        </h3>
                        {/* Completion icon next to task name */}
                        {displayStatus === 'done' && (
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        )}
                    </div>
                    {preferences.show_notes && task.description && !compact && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Task metadata */}
            <div className="flex items-center gap-2 text-sm flex-wrap">
                {/* Status */}
                {preferences.show_status && (
                    <Badge variant="outline" className={getStatusColor(displayStatus)}>
                        {getStatusLabel(displayStatus)}
                    </Badge>
                )}

                {/* Due date */}
                {preferences.show_deadline && task.due_date && (
                    <div className={`flex items-center gap-1 whitespace-nowrap ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span className={`${isOverdue ? 'font-medium' : ''}`}>
                            {formatDate(task.due_date)}
                        </span>
                    </div>
                )}

                {/* Checklist progress */}
                {preferences.show_checklist_progress && (
                    <ChecklistProgress checklistItems={task.checklist_items} />
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
