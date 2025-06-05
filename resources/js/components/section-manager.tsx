import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Project, Section } from '@/types/project-manager';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

interface SectionManagerProps {
    project: Project;
    sections: Section[];
}

export default function SectionManager({ project, sections }: SectionManagerProps) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<Section | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        description: '',
    });

    const handleCreateSection = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('sections.store', project.id), {
            onSuccess: () => {
                reset();
                setIsCreateDialogOpen(false);
            },
        });
    };

    const handleUpdateSection = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSection) return;

        put(route('sections.update', { project: project.id, section: editingSection.id }), {
            onSuccess: () => {
                reset();
                setEditingSection(null);
            },
        });
    };

    const handleDeleteSection = (section: Section) => {
        if (confirm('Are you sure you want to delete this section? Tasks will be moved to no section.')) {
            router.delete(route('sections.destroy', { project: project.id, section: section.id }));
        }
    };

    const toggleSectionCollapse = (section: Section) => {
        put(route('sections.update', { project: project.id, section: section.id }), {
            data: {
                name: section.name,
                description: section.description,
                is_collapsed: !section.is_collapsed,
            },
            preserveState: true,
            preserveScroll: true,
        });
    };

    const startEditing = (section: Section) => {
        setData({
            name: section.name,
            description: section.description || '',
        });
        setEditingSection(section);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Project Sections</h3>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Section
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Section</DialogTitle>
                            <DialogDescription>
                                Sections help organize tasks within your project.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateSection} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Section Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Enter section name"
                                    required
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Enter section description"
                                    rows={3}
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-600">{errors.description}</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Creating...' : 'Create Section'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-2">
                {sections.map((section) => (
                    <Card key={section.id} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleSectionCollapse(section)}
                                        className="p-1 h-6 w-6"
                                    >
                                        {section.is_collapsed ? (
                                            <ChevronRight className="h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <CardTitle className="text-base">{section.name}</CardTitle>
                                    <Badge variant="secondary">
                                        {section.tasks?.length || 0} tasks
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => startEditing(section)}
                                        className="h-8 w-8 p-0"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteSection(section)}
                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            {section.description && !section.is_collapsed && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {section.description}
                                </p>
                            )}
                        </CardHeader>
                    </Card>
                ))}
            </div>

            {/* Edit Section Dialog */}
            <Dialog open={!!editingSection} onOpenChange={() => setEditingSection(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Section</DialogTitle>
                        <DialogDescription>
                            Update the section name and description.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateSection} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Section Name</Label>
                            <Input
                                id="edit-name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Enter section name"
                                required
                            />
                            {errors.name && (
                                <p className="text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description (Optional)</Label>
                            <Textarea
                                id="edit-description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Enter section description"
                                rows={3}
                            />
                            {errors.description && (
                                <p className="text-sm text-red-600">{errors.description}</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingSection(null)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Updating...' : 'Update Section'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
