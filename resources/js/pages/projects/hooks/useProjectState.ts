import { useState, useEffect } from 'react';
import { Project } from '@/types/project-manager';
import { getActiveViewFromUrl } from '../utils/projectUtils';

/**
 * Custom hook to manage project state
 */
export const useProjectState = (project: Project) => {
    // View state
    const [activeView, setActiveView] = useState(getActiveViewFromUrl);
    
    // Modal states
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<any>(null);
    const [permissionModalOpen, setPermissionModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<any>(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    
    // Board state
    const [currentBoardId, setCurrentBoardId] = useState<number | undefined>(project.boards?.[0]?.id);
    const [lists, setLists] = useState(project.boards?.[0]?.lists || []);
    const [boardSearchQuery, setBoardSearchQuery] = useState('');
    const [boardTypeFilter, setBoardTypeFilter] = useState('all');
    
    // Calendar state
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [memberPanelOpen, setMemberPanelOpen] = useState(false);
    
    // Task modal states
    const [taskEditModalOpen, setTaskEditModalOpen] = useState(false);
    const [taskViewModalOpen, setTaskViewModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);

    // Task creation modal states
    const [taskCreateModalOpen, setTaskCreateModalOpen] = useState(false);
    const [taskCreateDefaultSection, setTaskCreateDefaultSection] = useState<string | null>(null);
    const [taskCreateDefaultStatus, setTaskCreateDefaultStatus] = useState<string>('to_do');
    
    // List view state
    const [listViewMode, setListViewMode] = useState<'status' | 'sections'>('sections');
    const [inspectorOpen, setInspectorOpen] = useState(false);
    const [inspectorTask, setInspectorTask] = useState<any>(null);
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

    // Task selection state
    const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
    const [currentFocusedTaskId, setCurrentFocusedTaskId] = useState<number | null>(null);
    const [lastSelectedTaskId, setLastSelectedTaskId] = useState<number | null>(null);
    const [showBulkActions, setShowBulkActions] = useState(false);
    
    // Section management state
    const [editingSection, setEditingSection] = useState<any>(null);
    const [sectionEditModalOpen, setSectionEditModalOpen] = useState(false);
    const [sectionCreateModalOpen, setSectionCreateModalOpen] = useState(false);
    
    // Drag and drop state
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeItem, setActiveItem] = useState<any | null>(null);
    const [listActiveId, setListActiveId] = useState<string | null>(null);
    const [listActiveItem, setListActiveItem] = useState<any | null>(null);
    const [listOverId, setListOverId] = useState<string | null>(null);
    const [dragSourceListId, setDragSourceListId] = useState<number | null>(null);
    const [dragFeedback, setDragFeedback] = useState<{
        overId: string | null;
        overType: 'task' | 'list' | null;
        activeId: string | null;
        draggedTaskListId: number | null;
        isTaskDrag: boolean;
    } | null>(null);

    const [listDragFeedback, setListDragFeedback] = useState<{
        overId: string | null;
        overType: 'task' | 'insertion' | null;
        activeId: string | null;
        draggedTaskSectionId: string | null;
        isTaskDrag: boolean;
    } | null>(null);

    const [dragSourceSectionId, setDragSourceSectionId] = useState<string | null>(null);
    
    // Calendar drag state
    const [activeTask, setActiveTask] = useState<any>(null);
    const [draggedTask, setDraggedTask] = useState<any>(null);
    const [isUpdatingTask, setIsUpdatingTask] = useState(false);
    const [isDragInProgress, setIsDragInProgress] = useState(false);
    const [localTaskUpdates, setLocalTaskUpdates] = useState<Record<number, any>>({});
    const [isAnyHandleResizing, setIsAnyHandleResizing] = useState(false);
    
    // Task duration and detail modals
    const [durationModalOpen, setDurationModalOpen] = useState(false);
    const [taskToExtend, setTaskToExtend] = useState<any>(null);
    const [taskDetailModalOpen, setTaskDetailModalOpen] = useState(false);
    const [taskDetailTask, setTaskDetailTask] = useState<any>(null);
    
    // Listen for browser back/forward navigation
    useEffect(() => {
        const handlePopState = () => {
            setActiveView(getActiveViewFromUrl());
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Update lists when board changes
    useEffect(() => {
        const currentBoard = project.boards?.find(board => board.id === currentBoardId);
        if (currentBoard) {
            setLists(currentBoard.lists || []);
        }
    }, [currentBoardId, project.boards]);

    return {
        // View state
        activeView,
        setActiveView,
        
        // Modal states
        inviteModalOpen,
        setInviteModalOpen,
        deleteDialogOpen,
        setDeleteDialogOpen,
        memberToDelete,
        setMemberToDelete,
        permissionModalOpen,
        setPermissionModalOpen,
        editingMember,
        setEditingMember,
        detailsModalOpen,
        setDetailsModalOpen,
        
        // Board state
        currentBoardId,
        setCurrentBoardId,
        lists,
        setLists,
        boardSearchQuery,
        setBoardSearchQuery,
        boardTypeFilter,
        setBoardTypeFilter,
        
        // Calendar state
        currentDate,
        setCurrentDate,
        selectedDay,
        setSelectedDay,
        memberPanelOpen,
        setMemberPanelOpen,
        
        // Task modal states
        taskEditModalOpen,
        setTaskEditModalOpen,
        taskViewModalOpen,
        setTaskViewModalOpen,
        selectedTask,
        setSelectedTask,

        // Task creation modal states
        taskCreateModalOpen,
        setTaskCreateModalOpen,
        taskCreateDefaultSection,
        setTaskCreateDefaultSection,
        taskCreateDefaultStatus,
        setTaskCreateDefaultStatus,
        
        // List view state
        listViewMode,
        setListViewMode,
        inspectorOpen,
        setInspectorOpen,
        inspectorTask,
        setInspectorTask,
        collapsedSections,
        setCollapsedSections,

        // Task selection state
        selectedTasks,
        setSelectedTasks,
        currentFocusedTaskId,
        setCurrentFocusedTaskId,
        lastSelectedTaskId,
        setLastSelectedTaskId,
        showBulkActions,
        setShowBulkActions,
        
        // Section management state
        editingSection,
        setEditingSection,
        sectionEditModalOpen,
        setSectionEditModalOpen,
        sectionCreateModalOpen,
        setSectionCreateModalOpen,
        
        // Drag and drop state
        activeId,
        setActiveId,
        activeItem,
        setActiveItem,
        listActiveId,
        setListActiveId,
        listActiveItem,
        setListActiveItem,
        listOverId,
        setListOverId,
        dragSourceListId,
        setDragSourceListId,
        dragFeedback,
        setDragFeedback,
        listDragFeedback,
        setListDragFeedback,
        dragSourceSectionId,
        setDragSourceSectionId,
        
        // Calendar drag state
        activeTask,
        setActiveTask,
        draggedTask,
        setDraggedTask,
        isUpdatingTask,
        setIsUpdatingTask,
        isDragInProgress,
        setIsDragInProgress,
        localTaskUpdates,
        setLocalTaskUpdates,
        isAnyHandleResizing,
        setIsAnyHandleResizing,
        
        // Task duration and detail modals
        durationModalOpen,
        setDurationModalOpen,
        taskToExtend,
        setTaskToExtend,
        taskDetailModalOpen,
        setTaskDetailModalOpen,
        taskDetailTask,
        setTaskDetailTask,
    };
};
