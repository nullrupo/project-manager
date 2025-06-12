import React from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import InputError from '@/components/input-error';
import { Project } from '@/types/project-manager';
import { route } from 'ziggy-js';

interface CreateColumnModalProps {
    project: Project;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentBoardId?: number;
}

interface ColumnForm {
    name: string;
    color?: string;
}

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

export default function CreateColumnModal({ project, open, onOpenChange, currentBoardId }: CreateColumnModalProps) {
    const { data, setData, post, processing, errors, reset } = useForm<ColumnForm>({
        name: '',
        color: '#3b82f6',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Use the current board ID or fall back to the first board
        const boardId = currentBoardId || project.boards?.[0]?.id;
        if (!boardId) {
            console.error('No board found for this project');
            return;
        }

        post(route('lists.store', { project: project.id, board: boardId }), {
            onSuccess: () => {
                handleClose();
            },
        });
    };

    const handleClose = () => {
        reset();
        onOpenChange(false);
    };

    const handleColorChange = (color: string) => {
        setData('color', color);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Add Column
                    </DialogTitle>
                    <DialogDescription>
                        Add a new column to organize your tasks
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Column Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Column Name</Label>
                        <Input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g., To Do, In Progress, Done"
                            required
                        />
                        <InputError message={errors.name} />
                    </div>

                    {/* Column Color */}
                    <div className="space-y-3">
                        <Label>Column Color (Optional)</Label>
                        <div className="flex flex-wrap gap-2">
                            {colorOptions.map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                                        data.color === color.value
                                            ? 'border-foreground scale-110'
                                            : 'border-muted-foreground/30 hover:border-foreground/50'
                                    }`}
                                    style={{ backgroundColor: color.value }}
                                    onClick={() => handleColorChange(color.value)}
                                    title={color.name}
                                />
                            ))}
                        </div>
                        <InputError message={errors.color} />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Adding...' : 'Add Column'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
