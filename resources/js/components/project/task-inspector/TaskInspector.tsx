import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Save, X } from 'lucide-react';
import { router } from '@inertiajs/react';

interface TaskInspectorProps {
    inspectorTask: any;
    onClose: () => void;
    project: any;
}

// TaskInspector Component (moved outside to prevent recreation on re-renders)
export const TaskInspector = memo(({
    inspectorTask,
    onClose,
    project
}: TaskInspectorProps) => {
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
