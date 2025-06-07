import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Section, Task } from '@/types/project-manager';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';

interface KanbanSectionProps {
    section: Section;
    tasks: Task[];
    onToggleCollapse: (section: Section) => void;
    onAddTask: (sectionId: number) => void;
    children?: React.ReactNode;
}

export default function KanbanSection({ 
    section, 
    tasks, 
    onToggleCollapse, 
    onAddTask, 
    children 
}: KanbanSectionProps) {
    const sectionTasks = tasks.filter(task => task.section_id === section.id);
    
    return (
        <Card className="mb-4 border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onToggleCollapse(section)}
                            className="p-1 h-6 w-6"
                        >
                            {section.is_collapsed ? (
                                <ChevronRight className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </Button>
                        <CardTitle className="text-base">{section.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                            {sectionTasks.length} tasks
                        </Badge>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAddTask(section.id)}
                        className="h-8 w-8 p-0"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                {section.description && !section.is_collapsed && (
                    <p className="text-sm text-muted-foreground mt-1">
                        {section.description}
                    </p>
                )}
            </CardHeader>
            {!section.is_collapsed && (
                <CardContent className="pt-0">
                    {children}
                </CardContent>
            )}
        </Card>
    );
}
