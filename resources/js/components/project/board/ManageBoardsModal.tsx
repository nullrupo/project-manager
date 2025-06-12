import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Edit, Trash2, Plus } from 'lucide-react';
import { Project } from '@/types/project-manager';
import { route } from 'ziggy-js';

interface ManageBoardsModalProps {
    project: Project;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateBoard: () => void;
}

export default function ManageBoardsModal({ 
    project, 
    open, 
    onOpenChange, 
    onCreateBoard 
}: ManageBoardsModalProps) {
    const [editingBoard, setEditingBoard] = useState<number | null>(null);
    
    const { data, setData, put, delete: destroy, processing } = useForm({
        name: '',
        description: '',
    });

    const handleEditBoard = (board: any) => {
        setEditingBoard(board.id);
        setData({
            name: board.name,
            description: board.description || '',
        });
    };

    const handleSaveBoard = (boardId: number) => {
        put(route('boards.update', { project: project.id, board: boardId }), {
            onSuccess: () => {
                setEditingBoard(null);
            },
        });
    };

    const handleDeleteBoard = (boardId: number) => {
        if (confirm('Are you sure you want to delete this board? This action cannot be undone.')) {
            destroy(route('boards.destroy', { project: project.id, board: boardId }));
        }
    };

    const handleClose = () => {
        setEditingBoard(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Manage Boards
                    </DialogTitle>
                    <DialogDescription>
                        Manage boards for "{project.name}"
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Create New Board Button */}
                    <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
                        <CardContent className="flex items-center justify-center py-8">
                            <Button 
                                variant="ghost" 
                                onClick={() => {
                                    handleClose();
                                    onCreateBoard();
                                }}
                                className="flex flex-col items-center gap-2 h-auto py-4"
                            >
                                <Plus className="h-8 w-8" />
                                <span>Create New Board</span>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Existing Boards */}
                    {project.boards && project.boards.length > 0 ? (
                        <div className="space-y-3">
                            {project.boards.map((board) => (
                                <Card key={board.id}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                {editingBoard === board.id ? (
                                                    <div className="space-y-2">
                                                        <Input
                                                            value={data.name}
                                                            onChange={(e) => setData('name', e.target.value)}
                                                            placeholder="Board name"
                                                        />
                                                        <Input
                                                            value={data.description}
                                                            onChange={(e) => setData('description', e.target.value)}
                                                            placeholder="Board description (optional)"
                                                        />
                                                        <div className="flex gap-2">
                                                            <Button 
                                                                size="sm" 
                                                                onClick={() => handleSaveBoard(board.id)}
                                                                disabled={processing}
                                                            >
                                                                Save
                                                            </Button>
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline"
                                                                onClick={() => setEditingBoard(null)}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <CardTitle className="text-lg">{board.name}</CardTitle>
                                                        {board.description && (
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {board.description}
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                            
                                            {editingBoard !== board.id && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleEditBoard(board)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    {project.boards && project.boards.length > 1 && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDeleteBoard(board.id)}
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    
                                    {board.lists && board.lists.length > 0 && (
                                        <CardContent className="pt-0">
                                            <div className="text-sm text-muted-foreground">
                                                <strong>{board.lists.length}</strong> columns: {' '}
                                                {board.lists.map(list => list.name).join(', ')}
                                            </div>
                                        </CardContent>
                                    )}
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No boards found. Create your first board to get started.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
