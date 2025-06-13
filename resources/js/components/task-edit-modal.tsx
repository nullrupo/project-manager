import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Project, Task, TaskList, User, Label as ProjectLabel } from '@/types/project-manager';
import { LoaderCircle, Calendar, User as UserIcon, Tag, List, Save, X } from 'lucide-react';
import { useShortName } from '@/hooks/use-initials';

interface TaskEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: Project;
    task: Task;
    members?: User[];
    labels?: ProjectLabel[];
    lists?: TaskList[];
}

interface TaskEditForm {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    status: string;
    estimate: number | null;
    due_date: string;
    list_id: number;
    reviewer_id: string;
    assignee_ids: number[];
    label_ids: number[];
    is_archived: boolean;
}

export default function TaskEditModal({
    open,
    onOpenChange,
    project,
    task,
    members,
    labels,
    lists
}: TaskEditModalProps) {
    const getShortName = useShortName();
    const { data, setData, put, processing, errors, reset } = useForm<TaskEditForm>({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        estimate: task.estimate,
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        list_id: task.list_id || 0,
        reviewer_id: task.reviewer_id?.toString() || 'default',
        assignee_ids: task.assignees?.map(a => a.id) || [],
        label_ids: task.labels?.map(l => l.id) || [],
        is_archived: task.is_archived,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('tasks.update', { project: project.id, task: task.id }), {
            onSuccess: () => {
                onOpenChange(false);
            },
        });
    };

    const handleClose = () => {
        reset();
        onOpenChange(false);
    };

    const handleAssigneeChange = (userId: number, checked: boolean) => {
        if (checked) {
            setData('assignee_ids', [...data.assignee_ids, userId]);
        } else {
            setData('assignee_ids', data.assignee_ids.filter(id => id !== userId));
        }
    };

    const handleLabelChange = (labelId: number, checked: boolean) => {
        if (checked) {
            setData('label_ids', [...data.label_ids, labelId]);
        } else {
            setData('label_ids', data.label_ids.filter(id => id !== labelId));
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader className="pb-3">
                    <DialogTitle className="text-lg flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Edit Task
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-base font-semibold flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Basic Information
                        </h3>

                        <div className="grid gap-4">
                            {/* Task Title */}
                            <div className="space-y-1">
                                <Label htmlFor="title" className="text-sm font-medium">Task Title</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Enter task title"
                                    className={errors.title ? 'border-red-500' : ''}
                                />
                                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                            </div>

                            {/* Description */}
                            <div className="space-y-1">
                                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Describe the task..."
                                    rows={2}
                                    className={`resize-none ${errors.description ? 'border-red-500' : ''}`}
                                />
                                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Task Properties & Timing */}
                    <div className="space-y-4">
                        <h3 className="text-base font-semibold flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Properties & Timing
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <Label className="text-sm font-medium">Priority</Label>
                                <Select value={data.priority} onValueChange={(value: any) => setData('priority', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                Low
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="medium">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                Medium
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="high">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                High
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-sm font-medium">Status</Label>
                                <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="to_do">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                                To Do
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="in_progress">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                In Progress
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="done">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                Done
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="estimate" className="text-sm font-medium">Estimate (hrs)</Label>
                                <Input
                                    id="estimate"
                                    type="number"
                                    value={data.estimate || ''}
                                    onChange={(e) => setData('estimate', e.target.value ? parseInt(e.target.value) : null)}
                                    placeholder="0"
                                    min="0"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="due_date" className="text-sm font-medium">Due Date</Label>
                                <Input
                                    id="due_date"
                                    type="date"
                                    value={data.due_date}
                                    onChange={(e) => setData('due_date', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-sm font-medium">List/Column</Label>
                            <Select value={data.list_id.toString()} onValueChange={(value) => setData('list_id', parseInt(value))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {lists && lists.map((list) => (
                                        <SelectItem key={list.id} value={list.id.toString()}>
                                            {list.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Reviewer field - only show for review projects */}
                        {project.completion_behavior === 'review' && (
                            <div className="space-y-1">
                                <Label className="text-sm font-medium">Reviewer</Label>
                                <Select value={data.reviewer_id} onValueChange={(value) => setData('reviewer_id', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Use project default" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="default">
                                            Use project default ({project.default_reviewer?.name || 'None'})
                                        </SelectItem>
                                        {members && members.map((member) => (
                                            <SelectItem key={member.id} value={member.id.toString()}>
                                                {getShortName(member.name)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Override the project's default reviewer for this task.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Team & Labels */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Assignees */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                <UserIcon className="h-4 w-4" />
                                Assignees
                            </Label>
                            <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
                                <div className="space-y-2">
                                    {members && members.length > 0 ? (
                                        members.map((member) => (
                                            <div key={member.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`assignee-${member.id}`}
                                                    checked={data.assignee_ids.includes(member.id)}
                                                    onCheckedChange={(checked) => handleAssigneeChange(member.id, checked as boolean)}
                                                />
                                                <Label htmlFor={`assignee-${member.id}`} className="text-sm cursor-pointer">
                                                    {getShortName(member.name)}
                                                </Label>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No members available</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Labels */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                <Tag className="h-4 w-4" />
                                Labels
                            </Label>
                            <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
                                <div className="space-y-2">
                                    {labels && labels.length > 0 ? (
                                        labels.map((label) => (
                                            <div key={label.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`label-${label.id}`}
                                                    checked={data.label_ids.includes(label.id)}
                                                    onCheckedChange={(checked) => handleLabelChange(label.id, checked as boolean)}
                                                />
                                                <Label htmlFor={`label-${label.id}`} className="text-sm cursor-pointer flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: label.color }}
                                                    />
                                                    {label.name}
                                                </Label>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No labels available</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Archive Option */}
                    <div className="flex items-center space-x-2 pt-2 border-t">
                        <Checkbox
                            id="is_archived"
                            checked={data.is_archived}
                            onCheckedChange={(checked) => setData('is_archived', checked as boolean)}
                        />
                        <Label htmlFor="is_archived" className="text-sm cursor-pointer">
                            Archive this task
                        </Label>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Update Task
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
