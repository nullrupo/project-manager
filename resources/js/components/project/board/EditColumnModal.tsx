import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit, Trash2 } from 'lucide-react';
import InputError from '@/components/input-error';
import { Project } from '@/types/project-manager';
import { route } from 'ziggy-js';

interface EditColumnModalProps {
    project: Project;
    column: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
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

export default function EditColumnModal({ project, column, open, onOpenChange }: EditColumnModalProps) {
    const { data, setData, put, delete: destroy, processing, errors, reset } = useForm<ColumnForm>({
        name: '',
        color: '#3b82f6',
    });

    // Update form data when column changes
    useEffect(() => {
        if (column) {
            setData({
                name: column.name || '',
                color: column.color || '#3b82f6',
            });
        }
    }, [column]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!column) return;

        put(route('lists.update', { 
            project: project.id, 
            board: column.board_id, 
            list: column.id 
        }), {
            onSuccess: () => {
                handleClose();
            },
        });
    };

    const handleDelete = () => {
        if (!column) return;

        if (confirm(`Are you sure you want to delete the "${column.name}" column? This action cannot be undone.`)) {
            destroy(route('lists.destroy', { 
                project: project.id, 
                board: column.board_id, 
                list: column.id 
            }), {
                onSuccess: () => {
                    handleClose();
                },
            });
        }
    };

    const handleClose = () => {
        reset();
        onOpenChange(false);
    };

    const handleColorChange = (color: string) => {
        setData('color', color);
    };

    if (!column) return null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Edit className="h-5 w-5" />
                        Edit Column
                    </DialogTitle>
                    <DialogDescription>
                        Modify the "{column.name}" column
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
                        <Label>Column Color</Label>
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

                    <DialogFooter className="flex justify-between">
                        <Button 
                            type="button" 
                            variant="destructive" 
                            onClick={handleDelete}
                            disabled={processing}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
