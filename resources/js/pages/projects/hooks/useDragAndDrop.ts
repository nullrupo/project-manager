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
import { getStatusFromColumnName } from '@/utils/statusMapping';
import { route } from 'ziggy-js';
import { Project } from '@/types/project-manager';

/**
 * Helper function to determine task status based on list name
 * Uses the centralized status mapping utility
 */
const getStatusFromListName = (listName: string): string | null => {
    return getStatusFromColumnName(listName);
};

/**
 * Custom hook for drag and drop functionality
 */
export const useDragAndDrop = (
    project: Project,
    state: any,
    listViewMode: 'status' | 'sections'
) => {
    const { moveTask, updateTaskPositions } = useTaskOperations(project, state.activeView, state.currentBoardId);

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

            // Store the source list ID for constraint checking
            if (task) {
                state.setDragSourceListId(task.list_id);
            }
        }
    };

    const handleBoardDragOver = (event: any) => {
        // Provide real-time visual feedback for valid/invalid drop zones
        const { active, over } = event;

        if (!over || !active.id.startsWith('task-') || !state.dragSourceListId) {
            // Clear feedback when not over a valid target
            state.setDragFeedback({ type: null, targetListId: null });
            return;
        }

        // Determine if this would be a valid drop
        let targetListId = null;
        let targetTaskId = null;

        if (over.id.startsWith('list-')) {
            targetListId = parseInt(over.id.replace('list-', ''));
        } else if (over.id.startsWith('task-') && over.id.includes('-before')) {
            targetTaskId = parseInt(over.id.replace('task-', '').replace('-before', ''));
            const overTask = state.lists.flatMap((list: any) => list.tasks || []).find((task: any) => task.id === targetTaskId);
            if (overTask) {
                targetListId = overTask.list_id;
            }
        } else if (over.id.startsWith('task-') && over.id.includes('-after')) {
            targetTaskId = parseInt(over.id.replace('task-', '').replace('-after', ''));
            const overTask = state.lists.flatMap((list: any) => list.tasks || []).find((task: any) => task.id === targetTaskId);
            if (overTask) {
                targetListId = overTask.list_id;
            }
        }

        if (targetListId) {
            const sourceListId = state.dragSourceListId;
            const isWithinSameColumn = sourceListId === targetListId;
            const isCrossColumn = sourceListId !== targetListId;

            // Apply the same constraint logic as in handleBoardDragEnd
            let isValidDrop = false;
            let feedbackType: 'within-column' | 'between-columns' | 'invalid' = 'invalid';

            if (isWithinSameColumn && targetTaskId) {
                isValidDrop = true; // Within-column reordering
                feedbackType = 'within-column';
            } else if (isCrossColumn && targetTaskId) {
                isValidDrop = true; // Cross-column movement with insertion
                feedbackType = 'between-columns';
            } else if (isCrossColumn && !targetTaskId) {
                isValidDrop = true; // Cross-column movement to list container
                feedbackType = 'between-columns';
            } else if (isWithinSameColumn && !targetTaskId) {
                isValidDrop = true; // Within-column to end of list
                feedbackType = 'within-column';
            }

            // Set visual feedback
            state.setDragFeedback({
                type: feedbackType,
                targetListId: targetListId
            });
        }
    };

    const handleBoardDragEnd = (event: any) => {
        const { active, over } = event;
        state.setActiveId(null);
        state.setActiveItem(null);
        state.setDragSourceListId(null); // Clear the source list ID
        state.setDragFeedback({ type: null, targetListId: null }); // Clear visual feedback

        if (!over) return;

        console.log('Board drag end:', { active: active.id, over: over.id });

        // Handle list reordering
        if (active.id.startsWith('list-') && over.id.startsWith('list-')) {
            const activeIndex = state.lists.findIndex((list: any) => `list-${list.id}` === active.id);
            const overIndex = state.lists.findIndex((list: any) => `list-${list.id}` === over.id);

            if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
                console.log('🔄 Reordering lists:', { activeIndex, overIndex });

                // Reorder lists using array move
                const newLists = [...state.lists];
                const [movedList] = newLists.splice(activeIndex, 1);
                newLists.splice(overIndex, 0, movedList);

                // Update positions
                const updatedLists = newLists.map((list: any, index: number) => ({
                    ...list,
                    position: index,
                }));

                state.setLists(updatedLists);

                // Send the updated positions to the server
                const boardId = state.currentBoardId || project.boards?.[0]?.id;
                if (boardId) {
                    fetch(route('lists.positions', { project: project.id, board: boardId }), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        },
                        body: JSON.stringify({
                            lists: updatedLists.map((list: any) => ({
                                id: list.id,
                                position: list.position,
                            })),
                        }),
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .catch(() => {
                        // Revert the changes on error
                        state.setLists(state.lists);
                        alert('Failed to save list order. Please try again.');
                    });
                }
            }
            return;
        }

        // Handle task movement
        if (active.id.startsWith('task-')) {
            const taskId = parseInt(active.id.replace('task-', ''));
            const sourceTask = state.lists.flatMap((list: any) => list.tasks || []).find((task: any) => task.id === taskId);

            if (!sourceTask) {
                console.log('❌ Source task not found');
                return;
            }

            let targetListId = null;
            let targetTaskId = null;

            // Determine target list ID and position based on drop zone
            if (over.id.startsWith('list-')) {
                targetListId = parseInt(over.id.replace('list-', ''));
                console.log('📦 Dropping on list container:', targetListId);
            } else if (over.id.startsWith('task-') && over.id.includes('-before')) {
                // Dropping before a specific task
                targetTaskId = parseInt(over.id.replace('task-', '').replace('-before', ''));
                const overTask = state.lists.flatMap((list: any) => list.tasks || []).find((task: any) => task.id === targetTaskId);
                if (overTask) {
                    targetListId = overTask.list_id;
                    console.log('⬆️ Dropping BEFORE task:', targetTaskId, 'in list:', targetListId);
                }
            } else if (over.id.startsWith('task-') && over.id.includes('-after')) {
                // Dropping after a specific task
                targetTaskId = parseInt(over.id.replace('task-', '').replace('-after', ''));
                const overTask = state.lists.flatMap((list: any) => list.tasks || []).find((task: any) => task.id === targetTaskId);
                if (overTask) {
                    targetListId = overTask.list_id;
                    // For "after" positioning, we need to adjust the insertion logic
                    console.log('⬇️ Dropping AFTER task:', targetTaskId, 'in list:', targetListId);
                }
            } else if (over.id.startsWith('task-')) {
                // Fallback for old task drops (shouldn't happen with new zones)
                targetTaskId = parseInt(over.id.replace('task-', ''));
                const overTask = state.lists.flatMap((list: any) => list.tasks || []).find((task: any) => task.id === targetTaskId);
                if (overTask) {
                    targetListId = overTask.list_id;
                    console.log('🔄 Dropping on task (fallback), target list:', targetListId, 'target task:', targetTaskId);
                }
            }

            if (targetListId) {
                // Apply drag constraints: lock to either column-to-column OR within-column movement
                const sourceListId = state.dragSourceListId || sourceTask.list_id;
                const isWithinSameColumn = sourceListId === targetListId;
                const isCrossColumn = sourceListId !== targetListId;

                // Determine if this is a valid drop based on constraints
                let isValidDrop = false;

                if (isWithinSameColumn && targetTaskId) {
                    // Within-column reordering: only allow if dropping on task insertion zones
                    isValidDrop = true;
                    console.log('✅ Within-column reordering allowed');
                } else if (isCrossColumn && targetTaskId) {
                    // Cross-column movement with insertion: now allowed!
                    isValidDrop = true;
                    console.log('✅ Cross-column insertion allowed');
                } else if (isCrossColumn && !targetTaskId) {
                    // Cross-column movement: only allow if dropping on list container (not on specific tasks)
                    isValidDrop = true;
                    console.log('✅ Cross-column movement allowed');
                } else if (isWithinSameColumn && !targetTaskId) {
                    // Within-column to end of list: allowed
                    isValidDrop = true;
                    console.log('✅ Within-column to end allowed');
                }

                if (!isValidDrop) {
                    console.log('🚫 Drop not allowed due to constraints');
                    return;
                }

                console.log('🚀 Moving task', taskId, 'to list', targetListId);

                // Find the target list to determine the new status
                const targetList = state.lists.find((list: any) => list.id === targetListId);
                const newStatus = targetList ? getStatusFromListName(targetList.name) : null;

                // Create optimistic update function with proper insertion logic
                const optimisticUpdate = () => {
                    const newLists = state.lists.map((list: any) => ({ ...list, tasks: [...(list.tasks || [])] }));

                    // Find source and target lists
                    const sourceList = newLists.find((list: any) => list.tasks.some((task: any) => task.id === taskId));
                    const targetList = newLists.find((list: any) => list.id === targetListId);

                    if (!sourceList || !targetList) {
                        console.log('❌ Could not find source or target list');
                        return;
                    }

                    // Find and remove the task from source list
                    const sourceTaskIndex = sourceList.tasks.findIndex((task: any) => task.id === taskId);
                    if (sourceTaskIndex === -1) {
                        console.log('❌ Could not find source task');
                        return;
                    }

                    const [taskToMove] = sourceList.tasks.splice(sourceTaskIndex, 1);

                    // Update task properties
                    const updatedTask = {
                        ...taskToMove,
                        list_id: targetListId,
                        // Update status if it should change based on the list
                        ...(newStatus && newStatus !== taskToMove.status && { status: newStatus }),
                        // Handle completed_at timestamp
                        ...(newStatus === 'done' && taskToMove.status !== 'done' && { completed_at: new Date().toISOString() }),
                        ...(newStatus !== 'done' && taskToMove.status === 'done' && { completed_at: null })
                    };

                    // Calculate insertion index based on drop zone
                    let insertionIndex = targetList.tasks.length; // Default to end

                    if (targetTaskId) {
                        const targetTaskIndex = targetList.tasks.findIndex((task: any) => task.id === targetTaskId);
                        if (targetTaskIndex !== -1) {
                            if (over.id.includes('-after')) {
                                // Insert after the target task
                                insertionIndex = targetTaskIndex + 1;
                            } else {
                                // Insert before the target task (default)
                                insertionIndex = targetTaskIndex;
                            }
                        }
                    }

                    // Insert the task at the calculated position
                    targetList.tasks.splice(insertionIndex, 0, updatedTask);

                    // Update positions for all tasks in both lists
                    sourceList.tasks.forEach((task: any, index: number) => {
                        task.position = index;
                    });

                    targetList.tasks.forEach((task: any, index: number) => {
                        task.position = index;
                    });

                    state.setLists(newLists);
                    console.log('⚡ Insertion-based optimistic update applied:', {
                        taskId,
                        sourceListId: sourceList.id,
                        targetListId,
                        insertionIndex,
                        newStatus
                    });
                };

                // Prepare update data with insertion-based positioning
                const updateData: any = { list_id: targetListId };

                // Calculate the exact insertion position
                if (targetTaskId) {
                    const targetList = state.lists.find((list: any) => list.id === targetListId);
                    if (targetList) {
                        const targetTaskIndex = targetList.tasks.findIndex((task: any) => task.id === targetTaskId);
                        if (targetTaskIndex !== -1) {
                            if (over.id.includes('-after')) {
                                // Insert after the target task
                                updateData.insertion_position = targetTaskIndex + 1;
                            } else {
                                // Insert before the target task (default)
                                updateData.insertion_position = targetTaskIndex;
                            }
                        }
                    }
                }

                moveTask(taskId, updateData, optimisticUpdate);
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
            const currentBoard = project.boards?.find(board => board.id === state.currentBoardId) || project.boards?.[0];
            const allTasks = currentBoard?.lists?.flatMap(list => list.tasks || []) || [];
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
                        const currentBoard = project.boards?.find(board => board.id === state.currentBoardId) || project.boards?.[0];
                        const firstList = currentBoard?.lists?.[0];
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
                    const currentBoard = project.boards?.find(board => board.id === state.currentBoardId) || project.boards?.[0];
                    const firstList = currentBoard?.lists?.[0];
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
                                        const currentBoard = project.boards?.find(board => board.id === state.currentBoardId) || project.boards?.[0];
                                        update.list_id = currentBoard?.lists?.[0]?.id || task.list_id;
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
