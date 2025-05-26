import * as React from 'react';
import { useEffect, useState } from 'react';

interface AppContentProps extends React.ComponentProps<'main'> {
    variant?: 'header' | 'sidebar';
}

export function AppContent({ variant = 'header', children, ...props }: AppContentProps) {
    // Check if the sidebar is collapsed by looking at the cookie
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

    if (variant === 'sidebar') {
        return (
            <main
                className={`flex-1 p-4 transition-all duration-200 ${collapsed ? 'ml-[3rem]' : 'ml-[16rem]'}`}
                {...props}
            >
                <div className="bg-card/50 backdrop-blur-sm rounded-xl shadow-sm border border-border/50 p-6 h-full">
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
