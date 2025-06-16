import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Settings, Plus, Edit, Trash2, MoreHorizontal, Shield, Palette } from 'lucide-react';
import { Project, Board } from '@/types/project-manager';
import EditBoardModal from './EditBoardModal';
import DeleteBoardModal from './DeleteBoardModal';

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
    const [editBoardModalOpen, setEditBoardModalOpen] = useState(false);
    const [deleteBoardModalOpen, setDeleteBoardModalOpen] = useState(false);
    const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);

    const handleClose = () => {
        onOpenChange(false);
    };

    const handleEditBoard = (board: Board) => {
        setSelectedBoard(board);
        setEditBoardModalOpen(true);
    };

    const handleDeleteBoard = (board: Board) => {
        setSelectedBoard(board);
        setDeleteBoardModalOpen(true);
    };

    const getBoardTypeIcon = (type: string) => {
        switch (type) {
            case 'scrum':
                return <Settings className="h-4 w-4" />;
            case 'custom':
                return <Palette className="h-4 w-4" />;
            default:
                return <Settings className="h-4 w-4" />;
        }
    };

    const getBoardTypeLabel = (type: string) => {
        switch (type) {
            case 'kanban':
                return 'Kanban';
            case 'scrum':
                return 'Scrum';
            case 'custom':
                return 'Custom';
            default:
                return 'Board';
        }
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
                                className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-accent hover:text-accent-foreground hover:scale-105 transition-all duration-200"
                            >
                                <Plus className="h-8 w-8" />
                                <span>Create New Board</span>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Existing Boards */}
                    {project.boards && project.boards.length > 0 ? (
                        <div className="space-y-3">
                            {project.boards.map((board) => {
                                const taskCount = board.lists?.reduce((total, list) => total + (list.tasks?.length || 0), 0) || 0;

                                return (
                                    <Card key={board.id} className="relative board-card transition-all duration-200 hover:shadow-lg">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <CardTitle className="text-lg">{board.name}</CardTitle>
                                                        {board.is_default && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                <Shield className="h-3 w-3 mr-1" />
                                                                Default
                                                            </Badge>
                                                        )}
                                                        <Badge variant="outline" className="text-xs">
                                                            {getBoardTypeIcon(board.type)}
                                                            <span className="ml-1">{getBoardTypeLabel(board.type)}</span>
                                                        </Badge>
                                                    </div>
                                                    {board.description && (
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {board.description}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Board Actions */}
                                                {project.can_edit && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground hover:scale-110 transition-all duration-200">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => handleEditBoard(board)}
                                                            >
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Edit Board
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => handleDeleteBoard(board)}
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete Board
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                        </CardHeader>

                                        <CardContent className="pt-0">
                                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                <div>
                                                    <strong>{board.lists?.length || 0}</strong> columns
                                                    {board.lists && board.lists.length > 0 && (
                                                        <span className="ml-2">
                                                            ({board.lists.map(list => list.name).join(', ')})
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <strong>{taskCount}</strong> tasks
                                                </div>
                                            </div>

                                            {/* Board Color Indicator */}
                                            {board.background_color && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div
                                                        className="w-4 h-4 rounded border"
                                                        style={{ backgroundColor: board.background_color }}
                                                    />
                                                    <span className="text-xs text-muted-foreground">
                                                        Theme Color
                                                    </span>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No boards found. Create your first board to get started.</p>
                        </div>
                    )}
                </div>
            </DialogContent>

            {/* Edit Board Modal */}
            <EditBoardModal
                project={project}
                board={selectedBoard}
                open={editBoardModalOpen}
                onOpenChange={setEditBoardModalOpen}
            />

            {/* Delete Board Modal */}
            <DeleteBoardModal
                project={project}
                board={selectedBoard}
                open={deleteBoardModalOpen}
                onOpenChange={setDeleteBoardModalOpen}
            />
        </Dialog>
    );
}
