import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Button } from '@/components/ui/button';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, useSidebar } from '@/components/ui/sidebar';
import { type NavItem, type NavGroup } from '@/types';
import { Link } from '@inertiajs/react';
import {
    Folder,
    Inbox,
    LayoutDashboard,
    ListTodo,
    Users,
    Calendar,
    Clock,
    Archive,
    Trash2,
    Settings,
    HelpCircle,
    BarChart3,
    Timer,
    FileText,
    MessageSquare,
    Star,
    PanelLeftClose,
    PanelLeftOpen
} from 'lucide-react';
import AppLogo from './app-logo';

// Main navigation sections based on the PowerPoint specification
const mainNavGroups: NavGroup[] = [
    {
        title: 'Core',
        items: [
            {
                title: 'Dashboard',
                href: route('dashboard'),
                icon: LayoutDashboard,
            },
            {
                title: 'Inbox',
                href: route('inbox'),
                icon: Inbox,
            },
            {
                title: 'Favorites',
                href: route('favorites'),
                icon: Star,
            },
        ]
    },
    {
        title: 'Tasks & Planning',
        items: [
            {
                title: 'My Tasks',
                href: route('my-tasks'),
                icon: ListTodo,
            },
            {
                title: 'Today',
                href: route('my-tasks') + '?filter=today',
                icon: Calendar,
            },
            {
                title: 'Upcoming',
                href: route('my-tasks') + '?filter=upcoming',
                icon: Clock,
            },
            {
                title: 'Calendar',
                href: route('calendar'),
                icon: Calendar,
            },
        ]
    },
    {
        title: 'Work & Projects',
        items: [
            {
                title: 'Projects',
                href: route('projects.index'),
                icon: Folder,
            },
            {
                title: 'Time Tracking',
                href: route('time-tracking'),
                icon: Timer,
            },
            {
                title: 'Reports',
                href: route('reports'),
                icon: BarChart3,
            },
        ]
    },
    {
        title: 'Communication',
        items: [
            {
                title: 'Messages',
                href: route('messages'),
                icon: MessageSquare,
            },
            {
                title: 'Team',
                href: route('team'),
                icon: Users,
            },
            {
                title: 'Documents',
                href: route('documents'),
                icon: FileText,
            },
        ]
    },
    {
        title: 'Archive',
        items: [
            {
                title: 'Archived',
                href: route('my-tasks') + '?filter=archived',
                icon: Archive,
            },
            {
                title: 'Deleted',
                href: route('my-tasks') + '?filter=deleted',
                icon: Trash2,
            },
        ]
    }
];

const settingsNavItems: NavItem[] = [
    {
        title: 'Settings',
        href: route('profile.edit'),
        icon: Settings,
    },
    {
        title: 'Team',
        href: route('team'),
        icon: Users,
    },
    {
        title: 'Guidelines',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: HelpCircle,
    },
    {
        title: 'Projects',
        href: route('projects.index'),
        icon: Folder,
    },
];

export function AppSidebar() {
    const { state, toggleSidebar } = useSidebar();
    const collapsed = state === 'collapsed';

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <div className="p-4">
                    <div className={`flex items-center ${collapsed ? 'justify-center' : ''}`}>
                        <Link href={route('dashboard')} prefetch className={`flex items-center transition-all duration-300 ease-in-out hover:scale-105 ${collapsed ? '' : 'w-full'}`}>
                            <AppLogo collapsed={collapsed} />
                        </Link>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <div className="flex-1 overflow-auto">
                    <NavMain groups={mainNavGroups} collapsed={collapsed} />
                </div>

                {/* Settings Section */}
                <div className={collapsed ? "px-1 py-2" : "px-2 py-2"}>
                    <div className={`${collapsed ? 'sr-only' : 'text-xs font-medium text-sidebar-foreground/60 mb-2 px-2'}`}>
                        Settings
                    </div>
                    <nav>
                        <ul className={collapsed ? "space-y-2" : "space-y-1"}>
                            {settingsNavItems.map((item) => (
                                <li key={item.title}>
                                    <Link
                                        href={item.href}
                                        prefetch
                                        className={`group flex items-center rounded-lg text-sm font-medium transition-all duration-300 ease-in-out text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground hover:shadow-md hover:scale-105 hover:-translate-y-0.5 ${collapsed ? 'justify-center px-2 py-2 w-12 h-12 mx-auto' : 'px-3 py-2.5'}`}
                                    >
                                        {item.icon && (
                                            <item.icon className="flex-shrink-0 h-5 w-5 transition-transform duration-300 ease-in-out group-hover:scale-110" />
                                        )}
                                        {!collapsed && (
                                            <span className="ml-3 truncate transition-all duration-300 ease-in-out group-hover:translate-x-1">{item.title}</span>
                                        )}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            </SidebarContent>

            <SidebarFooter>
                {/* User Section with integrated collapse button */}
                <div className="px-2 py-2 border-t border-sidebar-border/50">
                    <div className="flex items-center justify-between mb-2">
                        {!collapsed && (
                            <span className="text-xs font-medium text-sidebar-foreground/60 px-2">Account</span>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`h-6 w-6 text-sidebar-foreground/30 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 hover:shadow-md hover:scale-110 transition-all duration-300 ease-in-out rounded ${collapsed ? 'mx-auto' : 'ml-auto'}`}
                            onClick={toggleSidebar}
                        >
                            {collapsed ? (
                                <PanelLeftOpen className="h-4 w-4" />
                            ) : (
                                <PanelLeftClose className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    <NavUser />
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
