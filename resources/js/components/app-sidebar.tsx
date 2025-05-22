import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, Inbox, LayoutDashboard, LayoutGrid, ListTodo, Users } from 'lucide-react';
import { useEffect } from 'react';
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
    // Access the sidebar context to ensure state is preserved during navigation
    const { state, open, setOpen } = useSidebar();

    // This effect ensures the sidebar state is consistent with the cookie
    useEffect(() => {
        // Read the cookie to ensure state consistency
        const cookies = document.cookie.split(';');
        const sidebarCookie = cookies.find(cookie => cookie.trim().startsWith('sidebar_state='));

        if (sidebarCookie) {
            const cookieValue = sidebarCookie.split('=')[1].trim();
            const cookieState = cookieValue === 'true';

            // Only update if there's a mismatch
            if (cookieState !== open) {
                setOpen(cookieState);
            }
        }
    }, [open, setOpen]);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={route('dashboard')} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <div className="flex items-center justify-between px-4 py-2">
                    <ThemeSwitcher />
                    <SidebarTrigger className="ml-auto" />
                </div>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
