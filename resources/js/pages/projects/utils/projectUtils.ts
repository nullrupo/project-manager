import { Project } from '@/types/project-manager';

/**
 * Get view from URL parameters, default to 'list'
 */
export const getActiveViewFromUrl = (): string => {
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get('view');
    const validViews = ['list', 'board', 'calendar'];
    return validViews.includes(view || '') ? view : 'list';
};

/**
 * Update URL when view changes
 */
export const updateViewInUrl = (newView: string): void => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', newView);
    window.history.pushState({}, '', url.toString());
};

/**
 * Get all tasks from organized sections (for selection purposes)
 */
export const getAllTasksFromSections = (sections: any[]) => {
    return sections.flatMap(section => section.tasks || []);
};

/**
 * Get tasks organized by sections or status
 */
export const getOrganizedTasks = (project: Project, listViewMode: 'status' | 'sections') => {
    if (!project.boards?.[0]?.lists) return [];

    const allTasks = project.boards[0].lists.flatMap(list => list.tasks || []);

    if (listViewMode === 'status') {
        return [
            {
                id: 'to_do',
                name: 'To Do',
                type: 'status',
                tasks: allTasks.filter(task => task.status === 'to_do')
            },
            {
                id: 'in_progress',
                name: 'In Progress',
                type: 'status',
                tasks: allTasks.filter(task => task.status === 'in_progress')
            },
            {
                id: 'done',
                name: 'Done',
                type: 'status',
                tasks: allTasks.filter(task => task.status === 'done')
            }
        ];
    } else {
        // Group by actual project sections
        const sections = [];

        // Add tasks without sections first (if any)
        const tasksWithoutSection = allTasks.filter(task => !task.section_id);
        if (tasksWithoutSection.length > 0) {
            sections.push({
                id: 'no-section',
                name: 'No Section',
                type: 'section',
                description: 'Tasks not assigned to any section',
                tasks: tasksWithoutSection
            });
        }

        // Add actual project sections
        if (project.sections && project.sections.length > 0) {
            const sectionTasks = project.sections.map(section => ({
                id: section.id.toString(),
                name: section.name,
                type: 'section',
                description: section.description,
                tasks: allTasks.filter(task => task.section_id === section.id)
            }));
            sections.push(...sectionTasks);
        }

        return sections;
    }
};

/**
 * Filter boards based on search query and type filter
 */
export const filterBoards = (
    boards: any[] | undefined,
    searchQuery: string,
    typeFilter: string
) => {
    return boards?.filter(board => {
        const matchesSearch = board.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (board.description && board.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesType = typeFilter === 'all' || board.type === typeFilter;
        return matchesSearch && matchesType;
    }) || [];
};

/**
 * Toggle section collapse state
 */
export const toggleSectionCollapse = (
    sectionId: string,
    collapsedSections: Set<string>,
    setCollapsedSections: (value: Set<string>) => void
) => {
    setCollapsedSections(prev => {
        const newSet = new Set(prev);
        if (newSet.has(sectionId)) {
            newSet.delete(sectionId);
        } else {
            newSet.add(sectionId);
        }
        return newSet;
    });
};
