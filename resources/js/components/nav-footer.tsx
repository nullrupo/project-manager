import { Icon } from '@/components/icon';
import { type NavItem } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { type ComponentPropsWithoutRef } from 'react';

export function NavFooter({
    items,
    className,
    ...props
}: ComponentPropsWithoutRef<"div"> & {
    items: NavItem[];
}) {
    // Check if the sidebar is collapsed by looking at the cookie
    const isSidebarCollapsed = () => {
        if (typeof document === 'undefined') return false;

        const cookies = document.cookie.split(';');
        const sidebarCookie = cookies.find(cookie => cookie.trim().startsWith('sidebar_state='));

        if (sidebarCookie) {
            const cookieValue = sidebarCookie.split('=')[1].trim();
            return cookieValue === 'false'; // true means expanded, false means collapsed
        }

        return false;
    };

    const collapsed = isSidebarCollapsed();

    return (
        <div className={`px-2 py-2 ${className || ''}`} {...props}>
            <div className={`${collapsed ? 'sr-only' : 'text-xs font-medium text-sidebar-foreground/60 mb-2 px-2'}`}>
                Links
            </div>
            <nav>
                <ul className="space-y-1">
                    {items.map((item) => {
                        const NavLink = (
                            <a
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center ${collapsed ? 'justify-center' : ''} rounded-md px-2 py-1.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground`}
                            >
                                {item.icon && <Icon iconNode={item.icon} className={`h-5 w-5 ${!collapsed && 'mr-2'}`} />}
                                {!collapsed && <span>{item.title}</span>}
                            </a>
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
                    })}
                </ul>
            </nav>
        </div>
    );
}
