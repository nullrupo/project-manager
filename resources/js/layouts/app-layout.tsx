import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { ToastContainer } from '@/components/ui/toast';
import { GlobalTaskInspector } from '@/components/global/GlobalTaskInspector';
import { type ReactNode } from 'react';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

interface AppLayoutProps {
    children: ReactNode;
}

export default ({ children, ...props }: AppLayoutProps) => {
    const { flash } = usePage<SharedData>().props;

    return (
        <AppLayoutTemplate {...props}>
            {children}
            <ToastContainer flash={flash} />
            <GlobalTaskInspector />
        </AppLayoutTemplate>
    );
};
