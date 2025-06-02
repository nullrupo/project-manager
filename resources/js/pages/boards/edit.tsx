import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Project, Board } from '@/types/project-manager';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, Kanban, Calendar, Palette, Trash2, Settings } from 'lucide-react';
import { FormEventHandler } from 'react';

interface BoardEditForm {
    name: string;
    description: string;
    type: 'kanban' | 'scrum' | 'custom';
    background_color: string;
    background_image: string;
}

interface BoardEditProps {
    project: Project;
    board: Board;
}

export default function BoardEdit({ project, board }: BoardEditProps) {
    const { data, setData, put, processing, errors } = useForm<BoardEditForm>({
        name: board.name || '',
        description: board.description || '',
        type: board.type || 'kanban',
        background_color: board.background_color || '#3498db',
        background_image: board.background_image || '',
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
            title: board.name,
            href: route('boards.show', { project: project.id, board: board.id }),
        },
        {
            title: 'Edit',
            href: route('boards.edit', { project: project.id, board: board.id }),
        },
    ];

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('boards.update', { project: project.id, board: board.id }));
    };

    const predefinedColors = [
        '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
        '#9b59b6', '#1abc9c', '#34495e', '#e67e22',
        '#95a5a6', '#f1c40f', '#8e44ad', '#16a085'
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${board.name}`} />
            <div className="max-w-3xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Board</CardTitle>
                        <CardDescription>Update board settings for {board.name}</CardDescription>
                    </CardHeader>
                    <form onSubmit={submit}>
                        <CardContent className="space-y-6">
                            {/* Board Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium">Board Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Enter board name"
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
                                    placeholder="Describe what this board is for..."
                                    className="min-h-[100px] resize-none"
                                />
                                <InputError message={errors.description} />
                            </div>

                            {/* Board Type */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Board Type</Label>
                                <RadioGroup
                                    value={data.type}
                                    onValueChange={(value: 'kanban' | 'scrum' | 'custom') => setData('type', value)}
                                    className="space-y-3"
                                >
                                    <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                        <RadioGroupItem value="kanban" id="kanban" />
                                        <div className="flex items-center gap-2 flex-1">
                                            <Kanban className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <Label htmlFor="kanban" className="font-medium cursor-pointer">Kanban Board</Label>
                                                <p className="text-sm text-muted-foreground">Simple workflow with To Do, In Progress, and Done columns</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                        <RadioGroupItem value="scrum" id="scrum" />
                                        <div className="flex items-center gap-2 flex-1">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <Label htmlFor="scrum" className="font-medium cursor-pointer">Scrum Board</Label>
                                                <p className="text-sm text-muted-foreground">Sprint-based workflow with Backlog, Sprint, In Progress, and Done</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                        <RadioGroupItem value="custom" id="custom" />
                                        <div className="flex items-center gap-2 flex-1">
                                            <Settings className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <Label htmlFor="custom" className="font-medium cursor-pointer">Custom Board</Label>
                                                <p className="text-sm text-muted-foreground">Start with a blank board and create your own workflow</p>
                                            </div>
                                        </div>
                                    </div>
                                </RadioGroup>
                                <InputError message={errors.type} />
                            </div>

                            {/* Background Color */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                    <Palette className="h-4 w-4" />
                                    Board Color
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
                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>
                                    {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Board
                                </Button>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
