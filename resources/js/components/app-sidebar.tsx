import { NavMain } from '@/components/nav-main';
import { CustomizableNavMain } from '@/components/customizable-nav-main';
import { NavUser } from '@/components/nav-user';
import { Button } from '@/components/ui/button';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, useSidebar } from '@/components/ui/sidebar';
import { type NavItem, type NavGroup } from '@/types';
import { Link } from '@inertiajs/react';
import { useState } from 'react';
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
    PanelLeftOpen,
    Settings2
} from 'lucide-react';
import AppLogo from './app-logo';
import { ThemeSwitcher } from './theme-switcher';

// Main navigation sections based on the PowerPoint specification
const mainNavGroups: NavGroup[] = [
    {
        id: 'core',
        title: 'Core',
        customizable: true,
        user_created: false,
        position: 0,
        items: [
            {
                id: 'dashboard',
                title: 'Dashboard',
                href: route('dashboard'),
                icon: LayoutDashboard,
                user_created: false,
            },
            {
                id: 'inbox',
                title: 'Inbox',
                href: route('inbox'),
                icon: Inbox,
                user_created: false,
            },
            {
                id: 'favorites',
                title: 'Favorites',
                href: route('favorites'),
                icon: Star,
                user_created: false,
            },
        ]
    },
    {
        id: 'tasks-planning',
        title: 'Tasks & Planning',
        customizable: true,
        user_created: false,
        position: 1,
        items: [
            {
                id: 'my-tasks',
                title: 'My Tasks',
                href: route('my-tasks'),
                icon: ListTodo,
                user_created: false,
            },
            {
                id: 'calendar',
                title: 'Calendar',
                href: route('calendar'),
                icon: Calendar,
                user_created: false,
            },
        ]
    },
    {
        id: 'work-projects',
        title: 'Work & Projects',
        customizable: true,
        user_created: false,
        position: 2,
        items: [
            {
                id: 'projects',
                title: 'Projects',
                href: route('projects.index'),
                icon: Folder,
                user_created: false,
            },
            {
                id: 'time-tracking',
                title: 'Time Tracking',
                href: route('time-tracking'),
                icon: Timer,
                user_created: false,
            },
            {
                id: 'reports',
                title: 'Reports',
                href: route('reports'),
                icon: BarChart3,
                user_created: false,
            },
        ]
    },
    {
        id: 'communication',
        title: 'Communication',
        customizable: true,
        user_created: false,
        position: 3,
        items: [
            {
                id: 'messages',
                title: 'Messages',
                href: route('messages'),
                icon: MessageSquare,
                user_created: false,
            },
            {
                id: 'team',
                title: 'Team',
                href: route('team'),
                icon: Users,
                user_created: false,
            },
            {
                id: 'documents',
                title: 'Documents',
                href: route('documents'),
                icon: FileText,
                user_created: false,
            },
        ]
    },

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
    const [customizationMode, setCustomizationMode] = useState(false);

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
                <div className="flex-1 overflow-y-auto overflow-x-visible">
                    <CustomizableNavMain
                        groups={mainNavGroups}
                        collapsed={collapsed}
                        customizationMode={customizationMode}
                    />
                </div>

                {/* Settings Section */}
                <div className={`${collapsed ? "px-1 py-2" : "px-2 py-2"} hover-isolate`}>
                    <div className={`${collapsed ? 'sr-only' : 'text-xs font-medium text-sidebar-foreground/60 mb-2 px-2'}`}>
                        Settings
                    </div>
                    <nav className="hover-isolate">
                        <ul className={`${collapsed ? "space-y-2" : "space-y-1"} no-hover-inherit`}>
                            {settingsNavItems.map((item) => (
                                <li key={item.title}>
                                    <Link
                                        href={item.href}
                                        prefetch
                                        className={`nav-item flex items-center rounded-lg text-sm font-medium transition-all duration-200 ease-out relative overflow-hidden text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground hover:shadow-sm hover:scale-[1.02] ${collapsed ? 'justify-center px-2 py-2 w-12 h-12 mx-auto' : 'px-3 py-2.5'}`}
                                    >
                                        {item.icon && (
                                            <item.icon className="flex-shrink-0 h-5 w-5 transition-transform duration-200 ease-out" />
                                        )}
                                        {!collapsed && (
                                            <span className="ml-3 truncate transition-all duration-200 ease-out">{item.title}</span>
                                        )}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            </SidebarContent>

            <SidebarFooter>
                {/* User Section with integrated collapse and customize buttons */}
                <div className="px-2 py-2 border-t border-sidebar-border/50">
                    <div className={`flex items-center mb-2 ${collapsed ? 'justify-center' : 'justify-between'}`}>
                        {!collapsed && (
                            <span className="text-xs font-medium text-sidebar-foreground/60 px-2">Account</span>
                        )}
                        <div className={`flex items-center gap-1 ${collapsed ? 'flex-col' : ''}`}>
                            {/* Theme toggle button */}
                            <ThemeSwitcher minimal />
                            {/* Customization toggle button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-6 w-6 text-sidebar-foreground/30 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 hover:shadow-md hover:scale-110 transition-all duration-300 ease-in-out rounded ${customizationMode ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}`}
                                onClick={() => setCustomizationMode(!customizationMode)}
                                title={customizationMode ? 'Exit customization mode' : 'Enter customization mode'}
                            >
                                <Settings2 className="h-4 w-4" />
                            </Button>
                            {/* Collapse/expand button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-sidebar-foreground/30 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 hover:shadow-md hover:scale-110 transition-all duration-300 ease-in-out rounded"
                                onClick={toggleSidebar}
                            >
                                {collapsed ? (
                                    <PanelLeftOpen className="h-4 w-4" />
                                ) : (
                                    <PanelLeftClose className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                    <NavUser />
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
