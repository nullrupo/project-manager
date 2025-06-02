import { User } from './index';

export interface Project {
    id: number;
    name: string;
    key: string;
    description: string | null;
    owner_id: number;
    icon: string | null;
    background_color: string | null;
    is_public: boolean;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
    owner?: User;
    members?: User[];
    boards?: Board[];
    can_edit?: boolean;
    can_manage_members?: boolean;
    can_manage_tasks?: boolean;
    can_manage_labels?: boolean;
    user_role?: string;
    user_permissions?: {
        can_manage_members: boolean;
        can_manage_boards: boolean;
        can_manage_tasks: boolean;
        can_manage_labels: boolean;
        can_view_project: boolean;
        can_comment: boolean;
    };
    is_favorited?: boolean;
}

export interface Board {
    id: number;
    name: string;
    description: string | null;
    project_id: number;
    type: 'kanban' | 'scrum' | 'custom';
    is_default: boolean;
    position: number;
    background_color: string | null;
    background_image: string | null;
    created_at: string;
    updated_at: string;
    project?: Project;
    lists?: TaskList[];
    can_edit?: boolean;
    can_manage_tasks?: boolean;
}

export interface TaskList {
    id: number;
    name: string;
    board_id: number;
    position: number;
    color: string | null;
    is_archived: boolean;
    work_in_progress_limit: number | null;
    created_at: string;
    updated_at: string;
    board?: Board;
    tasks?: Task[];
}

export interface Task {
    id: number;
    title: string;
    description: string | null;
    list_id: number | null;
    project_id: number | null;
    created_by: number;
    position: number;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'to_do' | 'in_progress' | 'done';
    estimate: number | null;
    due_date: string | null;
    completed_at: string | null;
    is_archived: boolean;
    is_inbox: boolean;
    created_at: string;
    updated_at: string;
    list?: TaskList;
    project?: Project;
    creator?: User;
    assignees?: User[];
    labels?: Label[];
    comments?: Comment[];
}

export interface Label {
    id: number;
    name: string;
    color: string;
    project_id: number;
    description: string | null;
    created_at: string;
    updated_at: string;
    project?: Project;
    tasks?: Task[];
}

export interface Comment {
    id: number;
    content: string;
    task_id: number;
    user_id: number;
    parent_id: number | null;
    is_edited: boolean;
    created_at: string;
    updated_at: string;
    task?: Task;
    user?: User;
    parent?: Comment;
    replies?: Comment[];
}
