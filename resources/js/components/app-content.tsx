import { SidebarInset } from '@/components/ui/sidebar';
import * as React from 'react';

interface AppContentProps extends React.ComponentProps<'main'> {
    variant?: 'header' | 'sidebar';
}

export function AppContent({ variant = 'header', children, ...props }: AppContentProps) {
    if (variant === 'sidebar') {
        return (
            <SidebarInset className="p-4" {...props}>
                <div className="bg-card/50 backdrop-blur-sm rounded-xl shadow-sm border border-border/50 p-6 h-full">
                    {children}
                </div>
            </SidebarInset>
        );
    }

    return (
        <main className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-6 p-4 rounded-xl bg-opacity-50" {...props}>
            <div className="bg-card/50 backdrop-blur-sm rounded-xl shadow-sm border border-border/50 p-6">
                {children}
            </div>
        </main>
    );
}
