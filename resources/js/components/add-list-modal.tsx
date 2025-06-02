import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, List } from 'lucide-react';
import InputError from '@/components/input-error';
import { Project, Board } from '@/types/project-manager';

interface AddListModalProps {
    project: Project;
    board: Board;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface AddListForm {
    name: string;
}

export default function AddListModal({ project, board, open, onOpenChange }: AddListModalProps) {
    const { data, setData, post, processing, errors, reset } = useForm<AddListForm>({
        name: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('lists.store', { project: project.id, board: board.id }), {
            onSuccess: () => {
                reset();
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
                        <Plus className="h-5 w-5" />
                        Add New List
                    </DialogTitle>
                    <DialogDescription>
                        Create a new list in "{board.name}" board
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
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
                            placeholder="Enter list name (e.g., To Do, In Progress, Done)"
                            required
                            autoFocus
                        />
                        <InputError message={errors.name} />
                    </div>

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create List'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
