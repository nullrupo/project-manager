import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Trash2, Shield } from 'lucide-react';
import { Project, Board } from '@/types/project-manager';
import { route } from 'ziggy-js';
import { cleanupAllModalOverlays } from '@/utils/modalCleanup';

interface DeleteBoardModalProps {
    project: Project;
    board: Board | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function DeleteBoardModal({ project, board, open, onOpenChange }: DeleteBoardModalProps) {
    const [confirmationText, setConfirmationText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        if (!board || confirmationText !== board.name) return;

        setIsDeleting(true);

        router.delete(route('boards.destroy', {
            project: project.id,
            board: board.id
        }), {
            preserveState: false,
            preserveScroll: false,
            onStart: () => {
                // Close modal when request starts
                onOpenChange(false);
            },
            onFinish: () => {
                setIsDeleting(false);
                setConfirmationText('');
                // Clean up any stale overlays
                setTimeout(cleanupAllModalOverlays, 200);
                setTimeout(cleanupAllModalOverlays, 500);
            },
            onError: (errors) => {
                console.error('Failed to delete board:', errors);
                setIsDeleting(false);
                // Reopen modal on error so user can try again
                onOpenChange(true);
            }
        });
    };

    const handleClose = () => {
        setConfirmationText('');
        onOpenChange(false);
        // Clean up overlays after close
        setTimeout(cleanupAllModalOverlays, 100);
    };

    const isConfirmationValid = confirmationText === board?.name;
    const taskCount = board?.lists?.reduce((total, list) => total + (list.tasks?.length || 0), 0) || 0;

    if (!board) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <Trash2 className="h-5 w-5" />
                        Delete Board
                    </DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. This will permanently delete the board and all its data.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Warning Card */}
                    <Card className="border-destructive/20 bg-destructive/5">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-destructive">
                                        Warning: This will permanently delete
                                    </h4>
                                    <ul className="text-sm space-y-1 text-muted-foreground">
                                        <li>• Board: <strong>{board.name}</strong></li>
                                        <li>• {board.lists?.length || 0} columns</li>
                                        <li>• {taskCount} tasks and all their data</li>
                                        <li>• All comments, attachments, and history</li>
                                        <li>• All board-specific settings and customizations</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Default Board Warning */}
                    {board.is_default && (
                        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-amber-800 dark:text-amber-200">
                                            Default Board Warning
                                        </h4>
                                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                            This is the default board for the project. Deleting it may affect project functionality. 
                                            Consider making another board the default before deleting this one.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Confirmation Input */}
                    <div className="space-y-3">
                        <Label htmlFor="confirmation" className="text-sm font-medium">
                            To confirm deletion, type the board name: <strong>{board.name}</strong>
                        </Label>
                        <Input
                            id="confirmation"
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value)}
                            placeholder={`Type "${board.name}" to confirm`}
                            className="font-mono"
                        />
                    </div>

                    {/* Additional Confirmation for Default Board */}
                    {board.is_default && isConfirmationValid && (
                        <Card className="border-destructive/20 bg-destructive/5">
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                    <span className="font-medium text-destructive">
                                        You are about to delete the default board
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleClose}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="button" 
                        variant="destructive" 
                        onClick={handleDelete}
                        disabled={!isConfirmationValid || isDeleting}
                        className="min-w-[100px]"
                    >
                        {isDeleting ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Deleting...
                            </div>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Board
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
