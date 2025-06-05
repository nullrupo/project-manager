import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, Globe, Shield, Palette, Info } from 'lucide-react';
import { FormEventHandler, useEffect } from 'react';

interface ProjectCreateForm {
    name: string;
    description: string;
    is_public: boolean;
    background_color: string;
    icon: string;
    visibility: 'private' | 'public';
    completion_behavior: 'simple' | 'review' | 'custom';
    requires_review: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Projects',
        href: route('projects.index'),
    },
    {
        title: 'Create',
        href: route('projects.create'),
    },
];

export default function ProjectCreate() {
    const { data, setData, post, processing, errors } = useForm<ProjectCreateForm>({
        name: '',
        description: '',
        is_public: false,
        background_color: '#3498db',
        icon: '',
        visibility: 'private',
        completion_behavior: 'simple',
        requires_review: false,
    });

    // Sync visibility with is_public
    useEffect(() => {
        setData('is_public', data.visibility === 'public');
    }, [data.visibility]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('projects.store'));
    };

    const predefinedColors = [
        '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
        '#9b59b6', '#1abc9c', '#34495e', '#e67e22',
        '#95a5a6', '#f1c40f', '#8e44ad', '#16a085'
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Project" />
            <div className="max-w-3xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Create Project</CardTitle>
                        <CardDescription>Create a new project to organize your work</CardDescription>
                    </CardHeader>
                    <form onSubmit={submit}>
                        <CardContent className="space-y-6">
                            {/* Project Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium">Project Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Enter project name"
                                    required
                                    className="text-base"
                                />
                                <InputError message={errors.name} />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Describe what this project is about..."
                                    className="min-h-[100px] resize-none"
                                />
                                <InputError message={errors.description} />
                            </div>

                            {/* Project Visibility */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Project Visibility</Label>
                                <RadioGroup
                                    value={data.visibility}
                                    onValueChange={(value: 'private' | 'public') => setData('visibility', value)}
                                    className="space-y-3"
                                >
                                    <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                        <RadioGroupItem value="private" id="private" />
                                        <div className="flex items-center gap-2 flex-1">
                                            <Shield className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <Label htmlFor="private" className="font-medium cursor-pointer">Private</Label>
                                                <p className="text-sm text-muted-foreground">Only you and invited members can access this project</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                        <RadioGroupItem value="public" id="public" />
                                        <div className="flex items-center gap-2 flex-1">
                                            <Globe className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <Label htmlFor="public" className="font-medium cursor-pointer">Public</Label>
                                                <p className="text-sm text-muted-foreground">Anyone in your organization can view this project</p>
                                            </div>
                                        </div>
                                    </div>
                                </RadioGroup>
                                <InputError message={errors.is_public} />
                            </div>

                            {/* Task Completion Behavior */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Task Completion Behavior</Label>
                                <RadioGroup
                                    value={data.completion_behavior}
                                    onValueChange={(value: 'simple' | 'review' | 'custom') => setData('completion_behavior', value)}
                                    className="space-y-3"
                                >
                                    <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                        <RadioGroupItem value="simple" id="simple" />
                                        <div className="flex-1">
                                            <Label htmlFor="simple" className="font-medium cursor-pointer">Simple</Label>
                                            <p className="text-sm text-muted-foreground">Tasks can be marked as done directly. Best for personal projects.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                        <RadioGroupItem value="review" id="review" />
                                        <div className="flex-1">
                                            <Label htmlFor="review" className="font-medium cursor-pointer">Review Workflow</Label>
                                            <p className="text-sm text-muted-foreground">Tasks go through a review process before being marked as done. Best for team projects.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                        <RadioGroupItem value="custom" id="custom" />
                                        <div className="flex-1">
                                            <Label htmlFor="custom" className="font-medium cursor-pointer">Custom</Label>
                                            <p className="text-sm text-muted-foreground">Advanced completion workflow with custom statuses.</p>
                                        </div>
                                    </div>
                                </RadioGroup>
                                <InputError message={errors.completion_behavior} />
                            </div>

                            {/* Background Color */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                    <Palette className="h-4 w-4" />
                                    Project Color
                                </Label>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-6 gap-2">
                                        {predefinedColors.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                                                    data.background_color === color
                                                        ? 'border-primary ring-2 ring-primary/20'
                                                        : 'border-border hover:border-primary/50'
                                                }`}
                                                style={{ backgroundColor: color }}
                                                onClick={() => setData('background_color', color)}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="color"
                                            className="w-12 h-10 p-1 cursor-pointer"
                                            value={data.background_color}
                                            onChange={(e) => setData('background_color', e.target.value)}
                                        />
                                        <Input
                                            type="text"
                                            value={data.background_color}
                                            onChange={(e) => setData('background_color', e.target.value)}
                                            placeholder="#3498db"
                                            className="font-mono"
                                        />
                                    </div>
                                </div>
                                <InputError message={errors.background_color} />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Create Project
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
