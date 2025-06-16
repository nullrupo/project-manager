import React from 'react';
import { AlertCircle, Flag, Circle } from 'lucide-react';

interface UrgencyIndicatorProps {
    priority: 'low' | 'medium' | 'high';
    className?: string;
}

export function UrgencyIndicator({ priority, className = '' }: UrgencyIndicatorProps) {
    const getUrgencyConfig = (priority: string) => {
        switch (priority) {
            case 'low':
                return {
                    icon: Circle,
                    color: 'text-green-600',
                    bgColor: 'bg-green-100 dark:bg-green-900/20',
                    borderColor: 'border-green-200 dark:border-green-800',
                    label: 'Low priority'
                };
            case 'medium':
                return {
                    icon: AlertCircle,
                    color: 'text-yellow-600',
                    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
                    borderColor: 'border-yellow-200 dark:border-yellow-800',
                    label: 'Medium priority'
                };
            case 'high':
                return {
                    icon: Flag,
                    color: 'text-red-600',
                    bgColor: 'bg-red-100 dark:bg-red-900/20',
                    borderColor: 'border-red-200 dark:border-red-800',
                    label: 'High priority'
                };
            default:
                return {
                    icon: Circle,
                    color: 'text-gray-500',
                    bgColor: 'bg-gray-100 dark:bg-gray-900/20',
                    borderColor: 'border-gray-200 dark:border-gray-800',
                    label: 'Unknown priority'
                };
        }
    };

    const config = getUrgencyConfig(priority);
    const IconComponent = config.icon;

    return (
        <div
            className={`inline-flex items-center justify-center w-5 h-5 rounded-full border ${config.bgColor} ${config.borderColor} ${className}`}
            title={config.label}
        >
            <IconComponent className={`h-2.5 w-2.5 ${config.color}`} />
        </div>
    );
}
