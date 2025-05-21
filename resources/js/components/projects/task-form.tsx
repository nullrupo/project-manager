import { useState, useEffect } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface User {
    id: number;
    name: string;
}

interface Tag {
    id: number;
    name: string;
    color: string;
}

interface TaskFormProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: number;
    projectMembers: User[];
    availableTags: Tag[];
    initialData?: {
        id?: number;
        title?: string;
        description?: string;
        assignee_id?: number | null;
        reviewer_id?: number | null;
        due_date?: string;
        status?: string;
        tags?: number[];
    };
    isEditing?: boolean;
}

export default function TaskForm({
    isOpen,
    onClose,
    projectId,
    projectMembers,
    availableTags,
    initialData = {},
    isEditing = false
}: TaskFormProps) {
    const { csrf_token } = usePage().props as any;

    const { data, setData, post, put, processing, errors, reset } = useForm({
        project_id: projectId,
        title: initialData.title || '',
        description: initialData.description || '',
        assignee_id: initialData.assignee_id || null,
        reviewer_id: initialData.reviewer_id || null,
        due_date: initialData.due_date || '',
        status: initialData.status || 'todo',
        tags: initialData.tags || [],
        _token: csrf_token,
    });

    const [selectedTags, setSelectedTags] = useState<number[]>(initialData.tags || []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Update the tags in the form data
        setData('tags', selectedTags);

        console.log('Task form data being submitted:', data);

        if (isEditing && initialData.id) {
            put(`/tasks/${initialData.id}`, {
                onSuccess: () => {
                    console.log('Task updated successfully');
                    reset();
                    onClose();
                    window.location.reload(); // Force a page reload
                },
                onError: (errors) => {
                    console.error('Error updating task:', errors);
                    alert('Error updating task. See console for details.');
                }
            });
        } else {
            post('/tasks', {
                onSuccess: () => {
                    console.log('Task created successfully');
                    reset();
                    onClose();
                    window.location.reload(); // Force a page reload
                },
                onError: (errors) => {
                    console.error('Error creating task:', errors);
                    alert('Error creating task. See console for details.');
                }
            });
        }
    };

    const toggleTag = (tagId: number) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    };

    // Update form data when selectedTags changes
    useEffect(() => {
        setData('tags', selectedTags);
    }, [selectedTags]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Task' : 'Create New Task'}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update your task details below.'
                            : 'Fill in the details for your new task.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Task Title <span className="text-red-500">*</span></Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="Enter task title"
                            required
                        />
                        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Enter task description"
                            rows={3}
                        />
                        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="assignee_id">Assignee</Label>
                            <Select
                                value={data.assignee_id?.toString() || ''}
                                onValueChange={(value) => setData('assignee_id', value ? parseInt(value) : null)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select assignee" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {projectMembers.map((member) => (
                                        <SelectItem key={member.id} value={member.id.toString()}>
                                            {member.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.assignee_id && <p className="text-sm text-red-500">{errors.assignee_id}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reviewer_id">Reviewer</Label>
                            <Select
                                value={data.reviewer_id?.toString() || ''}
                                onValueChange={(value) => setData('reviewer_id', value ? parseInt(value) : null)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select reviewer" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {projectMembers.map((member) => (
                                        <SelectItem key={member.id} value={member.id.toString()}>
                                            {member.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.reviewer_id && <p className="text-sm text-red-500">{errors.reviewer_id}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="due_date">Due Date</Label>
                            <Input
                                id="due_date"
                                type="date"
                                value={data.due_date}
                                onChange={(e) => setData('due_date', e.target.value)}
                            />
                            {errors.due_date && <p className="text-sm text-red-500">{errors.due_date}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={data.status}
                                onValueChange={(value) => setData('status', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todo">Todo</SelectItem>
                                    <SelectItem value="doing">In Progress</SelectItem>
                                    <SelectItem value="review">Review</SelectItem>
                                    <SelectItem value="done">Done</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Tags</Label>
                        <div className="flex flex-wrap gap-2">
                            {availableTags.map((tag) => (
                                <Badge
                                    key={tag.id}
                                    variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                                    style={{
                                        backgroundColor: selectedTags.includes(tag.id) ? tag.color : 'transparent',
                                        borderColor: tag.color,
                                        color: selectedTags.includes(tag.id) ? '#fff' : 'inherit'
                                    }}
                                    className="cursor-pointer"
                                    onClick={() => toggleTag(tag.id)}
                                >
                                    {tag.name}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEditing ? 'Update Task' : 'Create Task'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
