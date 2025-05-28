import { type NavItem, type NavGroup } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NavMainProps {
    groups?: NavGroup[];
    items?: NavItem[];
    collapsed?: boolean;
}

export function NavMain({ groups = [], items = [], collapsed = false }: NavMainProps) {
    const page = usePage();

    // Check if the current URL starts with the item's href
    const isActive = (href: string) => {
        // Convert both to strings for comparison
        const currentUrl = String(page.url);
        const itemHref = String(href);

        // Check if the current URL starts with the item's href
        // This ensures that sub-pages are also highlighted
        return currentUrl === itemHref ||
               (itemHref !== '/' && currentUrl.startsWith(itemHref));
    };

    const renderNavItem = (item: NavItem) => {
        const active = isActive(item.href);
        const NavLink = (
            <Link
                href={item.href}
                prefetch
                className={`group flex items-center rounded-lg text-sm font-medium transition-all duration-300 ease-in-out ${
                    active
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm scale-105'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground hover:shadow-md hover:scale-105 hover:-translate-y-0.5'
                } ${collapsed ? 'justify-center px-2 py-2 w-12 h-12 mx-auto' : 'px-3 py-2.5'}`}
            >
                {item.icon && (
                    <item.icon className="flex-shrink-0 h-5 w-5 transition-transform duration-300 ease-in-out group-hover:scale-110" />
                )}
                {!collapsed && (
                    <span className="ml-3 truncate transition-all duration-300 ease-in-out group-hover:translate-x-1">{item.title}</span>
                )}
            </Link>
        );

        return (
            <li key={item.title}>
                {collapsed ? (
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                {NavLink}
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                {item.title}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : (
                    NavLink
                )}
            </li>
        );
    };

    // If using the old items prop (for backward compatibility)
    if (items.length > 0) {
        return (
            <div className={collapsed ? "px-1 py-2" : "px-2 py-2"}>
                <div className={`${collapsed ? 'sr-only' : 'text-xs font-medium text-sidebar-foreground/60 mb-2 px-2'}`}>
                    Platform
                </div>
                <nav>
                    <ul className={collapsed ? "space-y-2" : "space-y-1"}>
                        {items.map(renderNavItem)}
                    </ul>
                </nav>
                <div className="mx-2 my-2 border-t border-sidebar-border/50"></div>
            </div>
        );
    }

    // New grouped navigation structure
    return (
        <div className={collapsed ? "px-1 py-2" : "px-2 py-2"}>
            {groups.map((group, groupIndex) => (
                <div key={group.title} className={collapsed ? "mb-6" : "mb-4"}>
                    <div className={`${collapsed ? 'sr-only' : 'text-xs font-medium text-sidebar-foreground/60 mb-2 px-2'}`}>
                        {group.title}
                    </div>
                    <nav>
                        <ul className={collapsed ? "space-y-2" : "space-y-1"}>
                            {group.items.map(renderNavItem)}
                        </ul>
                    </nav>
                    {/* Add divider between groups, but not after the last group */}
                    {groupIndex < groups.length - 1 && (
                        <div className={collapsed ? "mx-1 my-4 border-t border-sidebar-border/50" : "mx-2 my-3 border-t border-sidebar-border/50"}></div>
                    )}
                </div>
            ))}
        </div>
    );
}
