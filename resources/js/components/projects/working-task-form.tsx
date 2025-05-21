import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCsrfToken } from '../csrf-token';
import { router } from '@inertiajs/react';

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

interface WorkingTaskFormProps {
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
    onSubmit?: (formData: any) => Promise<void>;
}

export default function WorkingTaskForm({
    isOpen,
    onClose,
    projectId,
    projectMembers,
    availableTags,
    initialData = {},
    isEditing = false,
    onSubmit
}: WorkingTaskFormProps) {
    const csrfToken = useCsrfToken();

    const [formData, setFormData] = useState({
        project_id: projectId,
        title: initialData.title || '',
        description: initialData.description || '',
        assignee_id: initialData.assignee_id || null,
        reviewer_id: initialData.reviewer_id || null,
        due_date: initialData.due_date || '',
        status: initialData.status || 'todo',
    });

    const [selectedTags, setSelectedTags] = useState<number[]>(initialData.tags || []);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value === '' ? null : (name === 'assignee_id' || name === 'reviewer_id' ? parseInt(value) : value)
        }));
    };

    const toggleTag = (tagId: number) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        try {
            const taskData = {
                projectId: projectId,
                title: formData.title,
                description: formData.description,
                assigneeId: formData.assignee_id,
                reviewerId: formData.reviewer_id,
                dueDate: formData.due_date,
                status: formData.status,
                tags: selectedTags
            };

            if (onSubmit) {
                // Use the provided onSubmit function if available
                await onSubmit(taskData);
            } else {
                // Fall back to the original implementation
                const url = isEditing && initialData.id
                    ? `/api/tasks/${initialData.id}`
                    : '/api/tasks';

                const method = isEditing ? 'put' : 'post';

                const response = await axios({
                    method,
                    url,
                    data: {
                        project_id: projectId,
                        title: formData.title,
                        description: formData.description,
                        assignee_id: formData.assignee_id,
                        reviewer_id: formData.reviewer_id,
                        due_date: formData.due_date,
                        status: formData.status,
                        tags: selectedTags
                    },
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });

                console.log('Success:', response.data);
            }

            // Close the form
            onClose();

            // Redirect or refresh if needed
            if (isEditing && initialData.id) {
                router.visit(`/projects/${projectId}`);
            }
        } catch (error: any) {
            console.error('Error:', error);

            if (error.response && error.response.data && error.response.data.errors) {
                setErrors(error.response.data.errors);
            } else {
                alert('An error occurred. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

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
                    <input type="hidden" name="_token" value={csrfToken} />
                    <input type="hidden" name="project_id" value={projectId} />

                    {isEditing && (
                        <input type="hidden" name="_method" value="PUT" />
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="title">Task Title <span className="text-red-500">*</span></Label>
                        <Input
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Enter task title"
                            required
                        />
                        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Enter task description"
                            rows={3}
                        />
                        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="assignee_id">Assignee</Label>
                            <Select
                                value={formData.assignee_id?.toString() || ''}
                                onValueChange={(value) => handleSelectChange('assignee_id', value)}
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
                                value={formData.reviewer_id?.toString() || ''}
                                onValueChange={(value) => handleSelectChange('reviewer_id', value)}
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
                                name="due_date"
                                type="date"
                                value={formData.due_date}
                                onChange={handleChange}
                            />
                            {errors.due_date && <p className="text-sm text-red-500">{errors.due_date}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => handleSelectChange('status', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todo">To Do</SelectItem>
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
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : (isEditing ? 'Update Task' : 'Create Task')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
