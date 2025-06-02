import { AppContent } from '@/components/app-content';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { SidebarProvider, SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';

function AppSidebarContent({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    const { state } = useSidebar();
    const collapsed = state === 'collapsed';

    return (
        <SidebarInset>
            <div className={`pl-8 pr-6 py-6 w-full max-w-none transition-all duration-200 ${collapsed ? 'pl-6' : 'pl-8'}`}>
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className={`w-full mt-6 overflow-visible transition-all duration-200 ${collapsed ? 'max-w-[calc(100vw-8rem)]' : 'max-w-[calc(100vw-20rem)]'}`}>
                    {children}
                </div>
            </div>
        </SidebarInset>
    );
}

export default function AppSidebarLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <SidebarProvider defaultOpen={true}>
            <AppSidebar />
            <AppSidebarContent breadcrumbs={breadcrumbs}>
                {children}
            </AppSidebarContent>
        </SidebarProvider>
    );
}
