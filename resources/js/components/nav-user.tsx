import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInitials } from '@/hooks/use-initials';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { ChevronsUpDown } from 'lucide-react';

export function NavUser() {
    const { auth } = usePage<SharedData>().props;
    const isMobile = useIsMobile();
    const getInitials = useInitials();

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
        <div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className={`w-full flex items-center rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground hover:shadow-md hover:scale-105 transition-all duration-300 ease-in-out ${collapsed ? 'justify-center px-2 py-2 h-12' : 'justify-between px-2 py-1.5'}`}
                    >
                        {collapsed ? (
                            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                                <AvatarImage src={auth.user?.avatar} alt={auth.user?.name} />
                                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                    {getInitials(auth.user?.name || '')}
                                </AvatarFallback>
                            </Avatar>
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
