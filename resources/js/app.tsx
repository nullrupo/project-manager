import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './providers/theme-provider';
import { GlobalTaskInspectorProvider } from './contexts/GlobalTaskInspectorContext';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ThemeProvider defaultTheme="light">
                <GlobalTaskInspectorProvider>
                    <App {...props} />
                </GlobalTaskInspectorProvider>
            </ThemeProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// Theme is now managed by ThemeProvider
