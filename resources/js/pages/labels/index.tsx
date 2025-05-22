import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Label, Project } from '@/types/project-manager';
import { Head, Link } from '@inertiajs/react';
import { Edit, Plus, Tag, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface LabelsIndexProps {
    project: Project;
    labels: Label[];
}

export default function LabelsIndex({ project, labels }: LabelsIndexProps) {
    const [searchTerm, setSearchTerm] = useState('');

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
    ];

    // Filter labels based on search term
    const filteredLabels = labels.filter(label => 
        label.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (label.description && label.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Labels - ${project.name}`} />
            <div className="space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-semibold flex flex-wrap items-center gap-2 break-words">
                            <span className="break-words">Labels</span>
                            <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full font-medium whitespace-nowrap">
                                {project.key}
                            </span>
                        </h1>
                        <p className="text-muted-foreground mt-1">Manage labels for your project</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={route('labels.create', { project: project.id })}>
                            <Button size="sm" className="shadow-sm hover:shadow-md">
                                <Plus className="h-4 w-4 mr-2" />
                                New Label
                            </Button>
                        </Link>
                    </div>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle>Project Labels</CardTitle>
                        <CardDescription>
                            Labels help you categorize and filter tasks across your project.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search labels..."
                                className="w-full px-3 py-2 border rounded-md"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {filteredLabels.length > 0 ? (
                            <div className="space-y-3">
                                {filteredLabels.map((label) => (
                                    <div 
                                        key={label.id} 
                                        className="flex items-center justify-between p-4 bg-card/80 backdrop-blur-sm rounded-lg border border-border/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div 
                                                className="w-6 h-6 rounded-full" 
                                                style={{ backgroundColor: label.color }}
                                            ></div>
                                            <div>
                                                <p className="font-medium">{label.name}</p>
                                                {label.description && (
                                                    <p className="text-sm text-muted-foreground">{label.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Link href={route('labels.edit', { project: project.id, label: label.id })}>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <Edit className="h-4 w-4" />
                                                    <span className="sr-only">Edit</span>
                                                </Button>
                                            </Link>
                                            <Link 
                                                href={route('labels.destroy', { project: project.id, label: label.id })} 
                                                method="delete" 
                                                as="button"
                                                onClick={(e) => {
                                                    if (!confirm('Are you sure you want to delete this label?')) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            >
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Delete</span>
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 p-8">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                    <Tag className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="mt-4 text-lg font-medium">No labels found</h3>
                                <p className="text-muted-foreground mt-2 mb-4">
                                    {searchTerm ? 'No labels match your search criteria.' : 'Create your first label to get started.'}
                                </p>
                                {!searchTerm && (
                                    <Link href={route('labels.create', { project: project.id })}>
                                        <Button size="sm" className="shadow-sm hover:shadow-md">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Label
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
