import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Project } from '@/types/project-manager';
import { Head, Link, usePage } from '@inertiajs/react';
import { CalendarDays, Plus, User, Users, Globe, Archive } from 'lucide-react';
import StarButton from '@/components/star-button';
import { useState, useMemo } from 'react';
import { useShortName } from '@/hooks/use-initials';

interface ProjectsIndexProps {
    projects: Project[];
}

type ProjectFilter = 'all' | 'personal' | 'team';

export default function ProjectsIndex({ projects }: ProjectsIndexProps) {
    const { auth } = usePage<SharedData>().props;
    const [activeFilter, setActiveFilter] = useState<ProjectFilter>('all');
    const getShortName = useShortName();

    // Filter projects based on the active filter
    const filteredProjects = useMemo(() => {
        switch (activeFilter) {
            case 'personal':
                return projects.filter(project => project.owner_id === auth.user.id);
            case 'team':
                return projects.filter(project =>
                    project.owner_id !== auth.user.id &&
                    project.members?.some(member => member.id === auth.user.id)
                );
            case 'all':
            default:
                return projects;
        }
    }, [projects, activeFilter, auth.user.id]);

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

            {/* Filter Controls */}
            <div className="flex gap-2 mb-6">
                <Button
                    variant={activeFilter === 'all' ? 'default' : 'outline'}
                    onClick={() => setActiveFilter('all')}
                    className="flex items-center gap-2"
                >
                    <Globe className="h-4 w-4" />
                    All
                    <Badge variant="secondary" className="ml-1">
                        {projects.length}
                    </Badge>
                </Button>
                <Button
                    variant={activeFilter === 'personal' ? 'default' : 'outline'}
                    onClick={() => setActiveFilter('personal')}
                    className="flex items-center gap-2"
                >
                    <User className="h-4 w-4" />
                    Personal
                    <Badge variant="secondary" className="ml-1">
                        {projects.filter(p => p.owner_id === auth.user.id).length}
                    </Badge>
                </Button>
                <Button
                    variant={activeFilter === 'team' ? 'default' : 'outline'}
                    onClick={() => setActiveFilter('team')}
                    className="flex items-center gap-2"
                >
                    <Users className="h-4 w-4" />
                    Team
                    <Badge variant="secondary" className="ml-1">
                        {projects.filter(p =>
                            p.owner_id !== auth.user.id &&
                            p.members?.some(member => member.id === auth.user.id)
                        ).length}
                    </Badge>
                </Button>
            </div>

            {filteredProjects.length === 0 ? (
                <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {activeFilter === 'all' ? 'No projects found' :
                         activeFilter === 'personal' ? 'No personal projects found' :
                         'No team projects found'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {activeFilter === 'all' ? 'Get started by creating a new project.' :
                         activeFilter === 'personal' ? 'Create your first personal project.' :
                         'Join a team project or create a new one.'}
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
                    {filteredProjects.map((project) => (
                        <Link key={project.id} href={route('projects.show', project.id)} className="block">
                            <Card hoverable={true} className="h-full group">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <CardTitle className="text-xl truncate cursor-help">
                                                                {project.name}
                                                            </CardTitle>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{project.name}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                {/* Project type indicator */}
                                                {project.owner_id === auth.user.id ? (
                                                    <Badge variant="outline" className="text-xs">
                                                        <User className="h-3 w-3 mr-1" />
                                                        Personal
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-xs">
                                                        <Users className="h-3 w-3 mr-1" />
                                                        Team
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                                            {getShortName(project.owner?.name || 'Unknown')}
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
