import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Project } from '@/types/project-manager';
import { Head, Link } from '@inertiajs/react';
import { CalendarDays, Plus, Users } from 'lucide-react';

interface ProjectsIndexProps {
    projects: Project[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Projects',
        href: route('projects.index'),
    },
];

export default function ProjectsIndex({ projects }: ProjectsIndexProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Projects" />
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Projects</h1>
                <Link href={route('projects.create')}>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Project
                    </Button>
                </Link>
            </div>

            {projects.length === 0 ? (
                <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No projects found</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Get started by creating a new project.
                    </p>
                    <div className="mt-6">
                        <Link href={route('projects.create')}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                New Project
                            </Button>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <Link key={project.id} href={route('projects.show', project.id)} className="block">
                            <Card className="h-full hover:shadow-md transition-shadow duration-200">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-xl">{project.name}</CardTitle>
                                            <CardDescription className="text-sm text-muted-foreground">
                                                {project.key}
                                            </CardDescription>
                                        </div>
                                        {project.background_color && (
                                            <div
                                                className="w-6 h-6 rounded-full"
                                                style={{ backgroundColor: project.background_color }}
                                            />
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {project.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {project.description}
                                        </p>
                                    )}
                                </CardContent>
                                <CardFooter className="flex justify-between border-t pt-4">
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Users className="mr-1 h-4 w-4" />
                                        <span>
                                            {project.members?.length || 0} member{(project.members?.length || 0) !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <CalendarDays className="mr-1 h-4 w-4" />
                                        <span>{new Date(project.created_at).toLocaleDateString()}</span>
                                    </div>
                                </CardFooter>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </AppLayout>
    );
}
