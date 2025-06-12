import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Kanban, Layers, Settings } from 'lucide-react';
import InputError from '@/components/input-error';
import { Project } from '@/types/project-manager';
import { route } from 'ziggy-js';

interface CreateBoardModalProps {
    project: Project;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface BoardForm {
    name: string;
    description: string;
    type: 'kanban' | 'scrum' | 'custom';
    background_color: string;
}

const boardTypes = [
    {
        value: 'kanban',
        label: 'Kanban Board',
        description: 'Simple workflow with To Do, In Progress, and Done columns',
        icon: Kanban,
    },
    {
        value: 'scrum',
        label: 'Scrum Board',
        description: 'Sprint-based workflow with Backlog, Sprint, In Progress, and Done',
        icon: Layers,
    },
    {
        value: 'custom',
        label: 'Custom Board',
        description: 'Start with a blank board and create your own workflow',
        icon: Settings,
    },
];

const colorOptions = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Gray', value: '#6b7280' },
    { name: 'Yellow', value: '#eab308' },
];

export default function CreateBoardModal({ project, open, onOpenChange }: CreateBoardModalProps) {
    const { data, setData, post, processing, errors, reset } = useForm<BoardForm>({
        name: '',
        description: '',
        type: 'kanban',
        background_color: '#3b82f6',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('boards.store', project.id), {
            onSuccess: () => {
                handleClose();
            },
        });
    };

    const handleClose = () => {
        reset();
        onOpenChange(false);
    };

    const handleTypeChange = (value: string) => {
        setData('type', value as 'kanban' | 'scrum' | 'custom');
    };

    const handleColorChange = (color: string) => {
        setData('background_color', color);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Create Board
                    </DialogTitle>
                    <DialogDescription>
                        Create a new board to organize tasks in "{project.name}"
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Board Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Board Name</Label>
                        <Input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Enter board name"
                            required
                        />
                        <InputError message={errors.name} />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Describe what this board is for..."
                            rows={3}
                        />
                        <InputError message={errors.description} />
                    </div>

                    {/* Board Type */}
                    <div className="space-y-3">
                        <Label>Board Type</Label>
                        <RadioGroup value={data.type} onValueChange={handleTypeChange}>
                            {boardTypes.map((type) => {
                                const IconComponent = type.icon;
                                return (
                                    <div key={type.value} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                        <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                                        <div className="flex-1">
                                            <Label htmlFor={type.value} className="flex items-center gap-2 font-medium cursor-pointer">
                                                <IconComponent className="h-4 w-4" />
                                                {type.label}
                                            </Label>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {type.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </RadioGroup>
                        <InputError message={errors.type} />
                    </div>

                    {/* Board Color */}
                    <div className="space-y-3">
                        <Label>Board Color</Label>
                        <div className="flex flex-wrap gap-2">
                            {colorOptions.map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                                        data.background_color === color.value
                                            ? 'border-foreground scale-110'
                                            : 'border-muted-foreground/30 hover:border-foreground/50'
                                    }`}
                                    style={{ backgroundColor: color.value }}
                                    onClick={() => handleColorChange(color.value)}
                                    title={color.name}
                                />
                            ))}
                        </div>
                        <InputError message={errors.background_color} />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create Board'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
