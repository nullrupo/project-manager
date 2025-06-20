import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './providers/theme-provider';
import { GlobalTaskInspectorProvider } from './contexts/GlobalTaskInspectorContext';
import { UndoNotificationProvider } from './contexts/UndoNotificationContext';
import { setupGlobalModalCleanup } from './utils/modalCleanup';
import React, { createContext, useContext } from 'react';
import { usePage } from '@inertiajs/react';
import { SharedData } from './types';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Global Auth Context
interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
}
const AuthContext = createContext<AuthContextType>({ user: null, isAuthenticated: false });
export function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { auth } = usePage<SharedData>().props;
  const isAuthenticated = !!auth?.user;
  return (
    <AuthContext.Provider value={{ user: auth?.user, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ThemeProvider defaultTheme="light">
                <AuthProvider>
                    <UndoNotificationProvider>
                        <GlobalTaskInspectorProvider>
                            <App {...props} />
                        </GlobalTaskInspectorProvider>
                    </UndoNotificationProvider>
                </AuthProvider>
            </ThemeProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// Setup global modal cleanup listeners
setupGlobalModalCleanup();

// Theme is now managed by ThemeProvider
