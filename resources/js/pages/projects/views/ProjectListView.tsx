import { useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Menu, Plus, ChevronDown, ChevronRight, Layers, ListTodo, Edit } from 'lucide-react';
import { Project } from '@/types/project-manager';
import { TaskInspector } from '@/components/project/task-inspector/TaskInspector';
import ListTaskItem from '../components/ListTaskItem';
import { getOrganizedTasks, toggleSectionCollapse } from '../utils/projectUtils';
import { TaskDisplayCustomizer } from '@/components/task/TaskDisplayCustomizer';
import QuickAddTask from '@/components/project/QuickAddTask';
import TaskCreateModal from '@/components/task-create-modal';
import { useTags } from '@/hooks/useTags';
import { router } from '@inertiajs/react';

interface ProjectListViewProps {
    project: Project;
    state: any;
    sensors: any;
    onDragStart: (event: any) => void;
    onDragOver: (event: any) => void;
    onDragEnd: (event: any) => void;
    onTaskClick: (task: any) => void;
    onEditTask: (task: any) => void;
    onCreateSection: () => void;
    onEditSection: (section: any) => void;
    onDeleteSection: (section: any) => void;
    onCreateTask?: (sectionId?: string, status?: string) => void;
}

export default function ProjectListView({
    project,
    state,
    sensors,
    onDragStart,
    onDragOver,
    onDragEnd,
    onTaskClick,
    onEditTask,
    onCreateSection,
    onEditSection,
    onDeleteSection,
    onCreateTask
}: ProjectListViewProps) {
    const [taskCreateModalOpen, setTaskCreateModalOpen] = useState(false);
    const { tags } = useTags();

    const sections = getOrganizedTasks(project, state.listViewMode);

    const handleSectionToggle = (sectionId: string) => {
        toggleSectionCollapse(sectionId, state.collapsedSections, state.setCollapsedSections);
    };

    const handleCreateTask = (sectionId?: string, status?: string) => {
        if (onCreateTask) {
            // Handle special "no-section" case
            const actualSectionId = sectionId === 'no-section' ? undefined : sectionId;
            onCreateTask(actualSectionId, status);
        } else {
            // Fallback to direct navigation if no handler provided
            const params: any = {
                project: project.id,
                board: project.boards?.[0]?.id,
                list: project.boards?.[0]?.lists?.[0]?.id,
                view: 'list'
            };

            if (sectionId && sectionId !== 'no-section' && state.listViewMode === 'sections') {
                params.section_id = sectionId;
            }
            if (status && state.listViewMode === 'status') {
                params.status = status;
            }

            router.get(route('tasks.create', params));
        }
    };

    return (
        <div className="flex h-[calc(100vh-200px)] mt-0">
            {/* Main List Content */}
            <div className={`flex-1 ${state.inspectorOpen ? 'mr-0' : ''}`}>
                <Card className="rounded-t-none border-t-0 h-full">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Menu className="h-5 w-5" />
                                    Task List
                                </CardTitle>
                                <CardDescription>
                                    Hierarchical outline view with inspector panel
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <TaskDisplayCustomizer pageKey={`project-list-${project.id}`} />
                                <Separator orientation="vertical" className="h-6" />
                                {project.can_manage_tasks && (
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => setTaskCreateModalOpen(true)}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        New Task
                                    </Button>
                                )}
                                {state.listViewMode === 'sections' && project.can_manage_tasks && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onCreateSection}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Section
                                    </Button>
                                )}
                                <Separator orientation="vertical" className="h-6" />
                                <Button
                                    variant={state.listViewMode === 'sections' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => state.setListViewMode('sections')}
                                >
                                    <Layers className="h-4 w-4 mr-2" />
                                    Sections
                                </Button>
                                <Button
                                    variant={state.listViewMode === 'status' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => state.setListViewMode('status')}
                                >
                                    <ListTodo className="h-4 w-4 mr-2" />
                                    Status
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto">
                        {project.boards && project.boards.length > 0 ? (
                            <>
                                {/* Quick Add Task - Always visible at top */}
                                {project.can_manage_tasks && (
                                    <div className="mb-4">
                                        <QuickAddTask
                                            project={project}
                                            sectionId={null}
                                            status="to_do"
                                            placeholder="Quick add a task (no section)..."
                                        />
                                    </div>
                                )}

                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragStart={onDragStart}
                                    onDragOver={onDragOver}
                                    onDragEnd={onDragEnd}
                                    modifiers={[restrictToWindowEdges]}
                                >
                                    <div className="space-y-4">
                                    {sections.map((section) => {
                                        const isCollapsed = state.collapsedSections.has(section.id);
                                        const taskIds = section.tasks.map((task: any) => `list-task-${task.id}`);

                                        return (
                                            <div key={section.id} className="space-y-2">
                                                {/* Section Header */}
                                                <div
                                                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30 hover:bg-muted/50 transition-colors cursor-pointer"
                                                    onClick={() => handleSectionToggle(section.id)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0"
                                                        >
                                                            {isCollapsed ? (
                                                                <ChevronRight className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronDown className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                        <h3 className="font-semibold text-foreground">
                                                            {section.name}
                                                        </h3>
                                                        <span className="text-sm text-muted-foreground">
                                                            ({section.tasks.length})
                                                        </span>
                                                    </div>
                                                    {project.can_manage_tasks && (
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCreateTask(
                                                                        state.listViewMode === 'sections' ? section.id : undefined,
                                                                        state.listViewMode === 'status' ? section.id : undefined
                                                                    );
                                                                }}
                                                                title="Add Task"
                                                            >
                                                                <Plus className="h-4 w-4" />
                                                            </Button>
                                                            {section.type === 'section' && (
                                                                <>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onEditSection(section);
                                                                        }}
                                                                    >
                                                                        Edit
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onDeleteSection(section);
                                                                        }}
                                                                    >
                                                                        Delete
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Section Tasks */}
                                                {!isCollapsed && (
                                                    <SortableContext
                                                        items={taskIds}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        <div className="space-y-2 ml-6">
                                                            {section.tasks.map((task: any) => (
                                                                <ListTaskItem
                                                                    key={task.id}
                                                                    task={task}
                                                                    project={project}
                                                                    sectionId={section.id}
                                                                    onTaskClick={onTaskClick}
                                                                    onEditTask={onEditTask}
                                                                    currentView={state.activeView}
                                                                />
                                                            ))}
                                                            {/* Quick Add for this section */}
                                                            {project.can_manage_tasks && (
                                                                <div className="mt-2">
                                                                    <QuickAddTask
                                                                        project={project}
                                                                        sectionId={section.id}
                                                                        status={state.listViewMode === 'status' ? section.id : 'to_do'}
                                                                        placeholder={`Add task to ${section.name}...`}
                                                                        className="border-dashed"
                                                                    />
                                                                </div>
                                                            )}

                                                            {section.tasks.length === 0 && (
                                                                <div className="text-center py-8 text-muted-foreground">
                                                                    <p className="mb-4">No tasks in this section</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </SortableContext>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Show helpful message when no tasks exist at all */}
                                    {sections.length === 0 && state.listViewMode === 'status' && (
                                        <div className="text-center py-16 bg-gradient-to-br from-muted/20 to-muted/40 rounded-xl border-2 border-dashed border-muted-foreground/30">
                                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <ListTodo className="h-10 w-10 text-green-500" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                                No Tasks Yet
                                            </h3>
                                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                                Start by creating your first task using the quick-add form above.
                                            </p>
                                        </div>
                                    )}

                                    {sections.length === 0 && state.listViewMode === 'sections' && (
                                        <div className="text-center py-16 bg-gradient-to-br from-muted/20 to-muted/40 rounded-xl border-2 border-dashed border-muted-foreground/30">
                                            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Layers className="h-10 w-10 text-blue-500" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                                No Sections Yet
                                            </h3>
                                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                                Create sections to organize your tasks into logical groups and improve your workflow.
                                                <br />
                                                <span className="text-sm">Or use the quick-add above to create tasks without sections.</span>
                                            </p>
                                            {project.can_manage_tasks && (
                                                <div className="flex gap-2 justify-center">
                                                    <Button onClick={onCreateSection}>
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Create Section
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    </div>
                                </DndContext>
                            </>
                        ) : (
                            <div className="text-center py-16">
                                <p className="text-muted-foreground">No board available for this project.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Task Create Modal */}
            <TaskCreateModal
                open={taskCreateModalOpen}
                onOpenChange={setTaskCreateModalOpen}
                project={project}
                members={project.members || []}
                labels={project.labels || []}
                tags={tags}
                sections={project.sections || []}
                onSuccess={() => {
                    // Refresh the page to show the new task
                    router.reload();
                }}
            />
        </div>
    );
}
