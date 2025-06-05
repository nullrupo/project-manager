import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Task, Project } from '@/types/project-manager';
import { ChevronDown, ChevronRight, Plus, Eye, User } from 'lucide-react';
import { useShortName } from '@/hooks/use-initials';

interface TaskWithSubtasksProps {
    task: Task;
    project: Project;
    onToggleCompletion: (taskId: number) => void;
    onEdit: (task: Task) => void;
    onView: (task: Task) => void;
    onAddSubtask?: (parentTaskId: number) => void;
    canEdit: boolean;
}

export default function TaskWithSubtasks({
    task,
    project,
    onToggleCompletion,
    onEdit,
    onView,
    onAddSubtask,
    canEdit
}: TaskWithSubtasksProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const getShortName = useShortName();

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'low': return 'bg-green-500';
            case 'medium': return 'bg-yellow-500';
            case 'high': return 'bg-orange-500';
            case 'urgent': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'to_do': return 'text-gray-600';
            case 'in_progress': return 'text-blue-600';
            case 'done': return 'text-green-600';
            default: return 'text-gray-600';
        }
    };

    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const completedSubtasks = task.subtasks?.filter(subtask => subtask.status === 'done').length || 0;
    const totalSubtasks = task.subtasks?.length || 0;

    const handleTaskClick = (e: React.MouseEvent) => {
        if (e.detail === 2) { // Double click
            onEdit(task);
        } else { // Single click
            onView(task);
        }
    };

    return (
        <div className="space-y-2">
            <Card className={`cursor-pointer transition-all duration-150 hover:shadow-md ${
                task.status === 'done' ? 'opacity-75' : ''
            }`}>
                <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                        {/* Completion checkbox */}
                        <Checkbox
                            checked={task.status === 'done'}
                            onCheckedChange={() => onToggleCompletion(task.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1"
                        />

                        {/* Task content */}
                        <div className="flex-1 min-w-0" onClick={handleTaskClick}>
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <h4 className={`font-medium text-sm ${
                                        task.status === 'done' ? 'line-through text-muted-foreground' : ''
                                    }`}>
                                        {task.title}
                                    </h4>
                                    {task.description && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {task.description}
                                        </p>
                                    )}
                                </div>

                                {/* Priority indicator */}
                                <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                            </div>

                            {/* Task metadata */}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {/* Status */}
                                <Badge variant="outline" className={`text-xs ${getStatusColor(task.status)}`}>
                                    {task.status.replace('_', ' ')}
                                </Badge>

                                {/* Review status */}
                                {project.completion_behavior === 'review' && task.review_status && (
                                    <Badge 
                                        variant="outline" 
                                        className={`text-xs ${
                                            task.review_status === 'approved' ? 'text-green-600 border-green-600' :
                                            task.review_status === 'rejected' ? 'text-red-600 border-red-600' :
                                            'text-yellow-600 border-yellow-600'
                                        }`}
                                    >
                                        {task.review_status}
                                    </Badge>
                                )}

                                {/* Assignees */}
                                {task.assignees && task.assignees.length > 0 && (
                                    <div className="flex items-center gap-1">
                                        <User className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">
                                            {task.assignees.map(a => getShortName(a.name)).join(', ')}
                                        </span>
                                    </div>
                                )}

                                {/* Reviewer */}
                                {project.completion_behavior === 'review' && (task.reviewer || project.default_reviewer) && (
                                    <div className="flex items-center gap-1">
                                        <Eye className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">
                                            {task.reviewer ? 
                                                getShortName(task.reviewer.name) : 
                                                `${getShortName(project.default_reviewer!.name)} (default)`
                                            }
                                        </span>
                                    </div>
                                )}

                                {/* Subtask count */}
                                {hasSubtasks && (
                                    <Badge variant="secondary" className="text-xs">
                                        {completedSubtasks}/{totalSubtasks} subtasks
                                    </Badge>
                                )}

                                {/* Checklist progress */}
                                {task.checklist_items && task.checklist_items.length > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                        {task.checklist_items.filter(item => item.is_completed).length}/
                                        {task.checklist_items.length} checklist
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Expand/collapse button for subtasks */}
                        {hasSubtasks && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsExpanded(!isExpanded);
                                }}
                                className="p-1 h-6 w-6"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </Button>
                        )}

                        {/* Add subtask button */}
                        {canEdit && onAddSubtask && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddSubtask(task.id);
                                }}
                                className="p-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Subtasks */}
            {hasSubtasks && isExpanded && (
                <div className="ml-6 space-y-2">
                    {task.subtasks!.map((subtask) => (
                        <TaskWithSubtasks
                            key={subtask.id}
                            task={subtask}
                            project={project}
                            onToggleCompletion={onToggleCompletion}
                            onEdit={onEdit}
                            onView={onView}
                            onAddSubtask={onAddSubtask}
                            canEdit={canEdit}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
