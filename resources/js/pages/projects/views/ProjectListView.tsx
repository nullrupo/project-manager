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
    
    const sections = getOrganizedTasks(project, state.listViewMode);

    const handleSectionToggle = (sectionId: string) => {
        toggleSectionCollapse(sectionId, state.collapsedSections, state.setCollapsedSections);
    };

    const handleCreateTask = (sectionId?: string, status?: string) => {
        if (onCreateTask) {
            onCreateTask(sectionId, status);
        } else {
            // Fallback to direct navigation if no handler provided
            const params: any = {
                project: project.id,
                board: project.boards?.[0]?.id,
                list: project.boards?.[0]?.lists?.[0]?.id,
                view: 'list'
            };

            if (sectionId && state.listViewMode === 'sections') {
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
                                                            {section.tasks.length === 0 && (
                                                                <div className="text-center py-8 text-muted-foreground">
                                                                    <p className="mb-4">No tasks in this section</p>
                                                                    {project.can_manage_tasks && (
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => handleCreateTask(
                                                                                state.listViewMode === 'sections' ? section.id : undefined,
                                                                                state.listViewMode === 'status' ? section.id : undefined
                                                                            )}
                                                                        >
                                                                            <Plus className="h-4 w-4 mr-2" />
                                                                            Add First Task
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </SortableContext>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {sections.length === 0 && (
                                        <div className="text-center py-16 bg-gradient-to-br from-muted/20 to-muted/40 rounded-xl border-2 border-dashed border-muted-foreground/30">
                                            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Layers className="h-10 w-10 text-blue-500" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                                No Sections Yet
                                            </h3>
                                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                                Create sections to organize your tasks into logical groups and improve your workflow.
                                            </p>
                                            {project.can_manage_tasks && (
                                                <Button onClick={onCreateSection}>
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Create First Section
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </DndContext>
                        ) : (
                            <div className="text-center py-16">
                                <p className="text-muted-foreground">No board available for this project.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}
