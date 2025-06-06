import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit, List, Palette } from 'lucide-react';
import InputError from '@/components/input-error';
import { Project, Board, TaskList } from '@/types/project-manager';

interface EditListModalProps {
    project: Project;
    board: Board;
    list: TaskList;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface EditListForm {
    name: string;
    color: string;
    work_in_progress_limit: number | null;
}

export default function EditListModal({ project, board, list, open, onOpenChange }: EditListModalProps) {
    const { data, setData, put, processing, errors, reset } = useForm<EditListForm>({
        name: list.name,
        color: list.color || '#3498db',
        work_in_progress_limit: list.work_in_progress_limit || null,
    });

    // Predefined colors for quick selection
    const predefinedColors = [
        '#3498db', // Blue
        '#2ecc71', // Green
        '#e74c3c', // Red
        '#f39c12', // Orange
        '#9b59b6', // Purple
        '#1abc9c', // Teal
        '#34495e', // Dark Blue
        '#e67e22', // Dark Orange
        '#8e44ad', // Dark Purple
        '#27ae60', // Dark Green
        '#c0392b', // Dark Red
        '#16a085', // Dark Teal
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('lists.update', { project: project.id, board: board.id, list: list.id }), {
            onSuccess: () => {
                onOpenChange(false);
            },
        });
    };

    const handleClose = () => {
        reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Edit className="h-5 w-5" />
                        Edit List
                    </DialogTitle>
                    <DialogDescription>
                        Update the list name, color, and settings.
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* List Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                            <List className="h-4 w-4" />
                            List Name
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Enter list name"
                            required
                            autoFocus
                        />
                        <InputError message={errors.name} />
                    </div>

                    {/* List Color */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            List Color
                        </Label>
                        <div className="space-y-3">
                            {/* Color picker input */}
                            <div className="flex items-center gap-2">
                                <Input
                                    type="color"
                                    value={data.color}
                                    onChange={(e) => setData('color', e.target.value)}
                                    className="w-16 h-10 p-1 cursor-pointer"
                                />
                                <Input
                                    type="text"
                                    value={data.color}
                                    onChange={(e) => setData('color', e.target.value)}
                                    placeholder="#3498db"
                                    className="flex-1"
                                />
                            </div>
                            
                            {/* Predefined color palette */}
                            <div className="grid grid-cols-6 gap-2">
                                {predefinedColors.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                                            data.color === color
                                                ? 'border-primary ring-2 ring-primary/20'
                                                : 'border-border hover:border-primary/50'
                                        }`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setData('color', color)}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>
                        <InputError message={errors.color} />
                    </div>

                    {/* Work in Progress Limit */}
                    <div className="space-y-2">
                        <Label htmlFor="wip_limit">
                            Work in Progress Limit (Optional)
                        </Label>
                        <Input
                            id="wip_limit"
                            type="number"
                            min="1"
                            value={data.work_in_progress_limit || ''}
                            onChange={(e) => setData('work_in_progress_limit', e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="No limit"
                        />
                        <p className="text-xs text-muted-foreground">
                            Set a maximum number of tasks allowed in this list (useful for Kanban boards)
                        </p>
                        <InputError message={errors.work_in_progress_limit} />
                    </div>

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Updating...' : 'Update List'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
