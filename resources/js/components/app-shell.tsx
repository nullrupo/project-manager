import { SidebarProvider } from '@/components/ui/sidebar';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface AppShellProps {
    children: React.ReactNode;
    variant?: 'header' | 'sidebar';
}

export function AppShell({ children, variant = 'header' }: AppShellProps) {
    const { sidebarOpen } = usePage<SharedData>().props;
    const [isOpen, setIsOpen] = useState(sidebarOpen);

    // This ensures the sidebar state is consistent across page navigations
    useEffect(() => {
        // Check if there's a cookie that overrides the server state
        const cookies = document.cookie.split(';');
        const sidebarCookie = cookies.find(cookie => cookie.trim().startsWith('sidebar_state='));

        if (sidebarCookie) {
            const cookieValue = sidebarCookie.split('=')[1].trim();
            // Only update if different from current state
            if (cookieValue === 'true' && !isOpen) {
                setIsOpen(true);
            } else if (cookieValue === 'false' && isOpen) {
                setIsOpen(false);
            }
        }
    }, [sidebarOpen, isOpen]);

    if (variant === 'header') {
        return <div className="flex min-h-screen w-full flex-col">{children}</div>;
    }

    return <SidebarProvider defaultOpen={isOpen} open={isOpen}>{children}</SidebarProvider>;
}
