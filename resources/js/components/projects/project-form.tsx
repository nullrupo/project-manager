import { useState, useEffect } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ProjectFormProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: {
        id?: number;
        name?: string;
        description?: string;
        start_date?: string;
        due_date?: string;
        auto_calc_complete?: boolean;
        percent_complete?: number;
    };
    isEditing?: boolean;
}

export default function ProjectForm({ isOpen, onClose, initialData = {}, isEditing = false }: ProjectFormProps) {
    const { csrf_token } = usePage().props as any;

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: initialData.name || '',
        description: initialData.description || '',
        start_date: initialData.start_date || '',
        due_date: initialData.due_date || '',
        auto_calc_complete: initialData.auto_calc_complete !== undefined ? initialData.auto_calc_complete : true,
        percent_complete: initialData.percent_complete || 0,
        _token: csrf_token,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        console.log('Form data being submitted:', data);

        if (isEditing && initialData.id) {
            put(`/projects/${initialData.id}`, {
                onSuccess: () => {
                    console.log('Project updated successfully');
                    reset();
                    onClose();
                    window.location.reload(); // Force a page reload
                },
                onError: (errors) => {
                    console.error('Error updating project:', errors);
                    alert('Error updating project. See console for details.');
                }
            });
        } else {
            post('/projects', {
                onSuccess: () => {
                    console.log('Project created successfully');
                    reset();
                    onClose();
                    window.location.reload(); // Force a page reload
                },
                onError: (errors) => {
                    console.error('Error creating project:', errors);
                    alert('Error creating project. See console for details.');
                }
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Project' : 'Create New Project'}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update your project details below.'
                            : 'Fill in the details for your new project.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Project Name <span className="text-red-500">*</span></Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Enter project name"
                            required
                        />
                        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Enter project description"
                            rows={3}
                        />
                        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Start Date</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={data.start_date}
                                onChange={(e) => setData('start_date', e.target.value)}
                            />
                            {errors.start_date && <p className="text-sm text-red-500">{errors.start_date}</p>}
                        </div>

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
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="auto_calc_complete"
                            checked={data.auto_calc_complete}
                            onCheckedChange={(checked) =>
                                setData('auto_calc_complete', checked as boolean)
                            }
                        />
                        <Label htmlFor="auto_calc_complete">
                            Automatically calculate completion percentage based on tasks
                        </Label>
                    </div>

                    {!data.auto_calc_complete && (
                        <div className="space-y-2">
                            <Label htmlFor="percent_complete">Completion Percentage</Label>
                            <Input
                                id="percent_complete"
                                type="number"
                                min="0"
                                max="100"
                                value={data.percent_complete}
                                onChange={(e) => setData('percent_complete', Number(e.target.value))}
                            />
                            {errors.percent_complete && <p className="text-sm text-red-500">{errors.percent_complete}</p>}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEditing ? 'Update Project' : 'Create Project'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
