import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './providers/theme-provider';
import { GlobalTaskInspectorProvider } from './contexts/GlobalTaskInspectorContext';
import { UndoNotificationProvider } from './contexts/UndoNotificationContext';
import { setupGlobalModalCleanup } from './utils/modalCleanup';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

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

// Setup global modal cleanup listeners
setupGlobalModalCleanup();

// Theme is now managed by ThemeProvider
