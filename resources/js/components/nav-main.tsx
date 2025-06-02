import { type NavItem, type NavGroup } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useSidebarPreferences } from '@/hooks/use-sidebar-preferences';
import { Button } from '@/components/ui/button';

interface NavMainProps {
    groups?: NavGroup[];
    items?: NavItem[];
    collapsed?: boolean;
}

export function NavMain({ groups = [], items = [], collapsed = false }: NavMainProps) {
    const page = usePage();
    const { isGroupCollapsed, toggleGroupCollapse } = useSidebarPreferences();

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
                className={`nav-item flex items-center rounded-lg text-sm font-medium transition-all duration-200 ease-out relative overflow-hidden ${
                    active
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground hover:shadow-sm hover:scale-[1.02]'
                } ${collapsed ? 'justify-center px-2 py-2 w-12 h-12 mx-auto' : 'px-3 py-2.5'}`}
            >
                {item.icon && (
                    <item.icon className="flex-shrink-0 h-5 w-5 transition-transform duration-200 ease-out" />
                )}
                {!collapsed && (
                    <span className="ml-3 truncate transition-all duration-200 ease-out">{item.title}</span>
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
            <div className={`${collapsed ? "px-1 py-2" : "px-2 py-2"} hover-isolate`}>
                <div className={`${collapsed ? 'sr-only' : 'text-xs font-medium text-sidebar-foreground/60 mb-2 px-2'}`}>
                    Platform
                </div>
                <nav className="hover-isolate">
                    <ul className={`${collapsed ? "space-y-2" : "space-y-1"} no-hover-inherit`}>
                        {items.map(renderNavItem)}
                    </ul>
                </nav>
                <div className="mx-2 my-2 border-t border-sidebar-border/50"></div>
            </div>
        );
    }

    // New grouped navigation structure
    return (
        <div className={`${collapsed ? "px-1 py-2" : "px-2 py-2"} hover-isolate`}>
            {groups.map((group, groupIndex) => {
                const isCollapsed = isGroupCollapsed(group.title);
                const customizable = group.customizable !== false; // Default to true unless explicitly false

                return (
                    <div key={group.title} className={`${collapsed ? "mb-6" : "mb-4"} hover-isolate`}>
                        <div className={`${collapsed ? 'sr-only' : 'flex items-center justify-between mb-2 px-2'}`}>
                            <span className="text-xs font-medium text-sidebar-foreground/60">
                                {group.title}
                            </span>
                            {!collapsed && customizable && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 hover:bg-sidebar-accent/50"
                                    onClick={() => toggleGroupCollapse(group.title)}
                                >
                                    {isCollapsed ? (
                                        <ChevronRight className="h-3 w-3" />
                                    ) : (
                                        <ChevronDown className="h-3 w-3" />
                                    )}
                                </Button>
                            )}
                        </div>
                        <div className={`transition-all duration-200 ease-in-out ${
                            isCollapsed && !collapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[500px] opacity-100 overflow-visible'
                        }`}>
                            <nav className="hover-isolate">
                                <ul className={`${collapsed ? "space-y-2" : "space-y-1"} no-hover-inherit`}>
                                    {group.items.map(renderNavItem)}
                                </ul>
                            </nav>
                        </div>
                        {/* Add divider between groups, but not after the last group */}
                        {groupIndex < groups.length - 1 && (
                            <div className={collapsed ? "mx-1 my-4 border-t border-sidebar-border/50" : "mx-2 my-3 border-t border-sidebar-border/50"}></div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
