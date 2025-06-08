import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger, 
    DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { GripVertical, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Project } from '@/types/project-manager';
import { useShortName } from '@/hooks/use-initials';
import { useTaskOperations } from '../hooks/useTaskOperations';
import { TaskDisplay } from '@/components/task/TaskDisplay';

interface ListTaskItemProps {
    task: any;
    project: Project;
    sectionId?: string;
    onTaskClick: (task: any) => void;
    onEditTask: (task: any) => void;
}

export default function ListTaskItem({ 
    task, 
    project, 
    sectionId, 
    onTaskClick, 
    onEditTask 
}: ListTaskItemProps) {
    const getShortName = useShortName();
    const { toggleTaskCompletion, deleteTask } = useTaskOperations(project);

    // Drag and drop functionality
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `list-task-${task.id}`,
        data: {
            type: 'task',
            task,
            sectionId
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 1000 : 'auto',
    };

    const handleTaskClick = () => {
        if (!isDragging) {
            onTaskClick(task);
        }
    };

    const handleCheckboxChange = () => {
        toggleTaskCompletion(task.id);
    };

    const handleDeleteTask = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteTask(task.id);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative bg-white dark:bg-gray-800 border border-border rounded-lg p-3 hover:shadow-md transition-all duration-200 cursor-pointer ${
                task.status === 'done' ? 'opacity-60' : ''
            }`}
            data-task-clickable
            onClick={handleTaskClick}
        >
            {/* Drag handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute left-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10 p-1 rounded hover:bg-muted/50"
            >
                <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </div>

            <div className="flex items-start gap-3">
                {/* Completion checkbox */}
                <Checkbox
                    checked={task.status === 'done'}
                    onCheckedChange={handleCheckboxChange}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1"
                />

                {/* Task content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <TaskDisplay task={task} compact pageKey={`project-list-${task.project_id}`} />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 ml-2">
                            {project.can_manage_tasks && (
                                <>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                <MoreHorizontal className="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation();
                                                onEditTask(task);
                                            }}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={handleDeleteTask}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
