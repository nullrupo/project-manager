import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
    Eye, 
    AlertCircle, 
    FileText, 
    Calendar, 
    CheckSquare, 
    User, 
    Tag,
    RotateCcw
} from 'lucide-react';
import { TaskDisplayPreferences } from '@/hooks/use-task-display-preferences';
import { useTaskDisplayPreferencesContext } from '@/contexts/TaskDisplayPreferencesContext';

interface TaskDisplayCustomizerProps {
    pageKey: string;
    className?: string;
}

interface DisplayOption {
    key: keyof TaskDisplayPreferences;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

const displayOptions: DisplayOption[] = [
    {
        key: 'show_urgency',
        label: 'Priority',
        icon: AlertCircle,
    },
    {
        key: 'show_deadline',
        label: 'Due Date',
        icon: Calendar,
    },
    {
        key: 'show_assignee',
        label: 'Assignee',
        icon: User,
    },
    {
        key: 'show_status',
        label: 'Status',
        icon: Tag,
    },
    {
        key: 'show_checklist_progress',
        label: 'Checklist Progress',
        icon: CheckSquare,
    },
    {
        key: 'show_notes',
        label: 'Full Note',
        icon: FileText,
    },
    {
        key: 'show_tags',
        label: 'Personal Tags',
        icon: Tag,
    },
    {
        key: 'show_labels',
        label: 'Project Labels',
        icon: Tag,
    },
];

export function TaskDisplayCustomizer({ pageKey, className = '' }: TaskDisplayCustomizerProps) {
    const preferencesContext = useTaskDisplayPreferencesContext();
    const [isOpen, setIsOpen] = useState(false);

    // Initialize preferences for this page on mount
    useEffect(() => {
        preferencesContext.initializePreferences(pageKey);
    }, [pageKey, preferencesContext]);

    const preferences = preferencesContext.getPreferences(pageKey);
    const isPageSpecific = preferencesContext.isPageSpecific(pageKey);



    const handleToggle = (key: keyof TaskDisplayPreferences, checked: boolean) => {
        preferencesContext.updatePreferences(pageKey, { [key]: checked });
    };

    const handleResetToGlobal = () => {
        preferencesContext.resetToGlobal(pageKey);
        setIsOpen(false);
    };

    const enabledCount = Object.values(preferences).filter(Boolean).length;

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className={`gap-2 ${className}`}
                    title="Customize task display"
                >
                    <Eye className="h-4 w-4" />
                    Display ({enabledCount}/{displayOptions.length})
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Task Display Options
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <div className="p-2 space-y-2">
                    {displayOptions.map((option) => {
                        const Icon = option.icon;
                        const isChecked = preferences[option.key];

                        return (
                            <div key={option.key} className="flex items-center space-x-3">
                                <Checkbox
                                    id={option.key}
                                    checked={isChecked}
                                    onCheckedChange={(checked) => handleToggle(option.key, checked as boolean)}
                                />
                                <Label
                                    htmlFor={option.key}
                                    className="flex items-center gap-2 text-sm font-medium cursor-pointer"
                                >
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                    {option.label}
                                </Label>
                            </div>
                        );
                    })}
                </div>

                {isPageSpecific && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                            onClick={handleResetToGlobal}
                            className="text-sm text-muted-foreground"
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset to Global Settings
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
