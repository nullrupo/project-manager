import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { ToastContainer } from '@/components/ui/toast';
import { GlobalTaskInspector } from '@/components/global/GlobalTaskInspector';
import { TaskDisplayPreferencesProvider } from '@/contexts/TaskDisplayPreferencesContext';
import { type ReactNode } from 'react';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { AuthProvider } from '@/app';

interface AppLayoutProps {
    children: ReactNode;
}

export default ({ children, ...props }: AppLayoutProps) => {
    const { flash } = usePage<SharedData>().props;

    return (
        <AuthProvider>
            <TaskDisplayPreferencesProvider>
                <AppLayoutTemplate {...props}>
                    {children}
                    <ToastContainer flash={flash} />
                    <GlobalTaskInspector />
                </AppLayoutTemplate>
            </TaskDisplayPreferencesProvider>
        </AuthProvider>
    );
};
