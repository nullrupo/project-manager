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
import { fetchWithCsrf } from '@/utils/csrf';

/**
 * Helper function to determine task status based on list name
 * Uses the centralized status mapping utility
 */
const getStatusFromListName = (listName: string): string | null => {
    return getStatusFromColumnName(listName);
};

// Add arrayMove utility if not present
function arrayMove<T>(array: T[], from: number, to: number): T[] {
    const newArray = array.slice();
    const startIndex = from < 0 ? newArray.length + from : from;
    if (startIndex >= 0 && startIndex < newArray.length) {
        const [item] = newArray.splice(startIndex, 1);
        newArray.splice(to, 0, item);
    }
    return newArray;
}

/**
 * Custom hook for drag and drop functionality
 */
export const useDragAndDrop = (
    project: Project,
    state: any,
    listViewMode: 'status' | 'sections'
) => {
    const { moveTask, updateTaskPositions } = useTaskOperations(project, state.activeView, state.currentBoardId);

    // Drag and drop sensors optimized for responsiveness
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Reduced for more responsive dragging
                tolerance: 3,
                delay: 50, // Reduced delay for faster response
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



        const feedbackData = {
            overId: over?.id || null,
            overType: over?.id?.toString().startsWith('task-') ? 'task' :
                     over?.id?.toString().startsWith('list-') ? 'list' : null,
            activeId: active?.id || null,
            draggedTaskListId: draggedTaskListId,
            isTaskDrag: isTaskDrag
        };



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
            return;
        }

        // If the drag distance is too small, treat it as a click and don't move the task
        if (dragDistance < minimumDragDistance) {
            return;
        }

        // Handle task movement
        if (active.id.startsWith('task-')) {
            const taskId = parseInt(active.id.replace('task-', ''));
            const sourceTask = state.lists.flatMap((list: any) => list.tasks || []).find((task: any) => task.id === taskId);
            if (!sourceTask) return;
            const sourceListId = state.dragSourceListId || sourceTask.list_id;

            let targetListId: number | null = null;
            let targetTaskId: number | null = null;
            let targetTaskIndex: number | null = null;
            let isValidDrop = false;

            if (over.id.startsWith('list-')) {
                // Dropped on column: move to end
                targetListId = parseInt(over.id.replace('list-', ''));
                isValidDrop = true;
            } else if (over.id.startsWith('task-')) {
                targetTaskId = parseInt(over.id.replace('task-', ''));
                const targetTask = state.lists.flatMap((l: any) => l.tasks || []).find((t: any) => t.id === targetTaskId);
                targetListId = targetTask?.list_id;
                isValidDrop = (targetListId !== undefined);
                if (isValidDrop) {
                    const targetList = state.lists.find((l: any) => l.id === targetListId);
                    targetTaskIndex = targetList.tasks.findIndex((t: any) => t.id === targetTaskId);
                }
            } else {
                return;
            }

            if (!isValidDrop) return;

            // Same column move (reorder)
            if (sourceListId === targetListId) {
                const listIdx = state.lists.findIndex((l: any) => l.id === sourceListId);
                if (listIdx === -1) return;
                const list = state.lists[listIdx];
                const oldIndex = list.tasks.findIndex((t: any) => t.id === taskId);
                let newIndex: number;
                if (over.id.startsWith('list-')) {
                    newIndex = list.tasks.length - 1;
                } else {
                    newIndex = targetTaskIndex ?? 0;
                }
                if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
                const newTasks = arrayMove(list.tasks, oldIndex, newIndex);
                const updatedTasks = newTasks.map((task: any, idx: number) => ({ ...task, position: idx }));
                const newLists = state.lists.map((l: any, idx: number) =>
                    idx === listIdx ? { ...l, tasks: updatedTasks } : l
                );
                state.setLists(newLists);
                // Backend sync: use updateTaskPositions for same-column reordering
                const updates = updatedTasks.map((task: any) => ({
                    id: task.id,
                    position: task.position,
                    list_id: task.list_id,
                }));
                updateTaskPositions(updates);
                return;
            }

            // Cross-column move (keep as is)
            let insertionIndex = 0;
            if (over.id.startsWith('list-')) {
                const targetList = state.lists.find((l: any) => l.id === targetListId);
                insertionIndex = targetList ? targetList.tasks.length : 0;
            } else if (over.id.startsWith('task-')) {
                insertionIndex = targetTaskIndex ?? 0;
            }
            const optimisticUpdate = () => {
                const newLists = state.lists.map((list: any) => ({ ...list, tasks: [...(list.tasks || [])] }));
                const sourceList = newLists.find((l: any) => l.id === sourceListId);
                const targetList = newLists.find((l: any) => l.id === targetListId);
                if (!sourceList || !targetList) return;
                const sourceTaskIndex = sourceList.tasks.findIndex((t: any) => t.id === taskId);
                if (sourceTaskIndex === -1) return;
                const [taskToMove] = sourceList.tasks.splice(sourceTaskIndex, 1);
                const updatedTask = { ...taskToMove, list_id: targetListId ?? undefined };
                targetList.tasks.splice(insertionIndex, 0, updatedTask);
                // Reindex
                sourceList.tasks.forEach((task: any, idx: number) => { task.position = idx; });
                targetList.tasks.forEach((task: any, idx: number) => { task.position = idx; });
                state.setLists(newLists);
            };
            moveTask(taskId, { list_id: targetListId ?? undefined, insertion_position: insertionIndex }, optimisticUpdate);
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

            // Store the source section ID for drag feedback
            if (task && active.data?.current?.sectionId) {
                state.setDragSourceSectionId(active.data.current.sectionId);
            }
        }
    };

    const handleListDragOver = (event: any) => {
        const { over, active } = event;
        state.setListOverId(over?.id || null);

        // Simplified drag feedback for list view (like single column)
        let draggedTaskSectionId = active?.data?.current?.sectionId;

        // Fallback: try to get from the stored active item
        if (!draggedTaskSectionId && state.listActiveItem?.task && active.data?.current?.sectionId) {
            draggedTaskSectionId = active.data.current.sectionId;
        }

        const isTaskDrag = active?.id.toString().startsWith('list-task-');

        // Only provide feedback for same-section drags (purple pulse)
        const feedbackData = {
            overId: over?.id || null,
            overType: over?.id?.toString().startsWith('list-task-') ? 'task' : null,
            activeId: active?.id || null,
            draggedTaskSectionId: draggedTaskSectionId,
            isTaskDrag: isTaskDrag
        };

        state.setListDragFeedback(feedbackData);
    };

    const handleListDragEnd = (event: any) => {
        const { active, over, delta } = event;
        state.setListActiveId(null);
        state.setListActiveItem(null);
        state.setListOverId(null);
        state.setListDragFeedback(null); // Clear list drag feedback
        state.setDragSourceSectionId(null); // Clear source section ID

        if (!over) return;

        // Check if this was actually a drag or just a click (reduced for responsiveness)
        const dragDistance = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
        const minimumDragDistance = 3; // pixels - reduced for more responsive feedback

        // If the drag distance is too small, treat it as a click and don't move the task
        if (dragDistance < minimumDragDistance) {
            return;
        }

        const activeId = active.id;
        const overId = over.id;

        // Only allow reordering within the same section/status (like board column)
        if (activeId.startsWith('list-task-') && overId.startsWith('list-task-')) {
            const taskId = parseInt(activeId.replace('list-task-', ''));
            const overTaskId = parseInt(overId.replace('list-task-', ''));

            if (taskId !== overTaskId) {
                // Find the section containing both tasks
                const sections = getOrganizedTasks(project, listViewMode);
                let section = null;
                let sourceIndex = -1;
                let targetIndex = -1;

                for (const sec of sections) {
                    const taskIds = sec.tasks.map((t: any) => t.id);
                    sourceIndex = taskIds.indexOf(taskId);
                    targetIndex = taskIds.indexOf(overTaskId);
                    if (sourceIndex !== -1 && targetIndex !== -1) {
                        section = sec;
                        break;
                    }
                }

                if (section && sourceIndex !== -1 && targetIndex !== -1) {
                    const newTasks = [...section.tasks];
                    const [movedTask] = newTasks.splice(sourceIndex, 1);

                    // Determine correct insertion index based on drag direction
                    let insertAt = targetIndex;
                    if (sourceIndex < targetIndex) {
                        // Dragging down: insert after the target
                        insertAt = targetIndex + 1;
                    }
                    newTasks.splice(insertAt, 0, movedTask);

                    // Prepare position updates for immediate response
                    const updates = newTasks.map((task: any, index: number) => {
                        // Update status/section_id in real time for the moved task
                        let updatedTask = { ...task };
                        if (task.id === movedTask.id) {
                            if (section.type === 'status') {
                                updatedTask.status = section.id;
                            }
                            if (section.type === 'section' && section.id !== 'no-section') {
                                updatedTask.section_id = parseInt(section.id);
                            }
                        }
                        return {
                            id: updatedTask.id,
                            position: index,
                            list_id: updatedTask.list_id,
                            section_id: section.type === 'section' && section.id !== 'no-section' ? parseInt(section.id) : null,
                            status: section.type === 'status' ? section.id : updatedTask.status
                        };
                    });

                    // Update immediately for responsive feedback
                    updateTaskPositions(updates);
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
