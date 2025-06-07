import {
    useSensor,
    useSensors,
    PointerSensor,
    MouseSensor,
    KeyboardSensor,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useTaskOperations } from './useTaskOperations';
import { getOrganizedTasks } from '../utils/projectUtils';
import { Project } from '@/types/project-manager';

/**
 * Custom hook for drag and drop functionality
 */
export const useDragAndDrop = (
    project: Project,
    state: any,
    listViewMode: 'status' | 'sections'
) => {
    const { moveTask, updateTaskPositions } = useTaskOperations(project);

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Calendar sensors
    const calendarSensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3,
            },
        }),
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 3,
            },
        })
    );

    // Board drag handlers
    const handleBoardDragStart = (event: any) => {
        const { active } = event;
        state.setActiveId(active.id);

        if (active.id.startsWith('list-')) {
            const listId = parseInt(active.id.replace('list-', ''));
            const list = state.lists.find((l: any) => l.id === listId);
            state.setActiveItem({ type: 'list', list });
        } else if (active.id.startsWith('task-')) {
            const taskId = parseInt(active.id.replace('task-', ''));
            const task = state.lists.flatMap((l: any) => l.tasks || []).find((t: any) => t.id === taskId);
            state.setActiveItem({ type: 'task', task });
        }
    };

    const handleBoardDragEnd = (event: any) => {
        const { active, over } = event;
        state.setActiveId(null);
        state.setActiveItem(null);

        if (!over) return;

        // Handle task movement between lists
        if (active.id.startsWith('task-') && over.id.startsWith('list-')) {
            const taskId = parseInt(active.id.replace('task-', ''));
            const newListId = parseInt(over.id.replace('list-', ''));
            moveTask(taskId, { list_id: newListId });
        }
    };

    // List tab drag handlers
    const handleListDragStart = (event: any) => {
        const { active } = event;
        state.setListActiveId(active.id);

        if (active.id.startsWith('list-task-')) {
            const taskId = parseInt(active.id.replace('list-task-', ''));
            const allTasks = project.boards?.[0]?.lists?.flatMap(list => list.tasks || []) || [];
            const task = allTasks.find(t => t.id === taskId);
            state.setListActiveItem({ type: 'task', task });
        }
    };

    const handleListDragOver = (event: any) => {
        const { over } = event;
        state.setListOverId(over?.id || null);
    };

    const handleListDragEnd = (event: any) => {
        const { active, over } = event;
        state.setListActiveId(null);
        state.setListActiveItem(null);
        state.setListOverId(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Handle task reordering within the same section or between sections
        if (activeId.startsWith('list-task-')) {
            const taskId = parseInt(activeId.replace('list-task-', ''));

            // Case 1: Moving to a section header (between sections)
            if (overId.startsWith('list-section-')) {
                const sectionId = overId.replace('list-section-', '');

                // Find the target list/section
                let targetListId = null;

                if (listViewMode === 'sections') {
                    // Moving to a specific list (section)
                    targetListId = parseInt(sectionId);
                } else {
                    // Moving to a status group - use the first available list
                    const firstList = project.boards?.[0]?.lists?.[0];
                    if (firstList) {
                        targetListId = firstList.id;
                    }
                }

                if (targetListId) {
                    const updates: any = { list_id: targetListId };

                    // If moving to status-based section, also update status
                    if (listViewMode === 'status') {
                        updates.status = sectionId;
                    }

                    moveTask(taskId, updates);
                }
            }
            // Case 2: Reordering tasks within the same section
            else if (overId.startsWith('list-task-')) {
                const overTaskId = parseInt(overId.replace('list-task-', ''));

                if (taskId !== overTaskId) {
                    // Find the sections and tasks
                    const sections = getOrganizedTasks(project, listViewMode);
                    let sourceSection = null;
                    let targetSection = null;
                    let sourceTask = null;
                    let targetTask = null;

                    // Find source and target tasks and their sections
                    for (const section of sections) {
                        const foundSource = section.tasks.find((t: any) => t.id === taskId);
                        const foundTarget = section.tasks.find((t: any) => t.id === overTaskId);

                        if (foundSource) {
                            sourceSection = section;
                            sourceTask = foundSource;
                        }
                        if (foundTarget) {
                            targetSection = section;
                            targetTask = foundTarget;
                        }
                    }

                    if (sourceTask && targetTask && sourceSection && targetSection) {
                        // Simplified reordering logic
                        const allTasks = [...targetSection.tasks];
                        const sourceIndex = allTasks.findIndex((t: any) => t.id === taskId);
                        const targetIndex = allTasks.findIndex((t: any) => t.id === overTaskId);

                        if (sourceIndex !== -1 && targetIndex !== -1) {
                            // Remove source task
                            const [movedTask] = allTasks.splice(sourceIndex, 1);

                            // Insert at new position
                            const newIndex = sourceIndex < targetIndex ? targetIndex : targetIndex + 1;
                            allTasks.splice(newIndex, 0, movedTask);

                            // Prepare position updates
                            const updates = allTasks.map((task: any, index: number) => ({
                                id: task.id,
                                position: index,
                                list_id: targetSection.type === 'section' ? parseInt(targetSection.id) : task.list_id,
                                ...(targetSection.type === 'status' ? { status: targetSection.id } : {})
                            }));

                            updateTaskPositions(updates);
                        }
                    }
                }
            }
        }
    };

    return {
        sensors,
        calendarSensors,
        handleBoardDragStart,
        handleBoardDragEnd,
        handleListDragStart,
        handleListDragOver,
        handleListDragEnd,
    };
};
