import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Project, Task, TaskList, User, Label as ProjectLabel, Tag } from '@/types/project-manager';
import { TagSelector } from '@/components/tag/TagSelector';
import { LabelSelector } from '@/components/label/LabelSelector';
import { useTags } from '@/hooks/useTags';
import { Head, useForm, Link } from '@inertiajs/react';
import { LoaderCircle, Calendar, User as UserIcon, Tag, List, ArrowLeft, Save } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface TaskEditProps {
    project: Project;
    task: Task;
    members: User[];
    labels: ProjectLabel[];
    tags: Tag[];
    lists: TaskList[];
}

interface TaskEditForm {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    status: string;
    estimate: number | null;
    due_date: string;
    list_id: number;
    assignee_ids: number[];
    label_ids: number[];
    tag_ids: number[];
    is_archived: boolean;
}

export default function TaskEdit({ project, task, members, labels, tags, lists }: TaskEditProps) {
    const { createTag } = useTags();
    const { data, setData, put, processing, errors } = useForm<TaskEditForm>({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        estimate: task.estimate,
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        list_id: task.list_id || 0,
        assignee_ids: task.assignees?.map(a => a.id) || [],
        label_ids: task.labels?.map(l => l.id) || [],
        tag_ids: task.tags?.map(t => t.id) || [],
        is_archived: task.is_archived,
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Projects',
            href: route('projects.index'),
        },
        {
            title: project.name,
            href: route('projects.show', { project: project.id }),
        },
        {
            title: task.title,
            href: route('tasks.show', { project: project.id, task: task.id }),
        },
        {
            title: 'Edit',
            href: route('tasks.edit', { project: project.id, task: task.id }),
        },
    ];

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('tasks.update', { project: project.id, task: task.id }));
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

    const handleLabelsChange = (selectedLabels: LabelType[]) => {
        setData('label_ids', selectedLabels.map(label => label.id));
    };

    const handleTagsChange = (selectedTags: Tag[]) => {
        setData('tag_ids', selectedTags.map(tag => tag.id));
    };

    const handleCreateTag = async (name: string, color: string): Promise<Tag> => {
        return await createTag(name, color);
    };

    const priorityColors = {
        low: 'bg-blue-100 text-blue-800',
        medium: 'bg-yellow-100 text-yellow-800',
        high: 'bg-red-100 text-red-800',
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${task.title}`} />
            <div className="max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Link href={route('tasks.show', { project: project.id, task: task.id })}>
                                <Button variant="outline" size="sm">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Task
                                </Button>
                            </Link>
                            <div>
                                <CardTitle>Edit Task</CardTitle>
                                <CardDescription>Update task details and settings</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <form onSubmit={submit}>
                        <CardContent className="space-y-6">
                            {/* Task Title */}
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-sm font-medium">Task Title</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Enter task title"
                                    required
                                    className="text-base"
                                />
                                <InputError message={errors.title} />
                            </div>

                            {/* Task Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Describe the task..."
                                    className="min-h-[120px] resize-none"
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Priority */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Priority</Label>
                                    <Select value={data.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setData('priority', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(['low', 'medium', 'high'] as const).map((priority) => (
                                                <SelectItem key={priority} value={priority}>
                                                    <div className="flex items-center gap-2">
                                                        <Badge className={priorityColors[priority]}>
                                                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                                        </Badge>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.priority} />
                                </div>

                                {/* Status */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Status</Label>
                                    <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="to_do">To Do</SelectItem>
                                            <SelectItem value="in_progress">Doing</SelectItem>
                                            <SelectItem value="review">Review</SelectItem>
                                            <SelectItem value="done">Done</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.status} />
                                </div>

                                {/* Estimate */}
                                <div className="space-y-2">
                                    <Label htmlFor="estimate" className="text-sm font-medium">Estimate (hours)</Label>
                                    <Input
                                        id="estimate"
                                        type="number"
                                        min="0"
                                        value={data.estimate || ''}
                                        onChange={(e) => setData('estimate', e.target.value ? parseInt(e.target.value) : null)}
                                        placeholder="0"
                                    />
                                    <InputError message={errors.estimate} />
                                </div>

                                {/* Due Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="due_date" className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Due Date
                                    </Label>
                                    <Input
                                        id="due_date"
                                        type="date"
                                        value={data.due_date}
                                        onChange={(e) => setData('due_date', e.target.value)}
                                    />
                                    <InputError message={errors.due_date} />
                                </div>
                            </div>

                            {/* List Selection */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <List className="h-4 w-4" />
                                    List
                                </Label>
                                <Select value={data.list_id.toString()} onValueChange={(value) => setData('list_id', parseInt(value))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {lists.map((list) => (
                                            <SelectItem key={list.id} value={list.id.toString()}>
                                                {list.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.list_id} />
                            </div>

                            {/* Assignees */}
                            {members.length > 0 && (
                                <div className="space-y-3">
                                    <Label className="flex items-center gap-2">
                                        <UserIcon className="h-4 w-4" />
                                        Assignees
                                    </Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {members.map((member) => (
                                            <div key={member.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`assignee-${member.id}`}
                                                    checked={data.assignee_ids.includes(member.id)}
                                                    onCheckedChange={(checked) => handleAssigneeChange(member.id, checked as boolean)}
                                                />
                                                <Label htmlFor={`assignee-${member.id}`} className="text-sm font-normal cursor-pointer">
                                                    {member.name}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                    <InputError message={errors.assignee_ids} />
                                </div>
                            )}

                            {/* Labels */}
                            {labels.length > 0 && (
                                <LabelSelector
                                    selectedLabels={labels.filter(label => data.label_ids.includes(label.id))}
                                    availableLabels={labels}
                                    onLabelsChange={handleLabelsChange}
                                    placeholder="Select project labels..."
                                    canManageLabels={project.can_manage_labels}
                                />
                            )}

                            {/* Tags */}
                            <TagSelector
                                selectedTags={tags.filter(tag => data.tag_ids.includes(tag.id))}
                                availableTags={tags}
                                onTagsChange={handleTagsChange}
                                onCreateTag={handleCreateTag}
                                placeholder="Select personal tags..."
                            />

                            {/* Archive Option */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_archived"
                                    checked={data.is_archived}
                                    onCheckedChange={(checked) => setData('is_archived', checked as boolean)}
                                />
                                <Label htmlFor="is_archived" className="text-sm font-normal cursor-pointer">
                                    Archive this task
                                </Label>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Link href={route('tasks.show', { project: project.id, task: task.id })}>
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" disabled={processing}>
                                {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" />
                                Update Task
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
