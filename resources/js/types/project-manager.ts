import { User } from './index';

export interface Project {
    id: number;
    name: string;
    key: string;
    description: string | null;
    owner_id: number;
    icon: string | null;
    background_color: string | null;
    is_archived: boolean;
    completion_behavior: 'simple' | 'review' | 'custom';
    requires_review: boolean;
    default_reviewer_id: number | null;
    created_at: string;
    updated_at: string;
    owner?: User;
    default_reviewer?: User;
    members?: User[];
    boards?: Board[];
    sections?: Section[];
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
    is_team_project?: boolean;
    is_personal_project?: boolean;
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
    reviewer_id: number | null;
    section_id: number | null;
    position: number;
    priority: 'low' | 'medium' | 'high';
    status: 'to_do' | 'in_progress' | 'review' | 'done';
    review_status?: 'pending' | 'approved' | 'rejected' | null;
    estimate: number | null;
    due_date: string | null;
    start_date: string | null;
    duration_days: number | null;
    completed_at: string | null;
    is_archived: boolean;
    is_inbox: boolean;
    created_at: string;
    updated_at: string;
    list?: TaskList;
    project?: Project;
    creator?: User;
    reviewer?: User;
    section?: Section;
    checklist_items?: ChecklistItem[];
    assignees?: User[];
    labels?: Label[];
    tags?: Tag[];
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

export interface Tag {
    id: number;
    name: string;
    color: string;
    user_id: number;
    description: string | null;
    is_default: boolean;
    created_at: string;
    updated_at: string;
    user?: User;
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

export interface Section {
    id: number;
    name: string;
    description: string | null;
    project_id: number;
    position: number;
    is_collapsed: boolean;
    created_at: string;
    updated_at: string;
    project?: Project;
    tasks?: Task[];
}

export interface ChecklistItem {
    id: number;
    title: string;
    task_id: number;
    is_completed: boolean;
    position: number;
    created_at: string;
    updated_at: string;
    task?: Task;
}
