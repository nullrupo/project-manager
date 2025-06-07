import React from 'react';
import { AlertCircle } from 'lucide-react';

interface UrgencyIndicatorProps {
    priority: 'low' | 'medium' | 'high' | 'urgent';
    className?: string;
}

export function UrgencyIndicator({ priority, className = '' }: UrgencyIndicatorProps) {
    const getUrgencyColor = (priority: string) => {
        switch (priority) {
            case 'low': return 'text-green-500';
            case 'medium': return 'text-yellow-500';
            case 'high': return 'text-orange-500';
            case 'urgent': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };

    const getUrgencyLabel = (priority: string) => {
        switch (priority) {
            case 'low': return 'Low priority';
            case 'medium': return 'Medium priority';
            case 'high': return 'High priority';
            case 'urgent': return 'Urgent';
            default: return 'Unknown priority';
        }
    };

    return (
        <div 
            className={`inline-flex items-center ${className}`}
            title={getUrgencyLabel(priority)}
        >
            <AlertCircle className={`h-4 w-4 ${getUrgencyColor(priority)}`} />
        </div>
    );
}
