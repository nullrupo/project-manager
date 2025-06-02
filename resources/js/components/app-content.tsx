import * as React from 'react';
import { useSidebar } from '@/components/ui/sidebar';

interface AppContentProps extends React.ComponentProps<'main'> {
    variant?: 'header' | 'sidebar';
}

export function AppContent({ variant = 'header', children, ...props }: AppContentProps) {
    if (variant === 'sidebar') {
        const { state } = useSidebar();
        const collapsed = state === 'collapsed';

        return (
            <main
                className={`flex-1 p-3 transition-all duration-200 ease-in-out ${collapsed ? 'ml-[4rem]' : 'ml-[16rem]'}`}
                {...props}
            >
                <div className="bg-card/50 backdrop-blur-sm rounded-xl shadow-sm border border-border/50 p-4 min-h-full">
                    {children}
                </div>
            </main>
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
