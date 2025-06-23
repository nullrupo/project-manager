import { AppContent } from '@/components/app-content';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { type PropsWithChildren } from 'react';

function AppSidebarContent({ children }: PropsWithChildren) {
    const { state } = useSidebar();
    const collapsed = state === 'collapsed';

    return (
        <SidebarInset>
            <div className={`pl-8 pr-6 py-3 w-full max-w-none transition-all duration-200 ${collapsed ? 'pl-6' : 'pl-8'}`}>
                {/* Removed breadcrumbs header for cleaner layout */}
                <div className="w-full overflow-visible transition-all duration-200">
                    {children}
                </div>
            </div>
        </SidebarInset>
    );
}

export default function AppSidebarLayout({ children }: PropsWithChildren) {
    return (
        <SidebarProvider defaultOpen={true}>
            <AppSidebar />
            <AppSidebarContent>
                {children}
            </AppSidebarContent>
        </SidebarProvider>
    );
}
