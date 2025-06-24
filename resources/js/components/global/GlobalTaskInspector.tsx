import React, { useRef, useEffect } from 'react';
import { useGlobalTaskInspector } from '@/contexts/GlobalTaskInspectorContext';
import { TaskInspector } from '@/components/project/task-inspector/TaskInspector';
import { useTags } from '@/hooks/useTags';
import { useLabels } from '@/hooks/useLabels';

export function GlobalTaskInspector() {
    const { isOpen, task, project, closeInspector, saveInspectorRef } = useGlobalTaskInspector();
    const taskInspectorRef = useRef<{ saveTask: () => Promise<void> } | null>(null);

    // Fetch available tags and labels
    const { tags: availableTags } = useTags();
    const { labels: availableLabels } = useLabels(project?.id);

    // Register the save function with the global context
    useEffect(() => {
        if (isOpen && taskInspectorRef.current) {
            saveInspectorRef.current = taskInspectorRef.current.saveTask;
        } else {
            saveInspectorRef.current = null;
        }
    }, [isOpen, task, saveInspectorRef]);

    if (!isOpen || !task || !project) {
        return null;
    }

    return (
        <div
            className="fixed top-0 right-0 h-full w-96 bg-background border-l border-border shadow-lg z-50"
            data-global-inspector
        >
            <TaskInspector
                ref={taskInspectorRef}
                task={task}
                project={project}
                onClose={closeInspector}
                availableTags={availableTags}
                availableLabels={availableLabels}
                allProjects={project?.all_projects || []}
            />
        </div>
    );
}
