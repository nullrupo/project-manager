import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    id?: string;
    title: string;
    items: NavItem[];
    collapsed?: boolean;
    customizable?: boolean;
    user_created?: boolean;
    position?: number;
}

export interface NavItem {
    id?: string;
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    user_created?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    flash: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
    settings?: {
        short_name_format?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

export interface SidebarPreferences {
    collapsed_groups: string[];
    custom_groups?: CustomNavGroup[];
    group_order?: string[];
    hidden_items?: string[];
}

export interface CustomNavGroup {
    id: string;
    title: string;
    items: NavItem[];
    customizable: boolean;
    user_created: boolean;
    position: number;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    is_admin?: boolean;
    created_at: string;
    updated_at: string;
    sidebar_preferences?: SidebarPreferences;
    task_display_preferences?: {
        show_urgency: boolean;
        show_notes: boolean;
        show_deadline: boolean;
        show_checklist_progress: boolean;
        show_assignee: boolean;
        show_status: boolean;
    };
    pivot?: {
        role: string;
        can_manage_members: boolean;
        can_manage_boards: boolean;
        can_manage_tasks: boolean;
        can_manage_labels: boolean;
        can_view_project: boolean;
        can_comment: boolean;
    };
    [key: string]: unknown; // This allows for additional properties...
}

export interface RecentActivity {
    type: string;
    action: string;
    target: string;
    project?: string;
    user: string;
    date: string;
    icon: string;
    link: string;
}
