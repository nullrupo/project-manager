import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Button } from '@/components/ui/button';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, Inbox, LayoutDashboard, LayoutGrid, ListTodo, PanelLeftIcon, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
        icon: LayoutDashboard,
    },
    {
        title: 'Projects',
        href: route('projects.index'),
        icon: Folder,
    },
    {
        title: 'Inbox',
        href: route('inbox'),
        icon: Inbox,
    },
    {
        title: 'My Tasks',
        href: route('my-tasks'),
        icon: ListTodo,
    },
    {
        title: 'Team',
        href: route('team'),
        icon: Users,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Settings',
        href: route('profile.edit'),
        icon: LayoutGrid,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    // Use local state for sidebar collapse
    const [collapsed, setCollapsed] = useState(() => {
        // Read from cookie on initial render
        if (typeof document !== 'undefined') {
            const cookies = document.cookie.split(';');
            const sidebarCookie = cookies.find(cookie => cookie.trim().startsWith('sidebar_state='));

            if (sidebarCookie) {
                const cookieValue = sidebarCookie.split('=')[1].trim();
                return cookieValue === 'false'; // true means expanded, false means collapsed
            }
        }
        return false; // Default to expanded
    });

    // Function to toggle sidebar state
    const toggleSidebar = () => {
        const newState = !collapsed;
        setCollapsed(newState);

        // Save to cookie
        document.cookie = `sidebar_state=${!newState}; path=/; max-age=${60 * 60 * 24 * 7}`;
    };

    return (
        <div className={`bg-sidebar text-sidebar-foreground flex h-screen flex-col transition-all duration-200 ${collapsed ? 'w-[3rem]' : 'w-[16rem]'}`}>
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-4">
                    <div className="flex items-center">
                        <Link href={route('dashboard')} prefetch className={`flex items-center ${collapsed ? 'justify-center' : ''}`}>
                            <AppLogo />
                        </Link>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    <NavMain items={mainNavItems} />
                </div>

                {/* Footer */}
                <div className="mt-auto">
                    <div className="flex flex-col gap-2 px-4 py-2">
                        <ThemeSwitcher />
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 px-3 py-2 h-9 border-sidebar-border/50 bg-sidebar-accent/20 hover:bg-sidebar-accent/30"
                            onClick={toggleSidebar}
                        >
                            <PanelLeftIcon className={`h-5 w-5 ${collapsed ? 'rotate-180' : ''}`} />
                            <span className="hidden md:inline">{collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}</span>
                        </Button>
                    </div>
                    <NavFooter items={footerNavItems} className="mt-auto" />
                    <NavUser />
                </div>
            </div>
        </div>
    );
}
