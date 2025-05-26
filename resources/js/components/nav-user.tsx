import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { useIsMobile } from '@/hooks/use-mobile';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { ChevronsUpDown } from 'lucide-react';

export function NavUser() {
    const { auth } = usePage<SharedData>().props;
    const isMobile = useIsMobile();

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
        <div className="px-2 py-2 border-t border-sidebar-border/50 mt-auto">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className={`w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground ${collapsed ? 'justify-center' : ''}`}
                    >
                        {collapsed ? (
                            <div className="flex items-center justify-center">
                                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                                    {auth.user?.name?.charAt(0) || 'U'}
                                </div>
                            </div>
                        ) : (
                            <>
                                <UserInfo user={auth.user} />
                                <ChevronsUpDown className="ml-auto size-4" />
                            </>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    className="min-w-56 rounded-lg"
                    align="end"
                    side={isMobile ? 'bottom' : collapsed ? 'right' : 'bottom'}
                >
                    <UserMenuContent user={auth.user} />
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
