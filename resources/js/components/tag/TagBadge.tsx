import React from 'react';
import { Tag } from '@/types/project-manager';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface TagBadgeProps {
    tag: Tag;
    onRemove?: () => void;
    removable?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export function TagBadge({ tag, onRemove, removable = false, size = 'sm' }: TagBadgeProps) {
    const sizeClasses = {
        sm: 'text-xs px-2 py-1',
        md: 'text-sm px-3 py-1',
        lg: 'text-base px-4 py-2'
    };

    return (
        <Badge
            variant="secondary"
            className={`inline-flex items-center gap-1 ${sizeClasses[size]} border`}
            style={{
                backgroundColor: `${tag.color}20`,
                borderColor: tag.color,
                color: tag.color
            }}
        >
            <span className="truncate max-w-24">{tag.name}</span>
            {removable && onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                    type="button"
                >
                    <X className="h-3 w-3" />
                </button>
            )}
        </Badge>
    );
}
