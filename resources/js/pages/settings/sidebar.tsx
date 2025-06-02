import { Head } from '@inertiajs/react';
import { useState } from 'react';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { type BreadcrumbItem } from '@/types';
import { useSidebarPreferences } from '@/hooks/use-sidebar-preferences';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sidebar settings',
        href: '/settings/sidebar',
    },
];

export default function SidebarSettings() {
    const {
        collapsedGroups,
        customGroups,
        groupOrder,
        hiddenItems,
        resetPreferences,
        isLoading
    } = useSidebarPreferences();
    const [isResetting, setIsResetting] = useState(false);

    const handleReset = async () => {
        setIsResetting(true);
        try {
            await resetPreferences();
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sidebar settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Sidebar customization"
                        description="Customize your sidebar navigation experience"
                    />

                    <Card>
                        <CardHeader>
                            <CardTitle>Navigation Groups</CardTitle>
                            <CardDescription>
                                Manage your sidebar navigation groups and their visibility.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium mb-2">Currently collapsed groups:</h4>
                                {collapsedGroups.length > 0 ? (
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        {collapsedGroups.map((group) => (
                                            <li key={group} className="flex items-center">
                                                <span className="w-2 h-2 bg-muted-foreground rounded-full mr-2"></span>
                                                {group}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground">All groups are currently expanded</p>
                                )}
                            </div>

                            {customGroups.length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <h4 className="text-sm font-medium mb-2">Custom groups:</h4>
                                        <ul className="text-sm text-muted-foreground space-y-1">
                                            {customGroups.map((group) => (
                                                <li key={group.id} className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                                        {group.title} ({group.items.length} items)
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </>
                            )}

                            {groupOrder.length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <h4 className="text-sm font-medium mb-2">Custom group order:</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Groups have been reordered from their default positions.
                                        </p>
                                    </div>
                                </>
                            )}

                            <Separator />

                            <div>
                                <Button
                                    variant="outline"
                                    onClick={handleReset}
                                    disabled={isLoading || isResetting}
                                >
                                    {isResetting ? 'Resetting...' : 'Reset to Default'}
                                </Button>
                                <p className="text-xs text-muted-foreground mt-2">
                                    This will reset all customizations including custom groups, group order, and collapsed states.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>How to customize</CardTitle>
                            <CardDescription>
                                Learn how to personalize your sidebar navigation
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="text-sm space-y-2">
                                <p><strong>Enable Customization Mode:</strong> Click the gear icon (⚙️) in the Settings section of the sidebar to enter customization mode.</p>
                                <p><strong>Create Custom Groups:</strong> In customization mode, click "Add Group" to create new navigation groups.</p>
                                <p><strong>Reorder Groups:</strong> Drag groups by their grip handles to reorder them.</p>
                                <p><strong>Rename Groups:</strong> Click the menu button (⋯) on custom groups to rename or delete them.</p>
                                <p><strong>Move Items:</strong> Drag navigation items between groups to reorganize your sidebar.</p>
                                <p><strong>Collapse/Expand Groups:</strong> Click the arrow icon next to any group title to collapse or expand it.</p>
                                <p><strong>Persistent Settings:</strong> All customizations are automatically saved and restored when you return.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
