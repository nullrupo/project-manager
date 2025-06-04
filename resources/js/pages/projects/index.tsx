import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Project } from '@/types/project-manager';
import { Head, Link, usePage } from '@inertiajs/react';
import { CalendarDays, Lock, Plus, User, Users, Globe, Shield, Archive, Star } from 'lucide-react';
import StarButton from '@/components/star-button';

interface ProjectsIndexProps {
    projects: Project[];
}

export default function ProjectsIndex({ projects }: ProjectsIndexProps) {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout>
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
                            <Card hoverable={true} className="h-full group">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <CardTitle className="text-xl truncate">{project.name}</CardTitle>
                                                <Badge variant="secondary" className="text-xs font-mono">
                                                    {project.key}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                {project.is_public ? (
                                                    <div className="flex items-center gap-1">
                                                        <Globe className="h-3 w-3" />
                                                        <span>Public</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1">
                                                        <Shield className="h-3 w-3" />
                                                        <span>Private</span>
                                                    </div>
                                                )}
                                                {project.is_archived && (
                                                    <div className="flex items-center gap-1">
                                                        <Archive className="h-3 w-3" />
                                                        <span>Archived</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <StarButton
                                                type="project"
                                                id={project.id}
                                                isFavorited={project.is_favorited || false}
                                                size="sm"
                                                variant="ghost"
                                            />
                                            {project.background_color && (
                                                <div
                                                    className="w-8 h-8 rounded-lg shadow-sm border"
                                                    style={{ backgroundColor: project.background_color }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-3">
                                    {project.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                            {project.description}
                                        </p>
                                    )}

                                    {/* Project Owner */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={project.owner?.avatar} />
                                            <AvatarFallback className="text-xs">
                                                {project.owner?.name?.charAt(0).toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm text-muted-foreground">
                                            {project.owner?.name || 'Unknown'}
                                        </span>
                                    </div>

                                    {/* Project Members */}
                                    {project.members && project.members.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <div className="flex -space-x-2">
                                                {project.members.slice(0, 5).map((member, index) => (
                                                    <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                                                        <AvatarImage src={member.avatar} />
                                                        <AvatarFallback className="text-xs">
                                                            {member.name.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                ))}
                                                {project.members.length > 5 && (
                                                    <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                                                        <span className="text-xs text-muted-foreground">
                                                            +{project.members.length - 5}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {project.members.length} member{project.members.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="border-t pt-3">
                                    <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <CalendarDays className="h-3 w-3" />
                                            <span>{new Date(project.created_at).toLocaleDateString()}</span>
                                        </div>
                                        {project.can_edit && (
                                            <Badge variant="outline" className="text-xs">
                                                Owner
                                            </Badge>
                                        )}
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
