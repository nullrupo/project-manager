import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Plus, Settings, Eye } from 'lucide-react';
import { Project } from '@/types/project-manager';
import { router } from '@inertiajs/react';

interface BoardSwitcherProps {
    project: Project;
    currentBoardId?: number;
    onCreateBoard: () => void;
    onManageBoards: () => void;
    onBoardChange?: (boardId: number) => void;
}

export default function BoardSwitcher({
    project,
    currentBoardId,
    onCreateBoard,
    onManageBoards,
    onBoardChange
}: BoardSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentBoard = project.boards?.find(board => board.id === currentBoardId) || project.boards?.[0];
    const hasMultipleBoards = project.boards && project.boards.length > 1;
    const multipleboardsEnabled = project.enable_multiple_boards;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleBoardSwitch = (boardId: number) => {
        if (boardId !== currentBoardId && onBoardChange) {
            onBoardChange(boardId);
        }
        setIsOpen(false); // Close dropdown after selection
    };

    if (!project.boards || project.boards.length === 0) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">No boards</span>
                {project.can_edit && multipleboardsEnabled && (
                    <Button variant="outline" size="sm" onClick={onCreateBoard}>
                        <Plus className="h-4 w-4 mr-1" />
                        Create Board
                    </Button>
                )}
            </div>
        );
    }

    // If multiple boards are disabled, don't render anything (board name is shown in title)
    if (!multipleboardsEnabled) {
        return null;
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 ml-2"
                onClick={() => setIsOpen(!isOpen)}
            >
                <ChevronDown className="h-4 w-4" />
            </Button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-[200px] bg-background border rounded-md shadow-lg z-50">
                    <div className="py-1">
                        {project.boards?.map((board) => (
                            <button
                                key={board.id}
                                onClick={() => handleBoardSwitch(board.id)}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 ${
                                    currentBoard?.id === board.id ? 'bg-muted' : ''
                                }`}
                            >
                                <Eye className="h-4 w-4" />
                                <span className="truncate">{board.name}</span>
                            </button>
                        ))}
                        {project.can_edit && multipleboardsEnabled && (
                            <>
                                <div className="border-t my-1"></div>
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        onCreateBoard();
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Board
                                </button>
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        onManageBoards();
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                                >
                                    <Settings className="h-4 w-4" />
                                    Manage Boards
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
