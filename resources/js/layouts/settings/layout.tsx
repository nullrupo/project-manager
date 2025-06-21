import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: '/settings/profile',
        icon: null,
    },
    {
        title: 'Password',
        href: '/settings/password',
        icon: null,
    },
    {
        title: 'Appearance',
        href: '/settings/appearance',
        icon: null,
    },
    {
        title: 'Sidebar',
        href: '/settings/sidebar',
        icon: null,
    },
    {
        title: 'Inbox',
        href: '/settings/inbox',
        icon: null,
    },
    {
        title: 'Task Display',
        href: '/settings/task-display',
        icon: null,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }

    const { auth } = usePage<SharedData>().props;
    const currentPath = window.location.pathname;

    // Add admin settings to navigation if user is admin
    const navigationItems = [...sidebarNavItems];
    if (auth.user?.is_admin) {
        navigationItems.push({
            title: 'Admin',
            href: '/settings/admin',
            icon: null,
        });
    }

    return (
        <div className="px-4 py-6">
            <Heading title="Settings" description="Manage your profile and account settings" />

            <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
                <aside className="w-full max-w-xl lg:w-48 hover-isolate">
                    <nav className="flex flex-col space-y-1 space-x-0 no-hover-inherit">
                        {navigationItems.map((item, index) => (
                            <Button
                                key={`${item.href}-${index}`}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn('w-full justify-start hover-isolate', {
                                    'bg-muted': currentPath === item.href,
                                })}
                            >
                                <Link href={item.href} prefetch>
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 md:hidden" />

                <div className="flex-1 md:max-w-4xl">
                    <section className="space-y-12">{children}</section>
                </div>
            </div>
        </div>
    );
}
