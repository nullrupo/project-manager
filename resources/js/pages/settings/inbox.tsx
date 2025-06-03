import { Head, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { type BreadcrumbItem, type SharedData } from '@/types';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

interface InboxPreferences {
    auto_cleanup_enabled: boolean;
}

export default function InboxSettings() {
    const { auth } = usePage<SharedData>().props;
    const [preferences, setPreferences] = useState<InboxPreferences>({
        auto_cleanup_enabled: false,
    });
    const [isLoading, setIsLoading] = useState(true);

    const { data, setData, patch, processing } = useForm<InboxPreferences>({
        auto_cleanup_enabled: false,
    });

    // Load user preferences on mount
    useEffect(() => {
        fetch(route('inbox-preferences.show'))
            .then(response => response.json())
            .then(prefs => {
                setPreferences(prefs);
                setData(prefs);
                setIsLoading(false);
            })
            .catch(() => {
                setIsLoading(false);
            });
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('inbox-preferences.update'), {
            preserveScroll: true,
        });
    };

    const handleSwitchChange = (field: keyof InboxPreferences, value: boolean) => {
        setData(field, value);
        // Auto-save on change
        patch(route('inbox-preferences.update'), {
            data: { ...data, [field]: value },
            preserveScroll: true,
        });
    };

    if (isLoading) {
        return (
            <AppLayout>
                <Head title="Inbox settings" />
                <SettingsLayout>
                    <div className="space-y-6">
                        <HeadingSmall
                            title="Inbox settings"
                            description="Configure your inbox behavior and cleanup preferences"
                        />
                        <div>Loading...</div>
                    </div>
                </SettingsLayout>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Inbox settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Inbox settings"
                        description="Configure your inbox behavior and cleanup preferences"
                    />

                    <Card>
                        <CardHeader>
                            <CardTitle>Automatic Cleanup</CardTitle>
                            <CardDescription>
                                Automatically remove completed and moved tasks from your inbox to keep it focused on actionable items.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="auto-cleanup">Enable automatic cleanup</Label>
                                    <div className="text-sm text-muted-foreground">
                                        Automatically remove completed tasks and tasks moved to projects when you visit the inbox
                                    </div>
                                </div>
                                <Switch
                                    id="auto-cleanup"
                                    checked={data.auto_cleanup_enabled}
                                    onCheckedChange={(checked) => handleSwitchChange('auto_cleanup_enabled', checked)}
                                    disabled={processing}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Cleanup Rules</CardTitle>
                            <CardDescription>
                                Tasks that will be automatically removed during cleanup
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Completed tasks (status: Done)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span>Tasks moved to projects</span>
                                </div>
                                <div className="text-muted-foreground text-xs mt-2">
                                    Note: Only tasks you created or are assigned to will be cleaned up
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
