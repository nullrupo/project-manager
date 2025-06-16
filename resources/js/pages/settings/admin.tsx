import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import SettingsLayout from '@/layouts/settings/layout';
import { route } from 'ziggy-js';

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

export default function AdminSettings({ settings, shortNameFormats }: AdminSettingsProps) {
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
        <SettingsLayout>
            <Head title="Admin Settings" />
            
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium">Admin Settings</h3>
                    <p className="text-sm text-muted-foreground">
                        Configure global system settings that affect all users.
                    </p>
                </div>

                <Separator />

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
                                value={previewFormat}
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

                <Card>
                    <CardHeader>
                        <CardTitle>Preview</CardTitle>
                        <CardDescription>
                            See how the selected format will display for different types of names.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderExamples(previewFormat)}
                    </CardContent>
                </Card>
            </div>
        </SettingsLayout>
    );
}
