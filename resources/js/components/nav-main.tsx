import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();

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

    return (
        <div className="px-2 py-2">
            <div className={`${collapsed ? 'sr-only' : 'text-xs font-medium text-sidebar-foreground/60 mb-2 px-2'}`}>
                Platform
            </div>
            <nav>
                <ul className="space-y-1">
                    {items.map((item) => {
                        const active = isActive(item.href);
                        const NavLink = (
                            <Link
                                href={item.href}
                                prefetch
                                className={`flex items-center ${collapsed ? 'justify-center' : ''} rounded-md px-2 py-1.5 text-sm font-medium ${
                                    active
                                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                                }`}
                            >
                                {item.icon && <item.icon className={`h-5 w-5 ${!collapsed && 'mr-2'}`} />}
                                {!collapsed && <span>{item.title}</span>}
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
                    })}
                </ul>
            </nav>
        </div>
    );
}
