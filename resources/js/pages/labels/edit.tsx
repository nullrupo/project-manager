import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label as UILabel } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Label, Project } from '@/types/project-manager';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface LabelEditProps {
    project: Project;
    label: Label;
}

export default function LabelEdit({ project, label }: LabelEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: label.name,
        color: label.color,
        description: label.description || '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Projects',
            href: route('projects.index'),
        },
        {
            title: project.name,
            href: route('projects.show', { project: project.id }),
        },
        {
            title: 'Labels',
            href: route('labels.index', { project: project.id }),
        },
        {
            title: 'Edit Label',
            href: route('labels.edit', { project: project.id, label: label.id }),
        },
    ];

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('labels.update', { project: project.id, label: label.id }));
    };

    // Predefined colors for labels
    const predefinedColors = [
        '#3498db', // Blue
        '#2ecc71', // Green
        '#e74c3c', // Red
        '#f39c12', // Orange
        '#9b59b6', // Purple
        '#1abc9c', // Turquoise
        '#34495e', // Dark Blue
        '#e67e22', // Dark Orange
        '#95a5a6', // Gray
        '#16a085', // Dark Turquoise
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Label - ${project.name}`} />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Edit Label</h1>
                    <p className="text-muted-foreground mt-1">Update label details</p>
                </div>

                <Card>
                    <form onSubmit={submit}>
                        <CardHeader>
                            <CardTitle>Label Details</CardTitle>
                            <CardDescription>
                                Labels help you categorize and filter tasks across your project.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <UILabel htmlFor="name">Label Name</UILabel>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <UILabel htmlFor="color">Color</UILabel>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="color"
                                        type="color"
                                        value={data.color}
                                        onChange={(e) => setData('color', e.target.value)}
                                        className="w-16 h-10 p-1"
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        {predefinedColors.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                className="w-8 h-8 rounded-full border border-border/50"
                                                style={{ backgroundColor: color }}
                                                onClick={() => setData('color', color)}
                                            />
                                        ))}
                                    </div>
                                </div>
                                {errors.color && <p className="text-destructive text-sm">{errors.color}</p>}
                            </div>

                            <div className="space-y-2">
                                <UILabel htmlFor="description">Description (Optional)</UILabel>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                />
                                {errors.description && <p className="text-destructive text-sm">{errors.description}</p>}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => window.history.back()}
                                disabled={processing}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Update Label
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
