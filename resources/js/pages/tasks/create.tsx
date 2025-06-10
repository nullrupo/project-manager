import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Project, Board, TaskList, User, Label as LabelType, Tag } from '@/types/project-manager';
import { TagSelector } from '@/components/tag/TagSelector';
import { LabelSelector } from '@/components/label/LabelSelector';
import { useTags } from '@/hooks/useTags';
import { Head, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle, Calendar, AlertCircle, User as UserIcon, Tag as TagIcon } from 'lucide-react';
import { FormEventHandler } from 'react';

interface TaskCreateForm {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    due_date: string;
    status: 'to_do' | 'in_progress' | 'review' | 'done';
    estimate: string;
    assignee_ids: number[];
    label_ids: number[];
    tag_ids: number[];
    section_id: number | null;
}

interface TaskCreateProps {
    project: Project;
    board: Board;
    list: TaskList;
    members: User[];
    labels: LabelType[];
    tags: Tag[];
}

export default function TaskCreate({ project, board, list, members, labels, tags }: TaskCreateProps) {
    const { props } = usePage();
    const view = (props as any).view || 'list'; // Get view from URL params
    const status = (props as any).status || 'to_do'; // Get status from URL params if provided
    const sectionId = (props as any).section_id; // Get section_id from URL params if provided

    const { createTag } = useTags();
    const { data, setData, post, processing, errors } = useForm<TaskCreateForm>({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        status: status,
        estimate: '',
        assignee_ids: [],
        label_ids: [],
        tag_ids: [],
        section_id: sectionId || null,
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
            title: board.name,
            href: route('boards.show', { project: project.id, board: board.id }),
        },
        {
            title: 'Create Task',
            href: route('tasks.create', { project: project.id, board: board.id, list: list.id }),
        },
    ];

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Simple redirect using the view parameter
        const redirectParams = {
            project: project.id,
            board: board.id,
            list: list.id,
            view: view // Use the view parameter from props
        };

        post(route('tasks.store', redirectParams));
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

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'low': return 'text-green-600';
            case 'medium': return 'text-yellow-600';
            case 'high': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Task" />
            <div className="max-w-3xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Create Task</CardTitle>
                        <CardDescription>
                            Create a new task in <span className="font-medium">{list.name}</span> list
                        </CardDescription>
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

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Describe the task details..."
                                    className="min-h-[120px] resize-none"
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Priority */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        Priority
                                    </Label>
                                    <Select value={data.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setData('priority', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                    <span>Low</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="medium">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                    <span>Medium</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="high">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                    <span>High</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.priority} />
                                </div>

                                {/* Estimate */}
                                <div className="space-y-2">
                                    <Label htmlFor="estimate" className="text-sm font-medium">
                                        Estimate (hours)
                                    </Label>
                                    <Input
                                        id="estimate"
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={data.estimate}
                                        onChange={(e) => setData('estimate', e.target.value)}
                                        placeholder="0"
                                        className="text-base"
                                    />
                                    <InputError message={errors.estimate} />
                                </div>

                                {/* Due Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="due_date" className="text-sm font-medium flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Due Date
                                    </Label>
                                    <Input
                                        id="due_date"
                                        type="date"
                                        value={data.due_date}
                                        onChange={(e) => setData('due_date', e.target.value)}
                                        className="text-base"
                                    />
                                    <InputError message={errors.due_date} />
                                </div>
                            </div>

                            {/* Assignees */}
                            {members && members.length > 0 && (
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
                            {labels && labels.length > 0 && (
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

                            {/* Status */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Status</Label>
                                <Select value={data.status} onValueChange={(value: 'to_do' | 'in_progress' | 'review' | 'done') => setData('status', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
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
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Create Task
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
