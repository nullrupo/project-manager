import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Project, Task } from '@/types/project-manager';
import { CalendarDays, Clock, Edit, MessageSquare, Tag, Trash2, User, Eye } from 'lucide-react';

interface TaskViewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: Project;
    task: Task;
    onEdit?: () => void;
}

export default function TaskViewModal({
    open,
    onOpenChange,
    project,
    task,
    onEdit
}: TaskViewModalProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        content: '',
    });

    const submitComment = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('comments.store', { project: project.id, task: task.id }), {
            onSuccess: () => reset('content'),
        });
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'low': return 'bg-green-100 text-green-800 border-green-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'to_do': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'done': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-2xl font-bold flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Eye className="h-6 w-6 text-primary" />
                                </div>
                                <span className="break-words">{task.title}</span>
                            </DialogTitle>
                            <DialogDescription className="text-base">
                                Created by <span className="font-medium">{task.creator?.name}</span> on {new Date(task.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </DialogDescription>
                        </div>
                    </div>

                    {/* Action buttons below the title */}
                    <div className="flex gap-2 pt-2 border-t">
                        {onEdit && (
                            <Button variant="default" size="sm" onClick={onEdit} className="flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                Edit Task
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={() => {
                                const commentForm = document.querySelector('form textarea');
                                if (commentForm) {
                                    commentForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    (commentForm as HTMLTextAreaElement).focus();
                                }
                            }}
                        >
                            <MessageSquare className="h-4 w-4" />
                            Add Comment
                        </Button>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Description */}
                        <div className="bg-muted/30 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                                    <MessageSquare className="h-4 w-4 text-primary" />
                                </div>
                                Description
                            </h3>
                            {task.description ? (
                                <div className="prose prose-sm max-w-none">
                                    <p className="text-foreground leading-relaxed whitespace-pre-wrap bg-background rounded-md p-4 border">
                                        {task.description}
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                                    <p className="text-muted-foreground italic">No description provided.</p>
                                </div>
                            )}
                        </div>

                        {/* Comments Section */}
                        <div className="bg-muted/30 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                                    <MessageSquare className="h-4 w-4 text-primary" />
                                </div>
                                Comments
                                {task.comments && task.comments.length > 0 && (
                                    <Badge variant="secondary" className="ml-2">
                                        {task.comments.length}
                                    </Badge>
                                )}
                            </h3>

                            {/* Add Comment Form */}
                            <form onSubmit={submitComment} className="mb-6">
                                <div className="space-y-3">
                                    <Textarea
                                        value={data.content}
                                        onChange={(e) => setData('content', e.target.value)}
                                        placeholder="Add a comment..."
                                        rows={3}
                                        className="resize-none bg-background"
                                    />
                                    <div className="flex justify-end">
                                        <Button type="submit" size="sm" disabled={processing || !data.content.trim()}>
                                            <MessageSquare className="h-4 w-4 mr-2" />
                                            Add Comment
                                        </Button>
                                    </div>
                                </div>
                            </form>

                            {/* Comments List */}
                            <div className="space-y-4">
                                {task.comments && task.comments.length > 0 ? (
                                    task.comments.map((comment) => (
                                        <div key={comment.id} className="bg-background border rounded-lg p-4 shadow-sm">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <User className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm">{comment.user?.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(comment.created_at).toLocaleString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap ml-13">{comment.content}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                                        <p className="text-muted-foreground text-sm">No comments yet.</p>
                                        <p className="text-muted-foreground text-xs mt-1">Be the first to add a comment!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-muted/30 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                                    <Tag className="h-4 w-4 text-primary" />
                                </div>
                                Task Details
                            </h3>
                            <div className="space-y-6">
                                {/* Priority */}
                                <div className="bg-background rounded-lg p-4 border">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                            <Tag className="h-5 w-5 text-orange-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-muted-foreground">Priority</p>
                                            <Badge variant="outline" className={`${getPriorityColor(task.priority)} font-medium`}>
                                                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="bg-background rounded-lg p-4 border">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Clock className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-muted-foreground">Status</p>
                                            <Badge variant="outline" className={`${getStatusColor(task.status)} font-medium`}>
                                                {task.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Assignees */}
                                <div className="bg-background rounded-lg p-4 border">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                            <User className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-muted-foreground">Assignees</p>
                                            {task.assignees && task.assignees.length > 0 ? (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {task.assignees.map((assignee) => (
                                                        <Badge key={assignee.id} variant="secondary" className="text-xs font-medium">
                                                            {assignee.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground mt-1">No assignees</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Due Date */}
                                <div className="bg-background rounded-lg p-4 border">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                            <CalendarDays className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                                            <p className="text-sm font-medium mt-1">
                                                {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                }) : 'Not set'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Estimate */}
                                {task.estimate && (
                                    <div className="bg-background rounded-lg p-4 border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                                <Clock className="h-5 w-5 text-yellow-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-muted-foreground">Estimate</p>
                                                <p className="text-sm font-medium mt-1">{task.estimate} hours</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Labels */}
                                {task.labels && task.labels.length > 0 && (
                                    <div className="bg-background rounded-lg p-4 border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                                                <Tag className="h-5 w-5 text-pink-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-muted-foreground">Labels</p>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {task.labels.map((label) => (
                                                        <Badge
                                                            key={label.id}
                                                            variant="outline"
                                                            className="text-xs font-medium"
                                                            style={{
                                                                borderColor: label.color,
                                                                color: label.color,
                                                                backgroundColor: `${label.color}10`
                                                            }}
                                                        >
                                                            {label.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* List */}
                                {task.list && (
                                    <div className="bg-background rounded-lg p-4 border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                <Tag className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-muted-foreground">List</p>
                                                <p className="text-sm font-medium mt-1">{task.list.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
