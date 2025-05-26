import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { useEffect, useState } from 'react';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        const checkSidebarState = () => {
            const cookies = document.cookie.split(';');
            const sidebarCookie = cookies.find(cookie => cookie.trim().startsWith('sidebar_state='));

            if (sidebarCookie) {
                const cookieValue = sidebarCookie.split('=')[1].trim();
                setCollapsed(cookieValue === 'false'); // true means expanded, false means collapsed
            }
        };

        // Check on initial render
        checkSidebarState();

        // Set up an interval to check periodically
        const intervalId = setInterval(checkSidebarState, 500);

        return () => clearInterval(intervalId);
    }, []);

    const toggleSidebar = () => {
        const newState = !collapsed;
        setCollapsed(newState);

        // Save to cookie
        document.cookie = `sidebar_state=${!newState}; path=/; max-age=${60 * 60 * 24 * 7}`;
    };

    return (
        <header className="border-sidebar-border/50 flex h-16 shrink-0 items-center gap-2 border-b px-6 transition-[width,height] ease-linear md:px-4">
            <div className="flex items-center gap-2">
                <TooltipProvider delayDuration={300}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-2 h-8 -ml-1"
                                onClick={toggleSidebar}
                            >
                                {collapsed ? (
                                    <PanelLeftOpen className="h-4 w-4" />
                                ) : (
                                    <PanelLeftClose className="h-4 w-4" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            <p>{collapsed ? "Expand sidebar" : "Collapse sidebar"}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
        </header>
    );
}
