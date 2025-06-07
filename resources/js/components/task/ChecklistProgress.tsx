import React from 'react';
import { Check } from 'lucide-react';
import { ChecklistItem } from '@/types/project-manager';

interface ChecklistProgressProps {
    checklistItems?: ChecklistItem[];
    className?: string;
}

export function ChecklistProgress({ checklistItems = [], className = '' }: ChecklistProgressProps) {
    if (!checklistItems || checklistItems.length === 0) {
        return null;
    }

    const completedCount = checklistItems.filter(item => item.is_completed).length;
    const totalCount = checklistItems.length;

    return (
        <div 
            className={`inline-flex items-center gap-1 text-sm text-muted-foreground ${className}`}
            title={`${completedCount} of ${totalCount} checklist items completed`}
        >
            <Check className="h-4 w-4" />
            <span>{completedCount}/{totalCount}</span>
        </div>
    );
}
