import TaskEditModal from '@/components/task-edit-modal';
import TaskViewModal from '@/components/task-view-modal';
import { Project } from '@/types/project-manager';

interface TaskModalsProps {
    project: Project;
    selectedTask: any;
    taskEditModalOpen: boolean;
    setTaskEditModalOpen: (open: boolean) => void;
    taskViewModalOpen: boolean;
    setTaskViewModalOpen: (open: boolean) => void;
    onEditFromView: () => void;
}

export default function TaskModals({
    project,
    selectedTask,
    taskEditModalOpen,
    setTaskEditModalOpen,
    taskViewModalOpen,
    setTaskViewModalOpen,
    onEditFromView
}: TaskModalsProps) {
    return (
        <>
            {/* Task Edit Modal */}
            {selectedTask && (
                <TaskEditModal
                    open={taskEditModalOpen}
                    onOpenChange={setTaskEditModalOpen}
                    project={project}
                    task={selectedTask}
                    onSuccess={() => {
                        setTaskEditModalOpen(false);
                    }}
                />
            )}

            {/* Task View Modal */}
            {selectedTask && (
                <TaskViewModal
                    open={taskViewModalOpen}
                    onOpenChange={setTaskViewModalOpen}
                    project={project}
                    task={selectedTask}
                    onEdit={onEditFromView}
                />
            )}
        </>
    );
}
