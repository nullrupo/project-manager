import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Project, User } from '@/types/project-manager';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

interface ProjectEditProps {
    project: Project;
    members: User[];
}

export default function ProjectEdit({ project, members }: ProjectEditProps) {
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
        completion_behavior: project.completion_behavior || 'simple',
        requires_review: project.requires_review || false,
        default_reviewer_id: project.default_reviewer_id?.toString() || 'none',
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

                            <div className="space-y-4 border-t pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="completion_behavior" className="text-sm font-medium">Task Completion Behavior</Label>
                                    <select
                                        id="completion_behavior"
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        value={data.completion_behavior}
                                        onChange={(e) => setData('completion_behavior', e.target.value as 'simple' | 'review' | 'custom')}
                                    >
                                        <option value="simple">Simple (To Do ↔ Done)</option>
                                        <option value="review">Review Workflow (To Do → Review → Done)</option>
                                        <option value="custom">Custom (Advanced)</option>
                                    </select>
                                    <p className="text-xs text-muted-foreground">
                                        {data.completion_behavior === 'simple' && 'Tasks can be marked as done directly. Best for personal projects.'}
                                        {data.completion_behavior === 'review' && 'Tasks go through a review process before being marked as done. Best for team projects.'}
                                        {data.completion_behavior === 'custom' && 'Advanced completion workflow with custom statuses.'}
                                    </p>
                                    <InputError message={errors.completion_behavior} />
                                </div>

                                {data.completion_behavior === 'review' && (
                                    <>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="requires_review"
                                                checked={data.requires_review}
                                                onCheckedChange={(checked) => setData('requires_review', !!checked)}
                                            />
                                            <Label htmlFor="requires_review" className="text-sm">
                                                Require review approval for task completion
                                            </Label>
                                            <InputError message={errors.requires_review} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="default_reviewer_id" className="text-sm font-medium">Default Reviewer</Label>
                                            <Select
                                                value={data.default_reviewer_id}
                                                onValueChange={(value) => setData('default_reviewer_id', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a default reviewer" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">No default reviewer</SelectItem>
                                                    {members.map((member) => (
                                                        <SelectItem key={member.id} value={member.id.toString()}>
                                                            {member.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">
                                                Tasks will be assigned to this reviewer by default when submitted for review.
                                                Individual tasks can override this setting.
                                            </p>
                                            <InputError message={errors.default_reviewer_id} />
                                        </div>
                                    </>
                                )}
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
