import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Project } from '@/types/project-manager';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

interface ProjectEditProps {
    project: Project;
}

export default function ProjectEdit({ project }: ProjectEditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Projects',
            href: route('projects.index'),
        },
        {
            title: project.name,
            href: route('projects.show', project.id),
        },
        {
            title: 'Edit',
            href: route('projects.edit', project.id),
        },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: project.name,
        description: project.description || '',
        is_public: project.is_public,
        background_color: project.background_color || '#3498db',
        icon: project.icon || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('projects.update', project.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${project.name}`} />
            <div className="max-w-3xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Project</CardTitle>
                        <CardDescription>Update your project details</CardDescription>
                    </CardHeader>
                    <form onSubmit={submit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Project Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="background_color">Background Color</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="background_color"
                                        type="color"
                                        className="w-12 h-10 p-1"
                                        value={data.background_color}
                                        onChange={(e) => setData('background_color', e.target.value)}
                                    />
                                    <Input
                                        type="text"
                                        value={data.background_color}
                                        onChange={(e) => setData('background_color', e.target.value)}
                                    />
                                </div>
                                <InputError message={errors.background_color} />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_public"
                                    checked={data.is_public}
                                    onCheckedChange={(checked) => setData('is_public', !!checked)}
                                />
                                <Label htmlFor="is_public">Make this project public</Label>
                                <InputError message={errors.is_public} />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Update Project
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
