import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Project } from '@/types/project-manager';
import { Head, Link, usePage } from '@inertiajs/react';
import { CalendarDays, Plus, User, Users, Globe, Archive, Grid, List, SortAsc, SortDesc } from 'lucide-react';
import StarButton from '@/components/star-button';
import { useState, useMemo } from 'react';
import { useShortName } from '@/hooks/use-initials';
import CreateProjectModal from '@/components/project/CreateProjectModal';

interface ProjectsIndexProps {
    projects: Project[];
}

type ProjectFilter = 'all' | 'personal' | 'team';
type ProjectSort = 'manual' | 'name_asc' | 'name_desc' | 'newest' | 'oldest' | 'tasks_asc' | 'tasks_desc';
type ProjectView = 'card' | 'list';

export default function ProjectsIndex({ projects }: ProjectsIndexProps) {
    const { auth } = usePage<SharedData>().props;
    const [activeFilter, setActiveFilter] = useState<ProjectFilter>('all');
    const [sortBy, setSortBy] = useState<ProjectSort>('newest');
    const [viewMode, setViewMode] = useState<ProjectView>('card');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const getShortName = useShortName();

    // Filter and sort projects
    const filteredAndSortedProjects = useMemo(() => {
        let filtered = projects;
        
        // Apply filter
        switch (activeFilter) {
            case 'personal':
                filtered = projects.filter(project =>
                    project.owner_id === auth.user.id && project.is_personal_project
                );
                break;
            case 'team':
                filtered = projects.filter(project =>
                    (project.owner_id === auth.user.id && project.is_team_project) ||
                    (project.owner_id !== auth.user.id && project.members?.some(member => member.id === auth.user.id))
                );
                break;
            default:
                filtered = projects;
        }

        // Apply sorting
        switch (sortBy) {
            case 'name_asc':
                return filtered.sort((a, b) => a.name.localeCompare(b.name));
            case 'name_desc':
                return filtered.sort((a, b) => b.name.localeCompare(a.name));
            case 'newest':
                return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            case 'oldest':
                return filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            case 'tasks_asc':
                return filtered.sort((a, b) => (a.tasks_count ?? 0) - (b.tasks_count ?? 0));
            case 'tasks_desc':
                return filtered.sort((a, b) => (b.tasks_count ?? 0) - (a.tasks_count ?? 0));
            default:
                return filtered; // manual sorting
        }
    }, [projects, activeFilter, sortBy, auth.user.id]);

    return (
        <AppLayout>
            <Head title="Projects" />
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Projects</h1>
                <Button onClick={() => setCreateModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                </Button>
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
                        {projects.filter(p => p.owner_id === auth.user.id && p.is_personal_project).length}
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
                            (p.owner_id === auth.user.id && p.is_team_project) ||
                            (p.owner_id !== auth.user.id && p.members?.some(member => member.id === auth.user.id))
                        ).length}
                    </Badge>
                </Button>
            </div>

            {/* Sorting and View Controls */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Sort by:</span>
                        <Select value={sortBy} onValueChange={(value: ProjectSort) => setSortBy(value)}>
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="manual">Manual</SelectItem>
                                <SelectItem value="name_asc">A - Z</SelectItem>
                                <SelectItem value="name_desc">Z - A</SelectItem>
                                <SelectItem value="newest">Newest - Oldest</SelectItem>
                                <SelectItem value="oldest">Oldest - Newest</SelectItem>
                                <SelectItem value="tasks_asc">Less tasks remaining</SelectItem>
                                <SelectItem value="tasks_desc">More tasks remaining</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">View:</span>
                    <Button
                        variant={viewMode === 'card' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('card')}
                    >
                        <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {filteredAndSortedProjects.length === 0 ? (
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
                        <Button onClick={() => setCreateModalOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Project
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    {viewMode === 'card' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredAndSortedProjects.map((project) => (
                                <Link key={project.id} href={route('projects.show', project.id)} className="block">
                                    <Card hoverable={true} className="h-full group min-h-[170px] p-0 flex flex-col justify-between">
                                        <CardHeader className="pb-2 pt-3 px-4">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <CardTitle className="text-base truncate cursor-help font-semibold">
                                                                        {project.name}
                                                                    </CardTitle>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{project.name}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                        {project.is_team_project ? (
                                                            <Badge variant="outline" className="text-[10px] px-1 py-0.5 h-5 flex items-center">
                                                                <Users className="h-3 w-3 mr-1" />Team
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-[10px] px-1 py-0.5 h-5 flex items-center">
                                                                <User className="h-3 w-3 mr-1" />Personal
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground min-h-[18px]">
                                                        {project.is_archived && (
                                                            <div className="flex items-center gap-1">
                                                                <Archive className="h-3 w-3" />
                                                                <span>Archived</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <StarButton
                                                        type="project"
                                                        id={project.id}
                                                        isFavorited={project.is_favorited || false}
                                                        size="sm"
                                                        variant="ghost"
                                                    />
                                                    {project.background_color && (
                                                        <div
                                                            className="w-6 h-6 rounded-md shadow-sm border"
                                                            style={{ backgroundColor: project.background_color }}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="py-1 px-4 flex-1 flex flex-col gap-1 justify-center">
                                            {project.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                                                    {project.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-1 mt-auto">
                                                <Avatar className="h-5 w-5">
                                                    <AvatarImage src={project.owner?.avatar} />
                                                    <AvatarFallback className="text-[10px]">
                                                        {project.owner?.name?.charAt(0).toUpperCase() || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs text-muted-foreground">
                                                    {getShortName(project.owner?.name || 'Unknown')}
                                                </span>
                                                {project.members && project.members.length > 0 && (
                                                    <>
                                                        <span className="mx-1 text-muted-foreground">·</span>
                                                        <div className="flex -space-x-2">
                                                            {project.members.slice(0, 3).map((member) => (
                                                                <Avatar key={member.id} className="h-5 w-5 border-2 border-background">
                                                                    <AvatarImage src={member.avatar} />
                                                                    <AvatarFallback className="text-[10px]">
                                                                        {member.name.charAt(0).toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                            ))}
                                                            {project.members.length > 3 && (
                                                                <div className="h-5 w-5 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                                                                    <span className="text-[10px] text-muted-foreground">
                                                                        +{project.members.length - 3}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-muted-foreground ml-1">
                                                            {project.members.length}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </CardContent>
                                        <CardFooter className="border-t py-1 px-4 mt-auto">
                                            <div className="flex items-center justify-between w-full text-[11px] text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <CalendarDays className="h-3 w-3" />
                                                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                                                </div>
                                                {project.can_edit && (
                                                    <Badge variant="outline" className="text-[10px] px-1 py-0.5 h-5 flex items-center">
                                                        Owner
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardFooter>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredAndSortedProjects.map((project) => (
                                <Link key={project.id} href={route('projects.show', project.id)} className="block">
                                    <Card className="hover:shadow-md transition-shadow">
                                        <CardContent className="py-1 px-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        {project.background_color && (
                                                            <div
                                                                className="w-4 h-4 rounded border"
                                                                style={{ backgroundColor: project.background_color }}
                                                            />
                                                        )}
                                                        <div>
                                                            <h3 className="font-medium">{project.name}</h3>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Avatar className="h-5 w-5">
                                                                <AvatarImage src={project.owner?.avatar} />
                                                                <AvatarFallback className="text-xs">
                                                                    {project.owner?.name?.charAt(0).toUpperCase() || 'U'}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span>{getShortName(project.owner?.name || 'Unknown')}</span>
                                                        </div>
                                                        
                                                        {project.members && project.members.length > 0 && (
                                                            <div className="flex items-center gap-1">
                                                                <Users className="h-4 w-4" />
                                                                <span>{project.members.length} members</span>
                                                            </div>
                                                        )}
                                                        
                                                        <div className="flex items-center gap-1">
                                                            <CalendarDays className="h-4 w-4" />
                                                            <span>{new Date(project.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    {project.is_team_project ? (
                                                        <Badge variant="outline" className="text-xs">
                                                            <Users className="h-3 w-3 mr-1" />
                                                            Team
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-xs">
                                                            <User className="h-3 w-3 mr-1" />
                                                            Personal
                                                        </Badge>
                                                    )}
                                                    
                                                    {project.is_archived && (
                                                        <Badge variant="outline" className="text-xs">
                                                            <Archive className="h-3 w-3 mr-1" />
                                                            Archived
                                                        </Badge>
                                                    )}
                                                    
                                                    <StarButton
                                                        type="project"
                                                        id={project.id}
                                                        isFavorited={project.is_favorited || false}
                                                        size="sm"
                                                        variant="ghost"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Create Project Modal */}
            <CreateProjectModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
            />
        </AppLayout>
    );
}
