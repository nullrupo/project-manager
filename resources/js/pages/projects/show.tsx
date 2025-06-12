import AppLayout from '@/layouts/app-layout';
import { type SharedData } from '@/types';
import { Project } from '@/types/project-manager';
import { Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import InviteMemberModal from '@/components/invite-member-modal';
import MemberPermissionModal from '@/components/member-permission-modal';
import { SectionEditForm, SectionCreateForm } from '@/components/project/sections/SectionForms';
import ProjectDetailsModal from './components/ProjectDetailsModal';

// Import view components
import ProjectListView from './views/ProjectListView';
import ProjectBoardView from './views/ProjectBoardView';
import ProjectCalendarView from './views/ProjectCalendarView';

// Import shared components
import ProjectHeader from './components/ProjectHeader';
import ViewSwitcher from './components/ViewSwitcher';
import TaskModals from './components/TaskModals';

// Import hooks
import { useProjectState } from './hooks/useProjectState';
import { useTaskOperations } from './hooks/useTaskOperations';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useGlobalTaskInspector } from '@/contexts/GlobalTaskInspectorContext';

interface ProjectShowProps {
    project: Project;
}

export default function ProjectShow({ project }: ProjectShowProps) {
    const { auth } = usePage<SharedData>().props;
    const canEdit = project.can_edit;

    // Use custom hooks
    const state = useProjectState(project);
    const taskOperations = useTaskOperations(project, state.activeView, state.currentBoardId);
    const dragAndDrop = useDragAndDrop(project, state, state.listViewMode);
    const { openInspector: openGlobalInspector } = useGlobalTaskInspector();

    // Task handlers
    const handleEditTask = (task: any) => {
        state.setSelectedTask(task);
        state.setTaskEditModalOpen(true);
    };

    const handleViewTask = (task: any) => {
        state.setSelectedTask(task);
        state.setTaskViewModalOpen(true);
    };

    const handleEditFromView = () => {
        state.setTaskViewModalOpen(false);
        state.setTaskEditModalOpen(true);
    };

    // Inspector functions
    const openInspector = (task: any) => {
        openGlobalInspector(task, project);
    };

    // Section management
    const handleCreateSection = () => {
        state.setSectionCreateModalOpen(true);
    };

    const handleEditSection = (section: any) => {
        state.setEditingSection(section);
        state.setSectionEditModalOpen(true);
    };

    const handleDeleteSection = (section: any) => {
        if (confirm('Are you sure you want to delete this section? Tasks will be moved to no section.')) {
            router.delete(route('sections.destroy', { project: project.id, section: section.id }));
        }
    };

    // Task creation handler
    const handleCreateTask = (sectionId?: string, status?: string) => {
        const params: any = {
            project: project.id,
            board: project.boards?.[0]?.id,
            list: project.boards?.[0]?.lists?.[0]?.id,
            view: 'list'
        };

        // Handle special "no-section" case - don't pass section_id for tasks without sections
        if (sectionId && sectionId !== 'no-section' && state.listViewMode === 'sections') {
            params.section_id = sectionId;
        }
        if (status && state.listViewMode === 'status') {
            params.status = status;
        }

        router.get(route('tasks.create', params));
    };

    // Member management
    const handleInviteMember = () => {
        state.setInviteModalOpen(true);
    };

    const handleOpenDetails = () => {
        state.setDetailsModalOpen(true);
    };

    // Member deletion handler
    const handleDeleteMember = () => {
        if (state.memberToDelete) {
            router.delete(route('projects.members.destroy', { project: project.id, user: state.memberToDelete.id }));
            state.setMemberToDelete(null);
        }
    };

    return (
        <AppLayout>
            <Head title={`${project.name} - Project`} />

            {/* Project Header */}
            <ProjectHeader
                project={project}
                canEdit={canEdit}
                onInviteMember={handleInviteMember}
                onOpenDetails={handleOpenDetails}
            />

            {/* View Switcher */}
            <ViewSwitcher
                activeView={state.activeView}
                setActiveView={state.setActiveView}
                project={project}
            />

            {/* View Content */}
            {state.activeView === 'list' && (
                <ProjectListView
                    project={project}
                    state={state}
                    sensors={dragAndDrop.sensors}
                    onDragStart={dragAndDrop.handleListDragStart}
                    onDragOver={dragAndDrop.handleListDragOver}
                    onDragEnd={dragAndDrop.handleListDragEnd}
                    onTaskClick={openInspector}
                    onEditTask={handleEditTask}
                    onCreateSection={handleCreateSection}
                    onEditSection={handleEditSection}
                    onDeleteSection={handleDeleteSection}
                    onCreateTask={handleCreateTask}
                />
            )}

            {state.activeView === 'board' && (
                <ProjectBoardView
                    project={project}
                    state={state}
                    sensors={dragAndDrop.sensors}
                    onDragStart={dragAndDrop.handleBoardDragStart}
                    onDragOver={dragAndDrop.handleBoardDragOver}
                    onDragEnd={dragAndDrop.handleBoardDragEnd}
                    onViewTask={handleViewTask}
                    onEditTask={handleEditTask}
                    onTaskClick={openInspector}
                />
            )}

            {state.activeView === 'calendar' && (
                <ProjectCalendarView
                    project={project}
                    state={state}
                />
            )}

            {/* Task Modals */}
            <TaskModals
                project={project}
                selectedTask={state.selectedTask}
                taskEditModalOpen={state.taskEditModalOpen}
                setTaskEditModalOpen={state.setTaskEditModalOpen}
                taskViewModalOpen={state.taskViewModalOpen}
                setTaskViewModalOpen={state.setTaskViewModalOpen}
                onEditFromView={handleEditFromView}
            />

            {/* Member Management Modals */}
            <InviteMemberModal
                project={project}
                open={state.inviteModalOpen}
                onOpenChange={state.setInviteModalOpen}
            />

            <ConfirmDialog
                open={state.deleteDialogOpen}
                onOpenChange={state.setDeleteDialogOpen}
                title="Remove Team Member"
                description={`Are you sure you want to remove ${state.memberToDelete?.name} from this project? They will lose access to all project resources.`}
                onConfirm={handleDeleteMember}
                confirmText="Remove"
                cancelText="Cancel"
                variant="destructive"
            />

            <MemberPermissionModal
                project={project}
                member={state.editingMember}
                open={state.permissionModalOpen}
                onOpenChange={state.setPermissionModalOpen}
            />

            {/* Project Details Modal */}
            <ProjectDetailsModal
                project={project}
                open={state.detailsModalOpen}
                onOpenChange={state.setDetailsModalOpen}
            />

            {/* Section Management Modals */}
            <Dialog open={state.sectionEditModalOpen} onOpenChange={state.setSectionEditModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Section</DialogTitle>
                        <DialogDescription>
                            Update the section name and description.
                        </DialogDescription>
                    </DialogHeader>
                    {state.editingSection && (
                        <SectionEditForm
                            section={state.editingSection}
                            project={project}
                            onClose={() => state.setSectionEditModalOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={state.sectionCreateModalOpen} onOpenChange={state.setSectionCreateModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Create New Section</DialogTitle>
                        <DialogDescription>
                            Create a new section to organize your tasks.
                        </DialogDescription>
                    </DialogHeader>
                    <SectionCreateForm
                        project={project}
                        onClose={() => state.setSectionCreateModalOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
