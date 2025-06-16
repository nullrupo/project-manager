import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Edit, Palette, Settings, Layers, Kanban } from 'lucide-react';
import InputError from '@/components/input-error';
import { Project, Board } from '@/types/project-manager';
import { route } from 'ziggy-js';

interface EditBoardModalProps {
    project: Project;
    board: Board | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface BoardForm {
    name: string;
    description: string;
    type: 'kanban' | 'scrum' | 'custom';
    background_color: string;
    column_outline_style: 'none' | 'subtle' | 'bold' | 'rounded' | 'shadow';
    column_spacing: 'compact' | 'normal' | 'wide';
    card_style: 'minimal' | 'detailed' | 'compact';
    show_task_count: boolean;
    show_wip_limits: boolean;
    enable_swimlanes: boolean;
}

const boardTypes = [
    {
        value: 'kanban',
        label: 'Kanban Board',
        description: 'Simple workflow with customizable columns',
        icon: Kanban,
    },
    {
        value: 'scrum',
        label: 'Scrum Board',
        description: 'Sprint-based workflow with backlog management',
        icon: Layers,
    },
    {
        value: 'custom',
        label: 'Custom Board',
        description: 'Fully customizable workflow and layout',
        icon: Settings,
    },
];

const columnOutlineStyles = [
    { value: 'none', label: 'None', description: 'No column borders' },
    { value: 'subtle', label: 'Subtle', description: 'Light gray borders' },
    { value: 'bold', label: 'Bold', description: 'Strong borders with accent colors' },
    { value: 'rounded', label: 'Rounded', description: 'Rounded corners with soft borders' },
    { value: 'shadow', label: 'Shadow', description: 'Drop shadow effect' },
    { value: 'single', label: 'Single Line', description: 'Clean single line borders' },
    { value: 'spaced', label: 'Spaced', description: 'Borders with spacing gaps' },
    { value: 'double', label: 'Double Line', description: 'Double line borders' },
    { value: 'dashed', label: 'Dashed', description: 'Dashed line borders' },
    { value: 'dotted', label: 'Dotted', description: 'Dotted line borders' },
    { value: 'gradient', label: 'Gradient', description: 'Gradient colored borders' },
];

const columnSpacingOptions = [
    { value: 'compact', label: 'Compact', description: 'Minimal spacing between columns' },
    { value: 'normal', label: 'Normal', description: 'Standard spacing' },
    { value: 'wide', label: 'Wide', description: 'Extra spacing for better readability' },
];

const cardStyleOptions = [
    { value: 'minimal', label: 'Minimal', description: 'Clean, simple card design' },
    { value: 'detailed', label: 'Detailed', description: 'Rich information display' },
    { value: 'compact', label: 'Compact', description: 'Dense layout for more tasks' },
];

const backgroundColors = [
    '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6b7280',
    '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#06b6d4', '#8b5cf6'
];

export default function EditBoardModal({ project, board, open, onOpenChange }: EditBoardModalProps) {
    const { data, setData, put, processing, errors, reset } = useForm<BoardForm>({
        name: '',
        description: '',
        type: 'kanban',
        background_color: '#3b82f6',
        column_outline_style: 'subtle',
        column_spacing: 'normal',
        card_style: 'detailed',
        show_task_count: true,
        show_wip_limits: false,
        enable_swimlanes: false,
    });

    // Update form data when board changes
    useEffect(() => {
        if (board) {
            setData({
                name: board.name || '',
                description: board.description || '',
                type: board.type || 'kanban',
                background_color: board.background_color || '#3b82f6',
                column_outline_style: (board as any).column_outline_style || 'subtle',
                column_spacing: (board as any).column_spacing || 'normal',
                card_style: (board as any).card_style || 'detailed',
                show_task_count: (board as any).show_task_count ?? true,
                show_wip_limits: (board as any).show_wip_limits ?? false,
                enable_swimlanes: (board as any).enable_swimlanes ?? false,
            });
        }
    }, [board]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!board) return;

        put(route('boards.update', { 
            project: project.id, 
            board: board.id 
        }), {
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

    if (!board) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Edit className="h-5 w-5" />
                        Edit Board: {board.name}
                    </DialogTitle>
                    <DialogDescription>
                        Customize your board settings, appearance, and behavior
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Basic Information</CardTitle>
                            <CardDescription>Configure the board name and description</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Board Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Enter board name"
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Describe the purpose of this board"
                                    rows={3}
                                />
                                <InputError message={errors.description} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Board Type */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Board Type</CardTitle>
                            <CardDescription>Choose the workflow type for this board</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RadioGroup value={data.type} onValueChange={handleTypeChange}>
                                <div className="grid gap-4">
                                    {boardTypes.map((type) => (
                                        <div key={type.value} className="flex items-start space-x-3">
                                            <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                                            <div className="flex-1">
                                                <Label htmlFor={type.value} className="flex items-center gap-2 font-medium">
                                                    <type.icon className="h-4 w-4" />
                                                    {type.label}
                                                </Label>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {type.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </RadioGroup>
                            <InputError message={errors.type} />
                        </CardContent>
                    </Card>

                    {/* Appearance Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Palette className="h-5 w-5" />
                                Appearance
                            </CardTitle>
                            <CardDescription>Customize the visual appearance of your board</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Background Color */}
                            <div className="space-y-3">
                                <Label>Background Color</Label>
                                <div className="flex flex-wrap gap-2">
                                    {backgroundColors.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                                data.background_color === color 
                                                    ? 'border-foreground scale-110' 
                                                    : 'border-border hover:scale-105'
                                            }`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => handleColorChange(color)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            {/* Column Outline Style */}
                            <div className="space-y-3">
                                <Label>Column Outline Style</Label>
                                <Select value={data.column_outline_style} onValueChange={(value) => setData('column_outline_style', value as any)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {columnOutlineStyles.map((style) => (
                                            <SelectItem key={style.value} value={style.value} className="text-left">
                                                <div className="text-left w-full">
                                                    <div className="font-medium text-left">{style.label}</div>
                                                    <div className="text-sm text-muted-foreground text-left">{style.description}</div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Column Spacing */}
                            <div className="space-y-3">
                                <Label>Column Spacing</Label>
                                <Select value={data.column_spacing} onValueChange={(value) => setData('column_spacing', value as any)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {columnSpacingOptions.map((spacing) => (
                                            <SelectItem key={spacing.value} value={spacing.value} className="text-left">
                                                <div className="text-left w-full">
                                                    <div className="font-medium text-left">{spacing.label}</div>
                                                    <div className="text-sm text-muted-foreground text-left">{spacing.description}</div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Card Style */}
                            <div className="space-y-3">
                                <Label>Task Card Style</Label>
                                <Select value={data.card_style} onValueChange={(value) => setData('card_style', value as any)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cardStyleOptions.map((style) => (
                                            <SelectItem key={style.value} value={style.value} className="text-left">
                                                <div className="text-left w-full">
                                                    <div className="font-medium text-left">{style.label}</div>
                                                    <div className="text-sm text-muted-foreground text-left">{style.description}</div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
