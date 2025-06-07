import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Project, Task } from '@/types/project-manager';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { CalendarDays, Clock, Edit, MessageSquare, Tag, Trash2, User } from 'lucide-react';
import { FormEventHandler } from 'react';
import TaskChecklist from '@/components/task-checklist';

interface TaskShowProps {
    project: Project;
    task: Task;
}

export default function TaskShow({ project, task }: TaskShowProps) {
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
            title: 'Tasks',
            href: route('tasks.index', { project: project.id }),
        },
        {
            title: task.title,
            href: route('tasks.show', { project: project.id, task: task.id }),
        },
    ];

    const { data, setData, post, processing, errors, reset } = useForm({
        content: '',
    });

    const submitComment: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('comments.store', { project: project.id, task: task.id }), {
            onSuccess: () => reset('content'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={task.title} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl">{task.title}</CardTitle>
                                    <CardDescription>
                                        Created by {task.creator?.name} on {new Date(task.created_at).toLocaleDateString()}
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Link href={route('tasks.edit', { project: project.id, task: task.id })}>
                                        <Button variant="outline" size="sm">
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                        </Button>
                                    </Link>
                                    <Link href={route('tasks.destroy', { project: project.id, task: task.id })} method="delete" as="button">
                                        <Button variant="destructive" size="sm">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium mb-2">Description</h3>
                                {task.description ? (
                                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {task.description}
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground italic">No description provided</div>
                                )}
                            </div>

                            <Separator />

                            {/* Checklist Section */}
                            <TaskChecklist task={task} checklistItems={task.checklist_items || []} />

                            <Separator />

                            <div>
                                <h3 className="text-sm font-medium mb-2">Comments</h3>
                                <div className="space-y-4">
                                    {task.comments && task.comments.length > 0 ? (
                                        task.comments.map((comment) => (
                                            <div key={comment.id} className="border rounded-md p-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                                                            {comment.user?.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium">{comment.user?.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {new Date(comment.created_at).toLocaleString()}
                                                                {comment.is_edited && ' (edited)'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="sm">
                                                            <Edit className="h-3 w-3 mr-1" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                if (confirm('Are you sure you want to delete this comment?')) {
                                                                    router.delete(route('comments.destroy', { project: project.id, task: task.id, comment: comment.id }));
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="h-3 w-3 mr-1" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="text-sm whitespace-pre-wrap">{comment.content}</div>
                                                {comment.replies && comment.replies.length > 0 && (
                                                    <div className="mt-4 pl-8 space-y-4">
                                                        {comment.replies.map((reply) => (
                                                            <div key={reply.id} className="border rounded-md p-3">
                                                                <div className="flex justify-between items-start">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                                                                            {reply.user?.name.charAt(0)}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-medium">{reply.user?.name}</p>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                {new Date(reply.created_at).toLocaleString()}
                                                                                {reply.is_edited && ' (edited)'}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-sm whitespace-pre-wrap">{reply.content}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-sm text-muted-foreground italic">No comments yet</div>
                                    )}
                                </div>

                                <form onSubmit={submitComment} className="mt-4">
                                    <div className="space-y-2">
                                        <textarea
                                            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="Add a comment..."
                                            value={data.content}
                                            onChange={(e) => setData('content', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.content} />
                                    </div>
                                    <div className="mt-2 flex justify-end">
                                        <Button type="submit" disabled={processing}>
                                            Add Comment
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Task Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Assignees</p>
                                    {task.assignees && task.assignees.length > 0 ? (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {task.assignees.map((assignee) => (
                                                <div key={assignee.id} className="text-xs bg-muted px-2 py-1 rounded-full">
                                                    {assignee.name}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">None</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                    <Tag className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Labels</p>
                                    {task.labels && task.labels.length > 0 ? (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {task.labels.map((label) => (
                                                <div
                                                    key={label.id}
                                                    className="text-xs px-2 py-1 rounded-full text-white"
                                                    style={{ backgroundColor: label.color }}
                                                >
                                                    {label.name}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">None</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Due Date</p>
                                    {task.due_date ? (
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(task.due_date).toLocaleDateString()}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">None</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Estimate</p>
                                    {task.estimate ? (
                                        <p className="text-sm text-muted-foreground">{task.estimate} points</p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">None</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Comments</p>
                                    <p className="text-sm text-muted-foreground">
                                        {task.comments?.length || 0} comment{(task.comments?.length || 0) !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
