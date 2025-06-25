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
import { CalendarDays, Plus, User, Users, Globe, Archive, Grid, List, SortAsc, SortDesc, Clock } from 'lucide-react';
import StarButton from '@/components/star-button';
import { useState, useMemo, useEffect } from 'react';
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
    const location = typeof window !== 'undefined' ? window.location : null;
    const navigate = typeof window !== 'undefined' ? (url: string) => window.history.replaceState({}, '', url) : () => {};

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

    // On mount, set viewMode from URL param
    useEffect(() => {
        if (!location) return;
        const params = new URLSearchParams(location.search);
        const viewParam = params.get('view');
        if (viewParam === 'list' && viewMode !== 'list') {
            setViewMode('list');
        } else if (viewParam === 'card' && viewMode !== 'card') {
            setViewMode('card');
        }
    }, []);

    // When viewMode changes, update URL param
    useEffect(() => {
        if (!location) return;
        const params = new URLSearchParams(location.search);
        if (viewMode === 'list') {
            params.set('view', 'list');
        } else {
            params.set('view', 'card');
        }
        const newUrl = `${location.pathname}?${params.toString()}`;
        navigate(newUrl);
    }, [viewMode]);

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

            {/* Controls Row: Filter, Sort, View */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-2">
                <div className="flex flex-wrap gap-2 items-center">
                    {/* Filter Buttons */}
                    <Button
                        variant={activeFilter === 'all' ? 'default' : 'outline'}
                        onClick={() => setActiveFilter('all')}
                        className="flex items-center gap-2"
                    >
                        <Globe className="h-4 w-4" />
                        All
                        <Badge variant="secondary" className="ml-1">{projects.length}</Badge>
                    </Button>
                    <Button
                        variant={activeFilter === 'personal' ? 'default' : 'outline'}
                        onClick={() => setActiveFilter('personal')}
                        className="flex items-center gap-2"
                    >
                        <User className="h-4 w-4" />
                        Personal
                        <Badge variant="secondary" className="ml-1">{projects.filter(p => p.owner_id === auth.user.id && p.is_personal_project).length}</Badge>
                    </Button>
                    <Button
                        variant={activeFilter === 'team' ? 'default' : 'outline'}
                        onClick={() => setActiveFilter('team')}
                        className="flex items-center gap-2"
                    >
                        <Users className="h-4 w-4" />
                        Team
                        <Badge variant="secondary" className="ml-1">{projects.filter(p => (p.owner_id === auth.user.id && p.is_team_project) || (p.owner_id !== auth.user.id && p.members?.some(member => member.id === auth.user.id))).length}</Badge>
                    </Button>
                </div>
                <div className="flex items-center gap-2 mt-2 md:mt-0 md:ml-auto">
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
                    <span className="text-sm font-medium">View:</span>
                    <Button variant={viewMode === 'card' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('card')}><Grid className="h-4 w-4" /></Button>
                    <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
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
                                    <Card hoverable={true} className={`h-full group min-h-[200px] p-0 flex flex-col justify-between border-2 ${project.background_color ? '' : (project.is_team_project ? 'border-blue-500' : 'border-gray-400')}`} style={project.background_color ? { borderColor: project.background_color } : {}}>
                                        <CardHeader className="pb-2 pt-3 px-4">
                                            <div className="flex justify-between items-start gap-2 flex-wrap min-w-0">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col gap-1 min-w-0">
                                                        <span className="font-semibold text-base truncate block max-w-[160px]">{project.name}</span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {project.is_team_project ? (
                                                                <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200 px-2 py-0.5 text-xs mt-1 h-6 flex items-center gap-1"><Users className="h-3 w-3 mr-1" />Team</Badge>
                                                            ) : (
                                                                <Badge variant="default" className="bg-gray-100 text-gray-700 border-gray-200 px-2 py-0.5 text-xs mt-1 h-6 flex items-center gap-1"><User className="h-3 w-3 mr-1" />Personal</Badge>
                                                            )}
                                                            {project.is_archived && (
                                                                <Badge variant="outline" className="text-xs ml-2 h-6 flex items-center gap-1"><Archive className="h-3 w-3 mr-1" />Archived</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <StarButton
                                                        type="project"
                                                        id={project.id}
                                                        isFavorited={project.is_favorited || false}
                                                        size="sm"
                                                        variant="ghost"
                                                    />
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="py-1 px-4 flex-1 flex flex-col gap-1 justify-center min-w-0">
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground min-h-[18px] mt-1 flex-wrap min-w-0">
                                                {project.is_team_project && project.members && project.members.length > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <Users className="h-4 w-4" />
                                                        <span>{project.members.length} members</span>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                        <div className="flex items-center justify-between w-full text-xs text-muted-foreground pt-1 pb-3 pl-3 pr-2 mt-auto border-t border-border">
                                            <div className="flex items-center gap-1 min-w-0">
                                                <Avatar className="h-5 w-5">
                                                    <AvatarImage src={project.owner?.avatar} />
                                                    <AvatarFallback className="text-xs">{project.owner?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                                                </Avatar>
                                                <span className="truncate block max-w-[100px]">{getShortName(project.owner?.name || 'Unknown')}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <CalendarDays className="h-4 w-4" />
                                                <span>{new Date(project.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredAndSortedProjects.map((project) => (
                                <Link key={project.id} href={route('projects.show', project.id)} className="block">
                                    <Card className={`hover:shadow-md transition-shadow border-2 ${project.background_color ? '' : (project.is_team_project ? 'border-blue-500' : 'border-gray-400')}`} style={project.background_color ? { borderColor: project.background_color } : {}}>
                                        <CardContent className="py-0 px-2 pt-0 pb-0">
                                            <div className="flex items-start gap-4 flex-1 min-w-0 pl-3">
                                                {/* Project name and star in one row */}
                                                <div className="flex flex-1 items-center min-w-0">
                                                    <h3 className="font-medium truncate max-w-[200px] flex-1 flex items-center">
                                                        {project.name}
                                                        <StarButton
                                                            type="project"
                                                            id={project.id}
                                                            isFavorited={project.is_favorited || false}
                                                            size="sm"
                                                            variant="ghost"
                                                            className="ml-0"
                                                        />
                                                    </h3>
                                                </div>
                                                {/* Tag and member count to the far right, with pr-2 */}
                                                <div className="flex flex-col items-end flex-shrink-0 ml-auto min-w-[110px] pr-2">
                                                    <div className="flex items-center gap-2">
                                                        {project.is_team_project ? (
                                                            <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200 px-2 py-0.5 text-xs h-6 flex items-center gap-1"><Users className="h-3 w-3 mr-1" />Team</Badge>
                                                        ) : (
                                                            <Badge variant="default" className="bg-gray-100 text-gray-700 border-gray-200 px-2 py-0.5 text-xs h-6 flex items-center gap-1"><User className="h-3 w-3 mr-1" />Personal</Badge>
                                                        )}
                                                        {project.is_archived && (
                                                            <Badge variant="outline" className="text-xs ml-2 h-6 flex items-center gap-1"><Archive className="h-3 w-3 mr-1" />Archived</Badge>
                                                        )}
                                                    </div>
                                                    {/* Member count directly under tag, right-aligned, pr-2, always rendered for alignment */}
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2 pb-2 min-h-[18px] justify-end w-full">
                                                        {project.is_team_project && project.members && project.members.length > 0 ? (
                                                            <>
                                                                <Users className="h-3 w-3" />
                                                                <span>{project.members.length} members</span>
                                                            </>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between w-full text-xs text-muted-foreground pt-0 pb-0 pl-3 pr-2 mt-auto border-t border-border">
                                                <div className="flex items-center gap-1 min-w-0">
                                                    <Avatar className="h-5 w-5">
                                                        <AvatarImage src={project.owner?.avatar} />
                                                        <AvatarFallback className="text-xs">{project.owner?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="truncate block max-w-[100px]">{getShortName(project.owner?.name || 'Unknown')}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <CalendarDays className="h-4 w-4" />
                                                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
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

