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

    // Drag and drop sensors with better click/drag separation
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Higher distance to prevent accidental drags
                tolerance: 5,
                delay: 100, // Longer delay to allow button clicks
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
                console.log('🚀 Drag start - Task:', taskId, 'Source List:', task.list_id, 'Active Data:', active.data?.current);
            }
        }
    };

    const handleBoardDragOver = (event: any) => {
        const { over, active } = event;

        // Enhanced drag feedback for visual effects - try multiple ways to get the listId
        let draggedTaskListId = active?.data?.current?.listId;

        // Fallback: try to get from the stored active item
        if (!draggedTaskListId && state.activeItem?.task) {
            draggedTaskListId = state.activeItem.task.list_id;
        }

        // Another fallback: extract from task ID and find in lists
        if (!draggedTaskListId && active?.id.toString().startsWith('task-')) {
            const taskId = parseInt(active.id.toString().replace('task-', ''));
            const task = state.lists.flatMap((l: any) => l.tasks || []).find((t: any) => t.id === taskId);
            if (task) {
                draggedTaskListId = task.list_id;
            }
        }

        const isTaskDrag = active?.id.toString().startsWith('task-');

        // Debug logging
        if (over && isTaskDrag) {
            console.log('🔄 Drag over:', {
                overId: over.id,
                overType: over.id.toString().startsWith('task-') ? 'task' : 'list',
                activeId: active.id,
                draggedTaskListId,
                activeDataCurrent: active?.data?.current,
                activeItem: state.activeItem
            });
        }

        const feedbackData = {
            overId: over?.id || null,
            overType: over?.id?.toString().startsWith('task-') ? 'task' :
                     over?.id?.toString().startsWith('list-') ? 'list' : null,
            activeId: active?.id || null,
            draggedTaskListId: draggedTaskListId,
            isTaskDrag: isTaskDrag
        };

        // Debug the feedback data being set
        if (isTaskDrag && over?.id?.toString().startsWith('task-')) {
            console.log('🔧 Setting dragFeedback:', feedbackData);
        }

        state.setDragFeedback(feedbackData);
    };

    const handleBoardDragEnd = (event: any) => {
        const { active, over, delta } = event;
        state.setActiveId(null);
        state.setActiveItem(null);
        state.setDragSourceListId(null); // Clear the source list ID
        state.setDragFeedback(null); // Clear drag feedback

        // Check if this was actually a drag or just a click
        const dragDistance = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
        const minimumDragDistance = 3; // Reduced to match sensor constraint

        if (!over) {
            console.log('🚫 No drop target - snapping back');
            return;
        }

        // If the drag distance is too small, treat it as a click and don't move the task
        if (dragDistance < minimumDragDistance) {
            console.log('🚫 Drag distance too small, treating as click:', dragDistance);
            return;
        }

        console.log('Board drag end:', { active: active.id, over: over.id });

        // New grid-based drop validation
        if (active.id.startsWith('task-')) {
            const taskId = parseInt(active.id.replace('task-', ''));
            const sourceTask = state.lists.flatMap((list: any) => list.tasks || []).find((task: any) => task.id === taskId);
            const sourceListId = state.dragSourceListId || sourceTask?.list_id;

            let targetListId = null;
            let isValidDrop = false;

            // Simplified drop validation without insertion zones
            if (over.id.startsWith('list-')) {
                // Column container - always valid
                targetListId = parseInt(over.id.replace('list-', ''));
                isValidDrop = true;
            } else if (over.id.startsWith('task-')) {
                // Task drop - always valid
                const targetTaskId = parseInt(over.id.replace('task-', ''));
                const targetTask = state.lists.flatMap((l: any) => l.tasks || []).find((t: any) => t.id === targetTaskId);
                targetListId = targetTask?.list_id;
                isValidDrop = (targetListId !== undefined);
            } else {
                // Invalid drop zone
                console.log('🚫 Invalid drop zone:', over.id);
                return;
            }

            if (!isValidDrop) {
                console.log('🚫 Invalid drop - snapping back');
                return;
            }
        }

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

        // Handle task movement with new grid-based system
        if (active.id.startsWith('task-')) {
            const taskId = parseInt(active.id.replace('task-', ''));
            const sourceTask = state.lists.flatMap((list: any) => list.tasks || []).find((task: any) => task.id === taskId);

            if (!sourceTask) {
                console.log('❌ Source task not found');
                return;
            }

            let targetListId = null;
            let targetGridPosition = null;
            let targetTaskId = null;
            const sourceListId = state.dragSourceListId || sourceTask.list_id;

            console.log('🎯 Drop detected - Over ID:', over.id, 'Source List:', sourceListId, 'Dragged Task:', taskId);

            // Enhanced drop handling with better positioning
            if (over.id.startsWith('list-')) {
                // List container drop - always place at end
                targetListId = parseInt(over.id.replace('list-', ''));
                targetGridPosition = null; // Will place at end
                console.log('🎯 List container drop:', targetListId, '(end)');
            } else if (over.id.startsWith('task-')) {
                // Task drop - detect if dragging up or down and position accordingly
                targetTaskId = parseInt(over.id.replace('task-', ''));
                const targetTask = state.lists.flatMap((l: any) => l.tasks || []).find((t: any) => t.id === targetTaskId);
                targetListId = targetTask?.list_id;

                const targetList = state.lists.find((l: any) => l.id === targetListId);
                if (targetList) {
                    const targetTaskIndex = targetList.tasks.findIndex((t: any) => t.id === targetTaskId);
                    const sourceTaskIndex = targetList.tasks.findIndex((t: any) => t.id === taskId);

                    if (sourceListId !== targetListId) {
                        // Cross-column: always insert before target task
                        targetGridPosition = targetTaskIndex;
                    } else {
                        // Same-column: detect direction and position accordingly
                        const isDraggingDown = sourceTaskIndex < targetTaskIndex;

                        if (isDraggingDown) {
                            // Dragging down: place AFTER target (user wants to move below target)
                            targetGridPosition = targetTaskIndex; // After removal, this becomes the correct position
                        } else {
                            // Dragging up: place BEFORE target (user wants to move above target)
                            targetGridPosition = targetTaskIndex;
                        }
                    }
                }
                console.log('🎯 Task drop:', {
                    targetListId,
                    position: targetGridPosition,
                    targetTask: targetTaskId,
                    crossColumn: sourceListId !== targetListId,
                    direction: sourceListId === targetListId ? (targetList?.tasks.findIndex((t: any) => t.id === taskId) < targetList?.tasks.findIndex((t: any) => t.id === targetTaskId) ? 'down' : 'up') : 'cross'
                });
            } else {
                console.log('🚫 Invalid drop zone:', over.id);
                return;
            }

            if (targetListId) {
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

                    // Calculate insertion index based on drop target
                    let insertionIndex = targetList.tasks.length; // Default to end

                    if (targetGridPosition !== null) {
                        // Insertion zone or task drop - insert at specific position
                        insertionIndex = Math.max(0, Math.min(targetGridPosition, targetList.tasks.length));
                        console.log('🎯 Insertion at position:', insertionIndex);
                    } else {
                        // List container drop - place at end
                        insertionIndex = targetList.tasks.length;
                        console.log('🎯 Placing at end of list:', insertionIndex);
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

                // Prepare update data with simplified positioning
                const updateData: any = { list_id: targetListId };

                // Set insertion position based on drop target
                if (targetGridPosition !== null) {
                    // Task drop - insert before the target task
                    updateData.insertion_position = targetGridPosition;
                    console.log('📤 Sending insertion position:', targetGridPosition);
                } else {
                    // List container drop - add to end (server will handle this)
                    console.log('📤 No specific position, adding to end of list');
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
        // No visual feedback for list view to prevent flashing
    };

    const handleListDragEnd = (event: any) => {
        const { active, over, delta } = event;
        state.setListActiveId(null);
        state.setListActiveItem(null);
        state.setListOverId(null);

        if (!over) return;

        // Check if this was actually a drag or just a click
        const dragDistance = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
        const minimumDragDistance = 5; // pixels

        // If the drag distance is too small, treat it as a click and don't move the task
        if (dragDistance < minimumDragDistance) {
            console.log('🚫 List drag distance too small, treating as click:', dragDistance);
            return;
        }

        const activeId = active.id;
        const overId = over.id;

        // Handle task reordering within the same section or between sections
        if (activeId.startsWith('list-task-')) {
            const taskId = parseInt(activeId.replace('list-task-', ''));

            // Case 1: Moving to insertion zone (enhanced positioning)
            if (overId.startsWith('list-insertion-')) {
                const parts = overId.split('-');
                const sectionId = parts[2];
                const position = parseInt(parts[3]);

                // Find the target list/section
                let targetListId = null;
                let targetSectionId = null;

                if (listViewMode === 'sections') {
                    if (sectionId === 'no-section') {
                        // Moving to no section - use the first available list but no section_id
                        const currentBoard = project.boards?.find(board => board.id === state.currentBoardId) || project.boards?.[0];
                        const firstList = currentBoard?.lists?.[0];
                        if (firstList) {
                            targetListId = firstList.id;
                            targetSectionId = null;
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
                    const updates: any = {
                        list_id: targetListId,
                        insertion_position: position
                    };

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
            // Case 2: Moving to a section header (between sections)
            else if (overId.startsWith('list-section-')) {
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
