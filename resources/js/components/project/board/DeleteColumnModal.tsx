import React from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Project } from '@/types/project-manager';
import { route } from 'ziggy-js';
import { cleanupAllModalOverlays } from '@/utils/modalCleanup';

interface DeleteColumnModalProps {
    project: Project;
    column: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function DeleteColumnModal({ project, column, open, onOpenChange }: DeleteColumnModalProps) {

    const handleDelete = () => {
        if (!column) return;

        router.delete(route('lists.destroy', {
            project: project.id,
            board: column.board_id,
            list: column.id
        }), {
            onStart: () => {
                onOpenChange(false);
            },
            onFinish: () => {
                // Clean up any stale overlays
                cleanupAllModalOverlays();
                setTimeout(cleanupAllModalOverlays, 100);
                setTimeout(cleanupAllModalOverlays, 300);
            }
        });
    };

    const taskCount = column?.tasks?.length || 0;

    return (
        <Dialog open={open && !!column} onOpenChange={(isOpen) => {
            if (!isOpen) {
                onOpenChange(false);
                // Clean up overlays when dialog closes
                setTimeout(cleanupAllModalOverlays, 50);
            }
        }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Delete Column
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete the "{column?.name}" column?
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {taskCount > 0 && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <div className="flex items-center gap-2 text-destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="font-medium">Warning</span>
                            </div>
                            <p className="text-sm text-destructive/80 mt-1">
                                This column contains {taskCount} task{taskCount !== 1 ? 's' : ''}. 
                                Deleting this column will also delete all tasks within it.
                            </p>
                        </div>
                    )}

                    <p className="text-sm text-muted-foreground">
                        This action cannot be undone. All data associated with this column will be permanently removed.
                    </p>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Column
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
