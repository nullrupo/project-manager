import React, { useState } from 'react';
import axios from 'axios';
import { useCsrfToken } from '../csrf-token';
import { router } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface WorkingProjectFormProps {
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

export default function WorkingProjectForm({
    isOpen,
    onClose,
    initialData = {},
    isEditing = false
}: WorkingProjectFormProps) {
    const csrfToken = useCsrfToken();

    const [formData, setFormData] = useState({
        name: initialData.name || '',
        description: initialData.description || '',
        start_date: initialData.start_date || '',
        due_date: initialData.due_date || '',
        auto_calc_complete: initialData.auto_calc_complete !== undefined ? initialData.auto_calc_complete : true,
        percent_complete: initialData.percent_complete || 0,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (checked: boolean) => {
        setFormData(prev => ({ ...prev, auto_calc_complete: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        try {
            const url = isEditing && initialData.id
                ? `/projects/${initialData.id}`
                : '/projects';

            const method = isEditing ? 'put' : 'post';

            const response = await axios({
                method,
                url,
                data: {
                    ...formData,
                    _token: csrfToken
                },
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            console.log('Success:', response.data);

            // Close the form
            onClose();

            // Redirect to the project page or refresh the current page
            if (isEditing) {
                router.visit(`/projects/${initialData.id}`);
            } else if (response.data && response.data.id) {
                router.visit(`/projects/${response.data.id}`);
            } else {
                window.location.reload();
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
                    <DialogTitle>{isEditing ? 'Edit Project' : 'Create New Project'}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update your project details below.'
                            : 'Fill in the details for your new project.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="hidden" name="_token" value={csrfToken} />

                    {isEditing && (
                        <input type="hidden" name="_method" value="PUT" />
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="name">Project Name <span className="text-red-500">*</span></Label>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter project name"
                            required
                        />
                        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
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
                                name="start_date"
                                type="date"
                                value={formData.start_date}
                                onChange={handleChange}
                            />
                            {errors.start_date && <p className="text-sm text-red-500">{errors.start_date}</p>}
                        </div>

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
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="auto_calc_complete"
                            checked={formData.auto_calc_complete}
                            onCheckedChange={handleCheckboxChange}
                        />
                        <Label htmlFor="auto_calc_complete">
                            Automatically calculate completion percentage based on tasks
                        </Label>
                    </div>

                    {!formData.auto_calc_complete && (
                        <div className="space-y-2">
                            <Label htmlFor="percent_complete">Completion Percentage</Label>
                            <Input
                                id="percent_complete"
                                name="percent_complete"
                                type="number"
                                min="0"
                                max="100"
                                value={formData.percent_complete}
                                onChange={handleChange}
                            />
                            {errors.percent_complete && <p className="text-sm text-red-500">{errors.percent_complete}</p>}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : (isEditing ? 'Update Project' : 'Create Project')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
