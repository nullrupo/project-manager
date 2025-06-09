import React, { useState, useEffect, useRef, memo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Save, X } from 'lucide-react';
import { router } from '@inertiajs/react';
import TaskChecklist from '@/components/task-checklist';
import { TagSelector } from '@/components/tag/TagSelector';
import { LabelSelector } from '@/components/label/LabelSelector';
import { useTags } from '@/hooks/useTags';
import { Tag, Label as LabelType } from '@/types/project-manager';

interface TaskInspectorProps {
    task: any;
    onClose: () => void;
    project: any;
    availableTags?: Tag[];
    availableLabels?: LabelType[];
}

// TaskInspector Component (moved outside to prevent recreation on re-renders)
export const TaskInspector = memo(forwardRef<{ saveTask: () => Promise<void> }, TaskInspectorProps>(({
    task: inspectorTask,
    onClose,
    project,
    availableTags = [],
    availableLabels = []
}, ref) => {
    if (!inspectorTask) return null;

    const { createTag, tags: userTags } = useTags();
    const [taskData, setTaskData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        status: 'to_do',
        due_date: '',
        list_id: '',
        tag_ids: [] as number[],
        label_ids: [] as number[]
    });

    // Save state tracking
    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync taskData with inspectorTask when it changes
    useEffect(() => {
        if (inspectorTask) {
            console.log('TaskInspector received task:', {
                id: inspectorTask.id,
                title: inspectorTask.title,
                checklist_items: inspectorTask.checklist_items,
                checklistItems: inspectorTask.checklistItems,
                checklistItemsLength: (inspectorTask.checklist_items || inspectorTask.checklistItems)?.length || 0,
                allKeys: Object.keys(inspectorTask)
            });

            setTaskData({
                title: inspectorTask.title || '',
                description: inspectorTask.description || '',
                priority: inspectorTask.priority || 'medium',
                status: inspectorTask.status || 'to_do',
                due_date: inspectorTask.due_date ? inspectorTask.due_date.split('T')[0] : '',
                list_id: inspectorTask.list_id || inspectorTask.list?.id || '',
                tag_ids: inspectorTask.tags?.map((t: any) => t.id) || [],
                label_ids: inspectorTask.labels?.map((l: any) => l.id) || []
            });
            setHasUnsavedChanges(false);
            setSaveState('idle');
        }
    }, [inspectorTask?.id]); // Only re-run when the task ID changes

    const handleFieldChange = useCallback((field: string, value: any) => {
        // Prevent any potential navigation events
        try {
            setTaskData(prev => ({ ...prev, [field]: value }));
            setHasUnsavedChanges(true);
            setSaveState('idle');
        } catch (error) {
            console.error('Error in handleFieldChange:', error);
        }
    }, []);

    // Manual save function using Inertia (no auto-save)
    const handleManualSave = useCallback(() => {
        if (!inspectorTask || !hasUnsavedChanges) return;

        console.log('💾 Manual save triggered');
        setSaveState('saving');

        // Determine if this is an inbox task
        const isInboxTask = inspectorTask.is_inbox;

        // Prepare the data with fields appropriate for the task type
        const updateData = {
            title: taskData.title || 'Untitled Task',
            description: taskData.description || '',
            priority: taskData.priority || 'medium',
            status: taskData.status || 'to_do',
            due_date: taskData.due_date || null,
            assignee_ids: inspectorTask.assignees?.map((a: any) => a.id) || [],
            label_ids: taskData.label_ids || [],
            tag_ids: taskData.tag_ids || [],
            is_archived: inspectorTask.is_archived || false
        };

        // Add project-specific fields only for non-inbox tasks
        if (!isInboxTask) {
            Object.assign(updateData, {
                start_date: null,
                duration_days: null,
                list_id: taskData.list_id || inspectorTask.list_id || inspectorTask.list?.id,
                reviewer_id: null,
                section_id: null
            });
        }

        console.log('💾 Sending update data:', updateData);

        // Determine the correct route based on whether this is an inbox task
        const updateRoute = isInboxTask
            ? route('inbox.tasks.update', { task: inspectorTask.id })
            : route('tasks.update', { project: project.id, task: inspectorTask.id });

        console.log('📍 Using route:', updateRoute, 'for', isInboxTask ? 'inbox task' : 'project task');

        // Use Inertia's put method for proper Laravel integration
        router.put(updateRoute, updateData, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                console.log('✅ Task saved successfully');
                setHasUnsavedChanges(false);
                setSaveState('saved');

                // Close the inspector after successful save
                setTimeout(() => {
                    onClose();
                }, 500); // Small delay to show the "saved" state
            },
            onError: (errors) => {
                console.error('❌ Save failed:', errors);
                setSaveState('error');

                // Clear error state after 3 seconds
                setTimeout(() => setSaveState('idle'), 3000);
            }
        });
    }, [inspectorTask, hasUnsavedChanges, taskData, project.id, router]);

    // Expose save function to parent components
    useImperativeHandle(ref, () => ({
        saveTask: async () => {
            if (hasUnsavedChanges) {
                return new Promise<void>((resolve, reject) => {
                    handleManualSave();
                    // Wait for save to complete
                    const checkSaveComplete = () => {
                        if (saveState === 'saved') {
                            resolve();
                        } else if (saveState === 'error') {
                            reject(new Error('Save failed'));
                        } else {
                            setTimeout(checkSaveComplete, 100);
                        }
                    };
                    checkSaveComplete();
                });
            }
            return Promise.resolve();
        }
    }), [hasUnsavedChanges, handleManualSave, saveState]);

    return (
        <div ref={containerRef} className="w-96 border-l bg-background flex flex-col h-full">
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
                        rows={3}
                    />
                </div>

                {/* Priority */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <Select
                            value={taskData.priority}
                            onValueChange={(value) => {
                                // Prevent event propagation and navigation
                                try {
                                    handleFieldChange('priority', value);
                                } catch (error) {
                                    console.error('Error changing priority:', error);
                                }
                            }}
                        >
                            <SelectTrigger
                                className="select-trigger"
                                onKeyDown={(e) => {
                                    // Prevent browser extension interference and event bubbling
                                    try {
                                        // Stop all propagation for dropdown navigation keys
                                        if (['ArrowDown', 'ArrowUp', 'Enter', 'Space', 'Escape', 'Tab'].includes(e.key)) {
                                            e.stopPropagation();
                                        }
                                    } catch (error) {
                                        console.error('Keyboard event error:', error);
                                    }
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent
                                className="select-content"
                                onCloseAutoFocus={(e) => {
                                    // Prevent auto-focus from causing issues
                                    e.preventDefault();
                                }}
                            >
                                <SelectItem
                                    value="low"
                                    onSelect={(e) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    Low
                                </SelectItem>
                                <SelectItem
                                    value="medium"
                                    onSelect={(e) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    Medium
                                </SelectItem>
                                <SelectItem
                                    value="high"
                                    onSelect={(e) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    High
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <Select
                            value={taskData.status}
                            onValueChange={(value) => {
                                // Prevent event propagation and navigation
                                try {
                                    handleFieldChange('status', value);
                                } catch (error) {
                                    console.error('Error changing status:', error);
                                }
                            }}
                        >
                            <SelectTrigger
                                className="select-trigger"
                                onKeyDown={(e) => {
                                    // Prevent browser extension interference and event bubbling
                                    try {
                                        // Stop all propagation for dropdown navigation keys
                                        if (['ArrowDown', 'ArrowUp', 'Enter', 'Space', 'Escape', 'Tab'].includes(e.key)) {
                                            e.stopPropagation();
                                        }
                                    } catch (error) {
                                        console.error('Keyboard event error:', error);
                                    }
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent
                                className="select-content"
                                onCloseAutoFocus={(e) => {
                                    // Prevent auto-focus from causing issues
                                    e.preventDefault();
                                }}
                            >
                                <SelectItem
                                    value="to_do"
                                    onSelect={(e) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    To Do
                                </SelectItem>
                                <SelectItem
                                    value="in_progress"
                                    onSelect={(e) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    In Progress
                                </SelectItem>
                                <SelectItem
                                    value="done"
                                    onSelect={(e) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    Done
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
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

                {/* Tags */}
                <TagSelector
                    selectedTags={(inspectorTask.tags || []).filter((tag: any) => taskData.tag_ids.includes(tag.id))}
                    availableTags={availableTags.length > 0 ? availableTags : userTags}
                    onTagsChange={(selectedTags: Tag[]) => {
                        const tagIds = selectedTags.map(tag => tag.id);
                        handleFieldChange('tag_ids', tagIds);
                    }}
                    onCreateTag={createTag}
                    placeholder="Select personal tags..."
                />

                {/* Labels */}
                {(project.can_manage_labels || availableLabels.length > 0) && (
                    <LabelSelector
                        selectedLabels={(inspectorTask.labels || []).filter((label: any) => taskData.label_ids.includes(label.id))}
                        availableLabels={availableLabels}
                        onLabelsChange={(selectedLabels: LabelType[]) => {
                            const labelIds = selectedLabels.map(label => label.id);
                            handleFieldChange('label_ids', labelIds);
                        }}
                        placeholder="Select project labels..."
                        canManageLabels={project.can_manage_labels}
                    />
                )}

                {/* Checklist */}
                <div className="space-y-2">
                    <TaskChecklist task={inspectorTask} checklistItems={inspectorTask.checklistItems || inspectorTask.checklist_items || []} />
                </div>
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
}), (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
        prevProps.task?.id === nextProps.task?.id &&
        prevProps.task?.title === nextProps.task?.title &&
        prevProps.task?.description === nextProps.task?.description &&
        prevProps.task?.priority === nextProps.task?.priority &&
        prevProps.task?.status === nextProps.task?.status &&
        prevProps.task?.due_date === nextProps.task?.due_date &&
        prevProps.onClose === nextProps.onClose &&
        prevProps.project?.id === nextProps.project?.id
    );
});
