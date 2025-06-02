import { type ReactNode } from 'react';

interface AppShellProps {
    children: ReactNode;
    variant?: 'header' | 'sidebar';
}

export function AppShell({ children, variant = 'header' }: AppShellProps) {
    if (variant === 'header') {
        return <div className="flex min-h-screen w-full flex-col">{children}</div>;
    }

    return <div className="flex min-h-screen w-full">{children}</div>;
}
