import React from 'react';

interface AppLogoProps {
    collapsed?: boolean;
}

export default function AppLogo({ collapsed = false }: AppLogoProps) {
    return (
        <>
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md">
                <svg viewBox="0 0 200 200" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="100" cy="100" r="100" fill="#FF2D20" />
                    <path d="M100 40 L120 160 L100 130 L80 160 Z" fill="#fff" />
                </svg>
            </div>
            {!collapsed && (
                <div className="ml-1 grid flex-1 text-left text-sm">
                    <span className="mb-0.5 truncate leading-none font-semibold">Project Manager</span>
                </div>
            )}
        </>
    );
}
