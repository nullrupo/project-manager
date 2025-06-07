import React from 'react';
import { useGlobalTaskInspector } from '@/contexts/GlobalTaskInspectorContext';
import { TaskInspector } from '@/components/project/task-inspector/TaskInspector';

export function GlobalTaskInspector() {
    const { isOpen, task, project, closeInspector } = useGlobalTaskInspector();

    if (!isOpen || !task || !project) {
        return null;
    }

    return (
        <div className="fixed top-0 right-0 h-full w-96 bg-background border-l border-border shadow-lg z-50">
            <TaskInspector
                task={task}
                project={project}
                onClose={closeInspector}
            />
        </div>
    );
}
