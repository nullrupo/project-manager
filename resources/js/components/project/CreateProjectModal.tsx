import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface CreateProjectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface ProjectCreateForm {
    name: string;
    description: string;
    background_color: string;
    icon: string;
    completion_behavior: 'simple' | 'review' | 'custom';
    requires_review: boolean;
    [key: string]: string | boolean;
}

const COLORS = [
    { value: '#4F46E5', label: 'Indigo' },
    { value: '#7C3AED', label: 'Purple' },
    { value: '#EC4899', label: 'Pink' },
    { value: '#F59E0B', label: 'Amber' },
    { value: '#10B981', label: 'Emerald' },
    { value: '#3B82F6', label: 'Blue' },
    { value: '#EF4444', label: 'Red' },
    { value: '#6B7280', label: 'Gray' },
];

const ICONS = [
    { value: '📊', label: 'Chart' },
    { value: '🎯', label: 'Target' },
    { value: '📝', label: 'Note' },
    { value: '📈', label: 'Growth' },
    { value: '💡', label: 'Idea' },
    { value: '🚀', label: 'Rocket' },
    { value: '🎨', label: 'Art' },
    { value: '🔧', label: 'Tool' },
];

export default function CreateProjectModal({ open, onOpenChange }: CreateProjectModalProps) {
    const { data, setData, post, processing, errors, reset } = useForm<ProjectCreateForm>({
        name: '',
        description: '',
        background_color: COLORS[0].value,
        icon: ICONS[0].value,
        completion_behavior: 'simple',
        requires_review: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('projects.store'), {
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create New Project</DialogTitle>
                        <DialogDescription>
                            Create a new project to organize your tasks and collaborate with your team.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Project Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className={cn(errors.name && 'border-red-500')}
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-500">{errors.name}</p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    className={cn(errors.description && 'border-red-500')}
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-500">{errors.description}</p>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label>Project Color</Label>
                                <div className="grid grid-cols-4 gap-2">
                                    {COLORS.map(color => (
                                        <button
                                            key={color.value}
                                            type="button"
                                            className={cn(
                                                'w-full aspect-square rounded-lg border-2 transition-all',
                                                data.background_color === color.value
                                                    ? 'border-primary scale-110'
                                                    : 'border-transparent hover:border-primary/50'
                                            )}
                                            style={{ backgroundColor: color.value }}
                                            onClick={() => setData('background_color', color.value)}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Project Icon</Label>
                                <div className="grid grid-cols-4 gap-2">
                                    {ICONS.map(icon => (
                                        <button
                                            key={icon.value}
                                            type="button"
                                            className={cn(
                                                'w-full aspect-square rounded-lg border-2 text-2xl flex items-center justify-center transition-all',
                                                data.icon === icon.value
                                                    ? 'border-primary scale-110'
                                                    : 'border-transparent hover:border-primary/50'
                                            )}
                                            onClick={() => setData('icon', icon.value)}
                                        >
                                            {icon.value}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Task Completion Behavior</Label>
                            <RadioGroup
                                value={data.completion_behavior}
                                onValueChange={value => setData('completion_behavior', value as 'simple' | 'review' | 'custom')}
                                className="space-y-3"
                            >
                                <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                    <RadioGroupItem value="simple" id="simple" />
                                    <div className="flex-1">
                                        <Label htmlFor="simple" className="font-medium cursor-pointer">Simple</Label>
                                        <p className="text-sm text-muted-foreground">Tasks can be marked as done directly. Best for personal projects.</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                    <RadioGroupItem value="review" id="review" />
                                    <div className="flex-1">
                                        <Label htmlFor="review" className="font-medium cursor-pointer">Review Workflow</Label>
                                        <p className="text-sm text-muted-foreground">Tasks go through a review process before being marked as done. Best for team projects.</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                    <RadioGroupItem value="custom" id="custom" />
                                    <div className="flex-1">
                                        <Label htmlFor="custom" className="font-medium cursor-pointer">Custom</Label>
                                        <p className="text-sm text-muted-foreground">Advanced completion workflow with custom statuses.</p>
                                    </div>
                                </div>
                            </RadioGroup>
                            {data.completion_behavior === 'review' && (
                                <div className="flex items-center space-x-2 mt-2">
                                    <input
                                        type="checkbox"
                                        id="requires_review"
                                        checked={!!data.requires_review}
                                        onChange={e => setData('requires_review', e.target.checked)}
                                    />
                                    <Label htmlFor="requires_review" className="text-sm">
                                        Require review approval for task completion
                                    </Label>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Create Project
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 