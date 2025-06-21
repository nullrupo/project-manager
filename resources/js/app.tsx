import '../css/app.css';

import { createInertiaApp, usePage } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import React, { createContext, useContext } from 'react';

import { ThemeProvider } from './providers/theme-provider';
import { GlobalTaskInspectorProvider } from './contexts/GlobalTaskInspectorContext';
import { UndoNotificationProvider } from './contexts/UndoNotificationContext';
import { setupGlobalModalCleanup } from './utils/modalCleanup';
import { SharedData, User } from './types';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// --- Auth Context and Hook ---
interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// --- Auth Provider Component ---
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const { auth } = usePage<SharedData>().props;
    const value = {
        user: auth?.user ?? null,
        isAuthenticated: !!auth?.user,
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- Inertia App Setup ---
createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <ThemeProvider defaultTheme="light">
                <UndoNotificationProvider>
                    <GlobalTaskInspectorProvider>
                        <App {...props} />
                    </GlobalTaskInspectorProvider>
                </UndoNotificationProvider>
            </ThemeProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// --- Post-render setup ---
setupGlobalModalCleanup();

// Theme is now managed by ThemeProvider
