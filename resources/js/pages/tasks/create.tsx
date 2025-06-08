import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Project, Board, TaskList } from '@/types/project-manager';
import { Head, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle, Calendar, AlertCircle, User } from 'lucide-react';
import { FormEventHandler } from 'react';

interface TaskCreateForm {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    due_date: string;
    status: 'to_do' | 'in_progress' | 'done';
    estimate: string;
    assignee_ids: number[];
    label_ids: number[];
    section_id: number | null;
}

interface TaskCreateProps {
    project: Project;
    board: Board;
    list: TaskList;
}

export default function TaskCreate({ project, board, list }: TaskCreateProps) {
    const { props } = usePage();
    const tab = (props as any).tab || 'list'; // Get tab from URL params
    const status = (props as any).status || 'to_do'; // Get status from URL params if provided
    const sectionId = (props as any).section_id; // Get section_id from URL params if provided

    const { data, setData, post, processing, errors } = useForm<TaskCreateForm>({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        status: status,
        estimate: '',
        assignee_ids: [],
        label_ids: [],
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
        post(route('tasks.store', { project: project.id, board: board.id, list: list.id, tab }));
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

                            {/* Status */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Status</Label>
                                <Select value={data.status} onValueChange={(value: 'to_do' | 'in_progress' | 'done') => setData('status', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="to_do">To Do</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
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
