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
    const { moveTask, updateTaskPositions } = useTaskOperations(project, state.activeView);

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3, // Reduced distance for more responsive dragging
                tolerance: 5,
                delay: 50, // Reduced delay
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

    const handleBoardDragOver = (event: any) => {
        // This provides real-time visual feedback during drag
        // The actual logic is handled in onDragEnd
    };

    const handleBoardDragEnd = (event: any) => {
        const { active, over } = event;
        state.setActiveId(null);
        state.setActiveItem(null);

        if (!over) return;

        console.log('Board drag end:', { active: active.id, over: over.id });

        // Handle task movement
        if (active.id.startsWith('task-')) {
            const taskId = parseInt(active.id.replace('task-', ''));
            let targetListId = null;

            // Determine target list ID
            if (over.id.startsWith('list-')) {
                targetListId = parseInt(over.id.replace('list-', ''));
                console.log('📦 Dropping on list container:', targetListId);
            } else if (over.id.startsWith('task-')) {
                const overTaskId = parseInt(over.id.replace('task-', ''));
                const overTask = state.lists.flatMap((list: any) => list.tasks || []).find((task: any) => task.id === overTaskId);
                if (overTask) {
                    targetListId = overTask.list_id;
                    console.log('🔄 Dropping on task, target list:', targetListId);
                }
            }

            if (targetListId) {
                console.log('🚀 Moving task', taskId, 'to list', targetListId);

                // Create optimistic update function
                const optimisticUpdate = () => {
                    let taskToMove = null;

                    // First pass: find and remove the task from its current list
                    const newLists = state.lists.map((list: any) => {
                        const tasks = (list.tasks || []).filter((task: any) => {
                            if (task.id === taskId) {
                                taskToMove = { ...task, list_id: targetListId };
                                return false; // Remove from current list
                            }
                            return true;
                        });
                        return { ...list, tasks };
                    });

                    // Second pass: add the task to the target list
                    if (taskToMove) {
                        const finalLists = newLists.map((list: any) => {
                            if (list.id === targetListId) {
                                return {
                                    ...list,
                                    tasks: [...(list.tasks || []), taskToMove]
                                };
                            }
                            return list;
                        });

                        state.setLists(finalLists);
                        console.log('⚡ Optimistic update applied');
                    }
                };

                moveTask(taskId, { list_id: targetListId }, optimisticUpdate);
            } else {
                console.log('❌ Could not determine target list');
            }
        }

        // Note: Task-to-task drops are already handled above in the main task movement logic
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
                let targetSectionId = null;

                if (listViewMode === 'sections') {
                    // Handle special "no-section" case
                    if (sectionId === 'no-section') {
                        // Moving to no section - use the first available list but no section_id
                        const firstList = project.boards?.[0]?.lists?.[0];
                        if (firstList) {
                            targetListId = firstList.id;
                            targetSectionId = null; // Explicitly set to null for no section
                        }
                    } else {
                        // Moving to a specific section
                        targetListId = parseInt(sectionId);
                        targetSectionId = parseInt(sectionId);
                    }
                } else {
                    // Moving to a status group - use the first available list
                    const firstList = project.boards?.[0]?.lists?.[0];
                    if (firstList) {
                        targetListId = firstList.id;
                    }
                }

                if (targetListId !== null) {
                    const updates: any = { list_id: targetListId };

                    // Set section_id for section-based view
                    if (listViewMode === 'sections') {
                        updates.section_id = targetSectionId;
                    }

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
                            const updates = allTasks.map((task: any, index: number) => {
                                const update: any = {
                                    id: task.id,
                                    position: index,
                                };

                                if (targetSection.type === 'section') {
                                    if (targetSection.id === 'no-section') {
                                        // Moving to no section
                                        update.list_id = project.boards?.[0]?.lists?.[0]?.id || task.list_id;
                                        update.section_id = null;
                                    } else {
                                        // Moving to a specific section
                                        update.list_id = parseInt(targetSection.id);
                                        update.section_id = parseInt(targetSection.id);
                                    }
                                } else if (targetSection.type === 'status') {
                                    update.list_id = task.list_id;
                                    update.status = targetSection.id;
                                } else {
                                    update.list_id = task.list_id;
                                }

                                return update;
                            });

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
        handleBoardDragOver,
        handleBoardDragEnd,
        handleListDragStart,
        handleListDragOver,
        handleListDragEnd,
    };
};
