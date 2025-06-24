import { useCallback, useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';
export type ProjectDetailsDisplay = 'button' | 'hyperlink';

const prefersDark = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const applyTheme = (appearance: Appearance) => {
    const isDark = appearance === 'dark' || (appearance === 'system' && prefersDark());

    document.documentElement.classList.toggle('dark', isDark);
};

const mediaQuery = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.matchMedia('(prefers-color-scheme: dark)');
};

const handleSystemThemeChange = () => {
    const currentAppearance = localStorage.getItem('theme') as Appearance;
    applyTheme(currentAppearance || 'system');
};

export function initializeTheme() {
    const savedAppearance = (localStorage.getItem('theme') as Appearance) || 'system';

    applyTheme(savedAppearance);

    // Add the event listener for system theme changes...
    mediaQuery()?.addEventListener('change', handleSystemThemeChange);
}

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>('system');
    const [projectDetailsDisplay, setProjectDetailsDisplay] = useState<ProjectDetailsDisplay>(() => {
        return (localStorage.getItem('projectDetailsDisplay') as ProjectDetailsDisplay) || 'button';
    });

    const updateAppearance = useCallback((mode: Appearance) => {
        setAppearance(mode);
        localStorage.setItem('theme', mode);
        setCookie('theme', mode);
        applyTheme(mode);
    }, []);

    const updateProjectDetailsDisplay = useCallback((mode: ProjectDetailsDisplay) => {
        setProjectDetailsDisplay(mode);
        localStorage.setItem('projectDetailsDisplay', mode);
        setCookie('projectDetailsDisplay', mode);
    }, []);

    useEffect(() => {
        const savedAppearance = localStorage.getItem('theme') as Appearance | null;
        updateAppearance(savedAppearance || 'system');
        const savedProjectDetailsDisplay = localStorage.getItem('projectDetailsDisplay') as ProjectDetailsDisplay | null;
        if (savedProjectDetailsDisplay) setProjectDetailsDisplay(savedProjectDetailsDisplay);
        return () => mediaQuery()?.removeEventListener('change', handleSystemThemeChange);
    }, [updateAppearance]);

    return { appearance, updateAppearance, projectDetailsDisplay, updateProjectDetailsDisplay } as const;
}
