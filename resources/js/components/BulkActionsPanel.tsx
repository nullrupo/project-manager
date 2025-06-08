import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckSquare, Trash2, ArrowRight } from 'lucide-react';

interface Task {
    id: number;
    title: string;
    status: 'to_do' | 'in_progress' | 'done';
}

interface BulkActionsPanelProps {
    selectedTasks: Set<number>;
    onClearSelection: () => void;
    onToggleCompletion: () => void;
    onDelete: () => void;
    onMoveToProject?: () => void;
    getCompletionState: () => {
        allCompleted: boolean;
        hasIncomplete: boolean;
        completedCount: number;
        totalCount: number;
    };
    showMoveToProject?: boolean;
    isProcessing?: boolean;
}

export function BulkActionsPanel({
    selectedTasks,
    onClearSelection,
    onToggleCompletion,
    onDelete,
    onMoveToProject,
    getCompletionState,
    showMoveToProject = false,
    isProcessing = false
}: BulkActionsPanelProps) {
    if (selectedTasks.size === 0) return null;

    const { allCompleted } = getCompletionState();

    const handleDelete = () => {
        onDelete();
    };

    return (
        <>
            {/* Floating Bulk Actions Panel */}
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                <div className="bg-background border border-border rounded-lg shadow-lg p-4 flex items-center gap-3">
                    <span className="text-sm font-medium">
                        {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onToggleCompletion}
                            disabled={isProcessing}
                        >
                            <CheckSquare className="h-4 w-4 mr-1" />
                            {allCompleted ? 'Mark as Not Done' : 'Mark as Done'}
                        </Button>
                        
                        {showMoveToProject && onMoveToProject && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onMoveToProject}
                                disabled={isProcessing}
                            >
                                <ArrowRight className="h-4 w-4 mr-1" />
                                Move to Project
                            </Button>
                        )}
                        
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isProcessing}
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                        </Button>
                        
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearSelection}
                            disabled={isProcessing}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>


        </>
    );
}
