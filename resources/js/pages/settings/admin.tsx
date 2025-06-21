import { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { route } from 'ziggy-js';
import { Users, Building } from 'lucide-react';

interface ShortNameFormat {
    label: string;
    description: string;
    examples: Record<string, string>;
}

interface AdminSettingsProps {
    settings: {
        short_name_format: {
            value: string;
            type: string;
            description: string;
            is_public: boolean;
        };
    };
    shortNameFormats: Record<string, ShortNameFormat>;
}

function AdminSettingsContent({ settings, shortNameFormats }: AdminSettingsProps) {
    const { data, setData, patch, processing, errors } = useForm({
        short_name_format: settings.short_name_format?.value || 'first_last_initial',
    });

    const [previewFormat, setPreviewFormat] = useState(data.short_name_format);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('admin-settings.update'), {
            preserveScroll: true,
        });
    };

    const handleFormatChange = (value: string) => {
        setData('short_name_format', value);
        setPreviewFormat(value);
    };

    const renderExamples = (format: string) => {
        const formatData = shortNameFormats[format];
        if (!formatData) return null;

        return (
            <div className="mt-3 space-y-2">
                <p className="text-sm text-muted-foreground">{formatData.description}</p>
                <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="font-medium text-muted-foreground">Examples:</div>
                    {Object.entries(formatData.examples).map(([fullName, shortName]) => (
                        <div key={fullName} className="flex justify-between items-center py-1 px-2 bg-muted/50 rounded">
                            <span className="text-muted-foreground">{fullName}</span>
                            <span className="font-medium">→ {shortName}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* User & Department Management Links */}
            <Card>
                <CardHeader>
                    <CardTitle>User & Department Management</CardTitle>
                    <CardDescription>
                        Manage user accounts and company departments.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <Link href={route('admin.users.index')} className="block">
                        <Button variant="outline" className="w-full h-20 flex items-center justify-start p-4 text-left">
                            <Users className="h-6 w-6 mr-4 text-primary" />
                            <div>
                                <p className="font-semibold">Manage Users</p>
                                <p className="text-sm text-muted-foreground">Add, edit, or remove users.</p>
                            </div>
                        </Button>
                    </Link>
                    <Link href={route('admin.departments.index')} className="block">
                        <Button variant="outline" className="w-full h-20 flex items-center justify-start p-4 text-left">
                            <Building className="h-6 w-6 mr-4 text-primary" />
                            <div>
                                <p className="font-semibold">Manage Departments</p>
                                <p className="text-sm text-muted-foreground">Define company departments.</p>
                            </div>
                        </Button>
                    </Link>
                </CardContent>
            </Card>

            {/* Short Name Format Settings */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>User Short Name Display Format</CardTitle>
                        <CardDescription>
                            Choose how user names are displayed in shortened format throughout the application.
                            This affects task assignments, project ownership, and other user references.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <RadioGroup
                            value={data.short_name_format}
                            onValueChange={handleFormatChange}
                            className="space-y-4"
                        >
                            {Object.entries(shortNameFormats).map(([key, format]) => (
                                <div key={key} className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value={key} id={key} />
                                        <Label htmlFor={key} className="font-medium">
                                            {format.label}
                                        </Label>
                                    </div>
                                    {renderExamples(key)}
                                </div>
                            ))}
                        </RadioGroup>

                        {errors.short_name_format && (
                            <p className="text-sm text-red-600">{errors.short_name_format}</p>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Saving...' : 'Save Settings'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default function AdminSettings({ settings, shortNameFormats }: AdminSettingsProps) {
    return (
        <AppLayout>
            <Head title="Admin Settings" />
            <SettingsLayout>
                <AdminSettingsContent settings={settings} shortNameFormats={shortNameFormats} />
            </SettingsLayout>
        </AppLayout>
    );
}
