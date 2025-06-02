import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Project } from '@/types/project-manager';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Archive, Edit, Lock, Plus, Trash2, Users, ListTodo, Tag, Globe, Shield, Calendar, BarChart3, UserPlus, Settings, Crown, Clock, AlertCircle, CheckCircle2, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import InviteMemberModal from '@/components/invite-member-modal';
import { useState } from 'react';

interface ProjectShowProps {
    project: Project;
}

export default function ProjectShow({ project }: ProjectShowProps) {
    const { auth } = usePage<SharedData>().props;
    const canEdit = project.can_edit;
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('boards');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<any>(null);
    const [boardSearchQuery, setBoardSearchQuery] = useState('');
    const [boardTypeFilter, setBoardTypeFilter] = useState('all');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Projects',
            href: route('projects.index'),
        },
        {
            title: project.name,
            href: route('projects.show', { project: project.id }),
        },
    ];

    const handleDeleteMember = () => {
        if (memberToDelete) {
            router.delete(route('projects.members.destroy', { project: project.id, user: memberToDelete.id }));
            setMemberToDelete(null);
        }
    };

    // Filter boards based on search query and type filter
    const filteredBoards = project.boards?.filter(board => {
        const matchesSearch = board.name.toLowerCase().includes(boardSearchQuery.toLowerCase()) ||
                            (board.description && board.description.toLowerCase().includes(boardSearchQuery.toLowerCase()));
        const matchesType = boardTypeFilter === 'all' || board.type === boardTypeFilter;
        return matchesSearch && matchesType;
    }) || [];

    // Calendar utility functions
    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const generateCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);

        const days = [];

        // Previous month's trailing days
        const prevMonth = new Date(year, month - 1, 0);
        const daysInPrevMonth = prevMonth.getDate();
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, daysInPrevMonth - i),
                isCurrentMonth: false,
                tasks: []
            });
        }

        // Current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            days.push({
                date,
                isCurrentMonth: true,
                tasks: getTasksForDate(date)
            });
        }

        // Next month's leading days
        const remainingDays = 42 - days.length; // 6 weeks * 7 days
        for (let day = 1; day <= remainingDays; day++) {
            days.push({
                date: new Date(year, month + 1, day),
                isCurrentMonth: false,
                tasks: []
            });
        }

        return days;
    };

    const getTasksForDate = (date: Date) => {
        // This would normally come from the project's tasks with due dates
        // For now, return empty array as we don't have task data in the project prop
        return [];
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (direction === 'prev') {
                newDate.setMonth(prev.getMonth() - 1);
            } else {
                newDate.setMonth(prev.getMonth() + 1);
            }
            return newDate;
        });
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const formatMonthYear = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const calendarDays = generateCalendarDays();
    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
        weeks.push(calendarDays.slice(i, i + 7));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={project.name} />
            <div className="space-y-6">
                <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                            {project.background_color && (
                                <div
                                    className="w-12 h-12 rounded-xl shadow-sm border"
                                    style={{ backgroundColor: project.background_color }}
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <h1 className="text-3xl font-bold flex flex-wrap items-center gap-2 break-words">
                                    <span className="break-words">{project.name}</span>
                                    <Badge variant="secondary" className="text-sm font-mono">
                                        {project.key}
                                    </Badge>
                                </h1>
                                <div className="flex items-center gap-3 mt-1">
                                    {project.is_public ? (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Globe className="h-4 w-4" />
                                            <span>Public Project</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Shield className="h-4 w-4" />
                                            <span>Private Project</span>
                                        </div>
                                    )}
                                    {project.is_archived && (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Archive className="h-4 w-4" />
                                            <span>Archived</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {project.description && (
                            <p className="text-muted-foreground mt-2 text-base leading-relaxed">
                                {project.description}
                            </p>
                        )}

                        {/* Project Owner and Members Preview */}
                        <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={project.owner?.avatar} />
                                    <AvatarFallback>
                                        {project.owner?.name?.charAt(0).toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium">{project.owner?.name}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Crown className="h-3 w-3" />
                                        Project Owner
                                    </p>
                                </div>
                            </div>

                            {project.members && project.members.length > 1 && (
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                        {project.members.slice(1, 6).map((member) => (
                                            <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                                                <AvatarImage src={member.avatar} />
                                                <AvatarFallback className="text-xs">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        ))}
                                        {project.members.length > 6 && (
                                            <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                                                <span className="text-xs text-muted-foreground">
                                                    +{project.members.length - 6}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        {project.members.length - 1} other member{project.members.length - 1 !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                        {canEdit ? (
                            <Link href={route('projects.edit', { project: project.id })}>
                                <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md">
                                    <Settings className="h-4 w-4 mr-2" />
                                    Settings
                                </Button>
                            </Link>
                        ) : (
                            <Button variant="outline" size="sm" disabled className="shadow-sm">
                                <Lock className="h-4 w-4 mr-2" />
                                Settings
                            </Button>
                        )}
                        {canEdit ? (
                            <Link href={route('projects.destroy', { project: project.id })} method="delete" as="button">
                                <Button variant="destructive" size="sm" className="shadow-sm hover:shadow-md">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </Button>
                            </Link>
                        ) : (
                            <Button variant="destructive" size="sm" disabled className="shadow-sm">
                                <Lock className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        )}
                    </div>
                </div>

                {/* Project Tabs */}
                <div className="w-full">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-muted/50 rounded-b-none border-b-0">
                        <TabsTrigger
                            value="boards"
                            className="flex flex-col items-center gap-2 h-20 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-blue-50 dark:hover:bg-blue-950/50"
                        >
                            <ListTodo className="h-5 w-5" />
                            <div className="text-center">
                                <div className="font-medium">Boards</div>
                                <div className="text-xs opacity-70">{project.boards?.length || 0} board{(project.boards?.length || 0) !== 1 ? 's' : ''}</div>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="members"
                            className="flex flex-col items-center gap-2 h-20 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-green-50 dark:hover:bg-green-950/50"
                        >
                            <Users className="h-5 w-5" />
                            <div className="text-center">
                                <div className="font-medium">Members</div>
                                <div className="text-xs opacity-70">{project.members?.length || 0} member{(project.members?.length || 0) !== 1 ? 's' : ''}</div>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="labels"
                            className="flex flex-col items-center gap-2 h-20 data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-purple-50 dark:hover:bg-purple-950/50"
                        >
                            <Tag className="h-5 w-5" />
                            <div className="text-center">
                                <div className="font-medium">Labels</div>
                                <div className="text-xs opacity-70">Organize tasks</div>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="calendar"
                            className="flex flex-col items-center gap-2 h-20 data-[state=active]:bg-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                        >
                            <Calendar className="h-5 w-5" />
                            <div className="text-center">
                                <div className="font-medium">Calendar</div>
                                <div className="text-xs opacity-70">Schedule & dates</div>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="details"
                            className="flex flex-col items-center gap-2 h-20 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-orange-50 dark:hover:bg-orange-950/50"
                        >
                            <Settings className="h-5 w-5" />
                            <div className="text-center">
                                <div className="font-medium">Details</div>
                                <div className="text-xs opacity-70">Project info</div>
                            </div>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="boards" className="mt-0">
                        <Card className="rounded-t-none border-t-0">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <ListTodo className="h-5 w-5" />
                                            Project Boards
                                        </CardTitle>
                                        <CardDescription>
                                            Organize tasks with Kanban boards
                                        </CardDescription>
                                    </div>
                                    {canEdit && (
                                        <Link href={route('boards.create', { project: project.id })}>
                                            <Button className="shadow-sm hover:shadow-md">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Create Board
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Filter Section */}
                                {project.boards && project.boards.length > 0 && (
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-muted/30 rounded-lg border">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search boards by name or description..."
                                                    value={boardSearchQuery}
                                                    onChange={(e) => setBoardSearchQuery(e.target.value)}
                                                    className="pl-10"
                                                />
                                            </div>
                                        </div>
                                        <div className="sm:w-48">
                                            <Select value={boardTypeFilter} onValueChange={setBoardTypeFilter}>
                                                <SelectTrigger>
                                                    <Filter className="h-4 w-4 mr-2" />
                                                    <SelectValue placeholder="Filter by type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Types</SelectItem>
                                                    <SelectItem value="kanban">Kanban</SelectItem>
                                                    <SelectItem value="scrum">Scrum</SelectItem>
                                                    <SelectItem value="custom">Custom</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {(boardSearchQuery || boardTypeFilter !== 'all') && (
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setBoardSearchQuery('');
                                                    setBoardTypeFilter('all');
                                                }}
                                                className="sm:w-auto"
                                            >
                                                Clear Filters
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {filteredBoards.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredBoards.map((board) => {
                                            const getBoardTypeColor = (type: string) => {
                                                switch (type) {
                                                    case 'kanban': return 'bg-blue-500';
                                                    case 'scrum': return 'bg-green-500';
                                                    case 'custom': return 'bg-purple-500';
                                                    default: return 'bg-gray-500';
                                                }
                                            };

                                            return (
                                                <Card key={board.id} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 bg-gradient-to-br from-background to-muted/20">
                                                    <CardHeader className="pb-4">
                                                        <div className="flex items-start gap-3">
                                                            {/* User Avatar for board creator/owner */}
                                                            <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                                                                <AvatarImage src={project.owner?.avatar} />
                                                                <AvatarFallback className={`text-white font-semibold ${getBoardTypeColor(board.type)}`}>
                                                                    {project.owner?.name?.charAt(0).toUpperCase() || board.name.charAt(0).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1 min-w-0">
                                                                <CardTitle className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
                                                                    {board.name}
                                                                </CardTitle>
                                                                <CardDescription className="mt-1 line-clamp-2">
                                                                    {board.description || 'No description provided'}
                                                                </CardDescription>
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="secondary" className="capitalize">
                                                                    {board.type}
                                                                </Badge>
                                                                {board.is_default && (
                                                                    <Badge variant="default" className="text-xs">
                                                                        Default
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {board.lists?.length || 0} lists
                                                            </div>
                                                        </div>

                                                        {/* Board Stats */}
                                                        <div className="grid grid-cols-3 gap-2 text-center">
                                                            <div className="bg-muted/50 rounded-lg p-2">
                                                                <div className="text-sm font-medium">
                                                                    {board.lists?.reduce((acc, list) => acc + (list.tasks?.length || 0), 0) || 0}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">Tasks</div>
                                                            </div>
                                                            <div className="bg-muted/50 rounded-lg p-2">
                                                                <div className="text-sm font-medium">
                                                                    {board.lists?.length || 0}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">Lists</div>
                                                            </div>
                                                            <div className="bg-muted/50 rounded-lg p-2">
                                                                <div className="text-sm font-medium">
                                                                    {board.lists?.reduce((acc, list) =>
                                                                        acc + (list.tasks?.filter(task => task.status === 'done').length || 0), 0) || 0}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">Done</div>
                                                            </div>
                                                        </div>

                                                        <Link href={route('boards.show', { project: project.id, board: board.id })}>
                                                            <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                                <ListTodo className="h-4 w-4 mr-2" />
                                                                Open Board
                                                            </Button>
                                                        </Link>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                ) : project.boards && project.boards.length > 0 ? (
                                    // No results found after filtering
                                    <div className="text-center py-16 bg-gradient-to-br from-muted/20 to-muted/40 rounded-xl border-2 border-dashed border-muted-foreground/30">
                                        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Search className="h-10 w-10 text-blue-600" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-3">No Boards Found</h3>
                                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                                            No boards match your current search criteria. Try adjusting your filters or search terms.
                                        </p>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setBoardSearchQuery('');
                                                setBoardTypeFilter('all');
                                            }}
                                            className="shadow-lg hover:shadow-xl transition-shadow"
                                        >
                                            Clear All Filters
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center py-16 bg-gradient-to-br from-muted/20 to-muted/40 rounded-xl border-2 border-dashed border-muted-foreground/30">
                                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <ListTodo className="h-10 w-10 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-3">Create Your First Board</h3>
                                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                                            Boards help you organize tasks using Kanban, Scrum, or custom workflows.
                                            Start by creating your first board to manage project tasks effectively.
                                        </p>
                                        {canEdit ? (
                                            <div className="space-y-4">
                                                <Link href={route('boards.create', { project: project.id })}>
                                                    <Button size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
                                                        <Plus className="h-5 w-5 mr-2" />
                                                        Create Your First Board
                                                    </Button>
                                                </Link>
                                                <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                                        <span>Kanban</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                                                        <span>Scrum</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 bg-purple-500 rounded"></div>
                                                        <span>Custom</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <Button size="lg" disabled className="shadow-lg">
                                                <Lock className="h-5 w-5 mr-2" />
                                                No Permission to Create Boards
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="members" className="mt-0">
                        <Card className="rounded-t-none border-t-0">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="h-5 w-5" />
                                            Project Members
                                        </CardTitle>
                                        <CardDescription>
                                            Manage who has access to this project and their roles
                                        </CardDescription>
                                    </div>
                                    {project.can_manage_members && (
                                        <Button
                                            onClick={() => setInviteModalOpen(true)}
                                            className="shadow-sm hover:shadow-md"
                                        >
                                            <UserPlus className="h-4 w-4 mr-2" />
                                            Invite Member
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {project.members && project.members.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {project.members.map((member) => (
                                            <Card key={member.id} className="group hover:shadow-md transition-all duration-300 border-2 hover:border-primary/20">
                                                <CardContent className="p-6">
                                                    <div className="flex items-start gap-4">
                                                        <div className="relative">
                                                            <Avatar className="h-16 w-16 border-2 border-background shadow-md">
                                                                <AvatarImage src={member.avatar} />
                                                                <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-primary/20 to-primary/10">
                                                                    {member.name.charAt(0).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            {member.id === project.owner_id && (
                                                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                                                                    <Crown className="h-3 w-3 text-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between">
                                                                <div className="min-w-0 flex-1">
                                                                    <h4 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                                                                        {member.name}
                                                                    </h4>
                                                                    <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                                                                    <div className="flex items-center gap-2 mt-2">
                                                                        <Badge
                                                                            variant={member.id === project.owner_id ? "default" : "secondary"}
                                                                            className="text-xs"
                                                                        >
                                                                            {member.id === project.owner_id ? 'Owner' : (member.pivot?.role || 'Member')}
                                                                        </Badge>
                                                                        {member.id === project.owner_id && (
                                                                            <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-200">
                                                                                Project Owner
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    {project.can_manage_members && member.id !== project.owner_id ? (
                                                                        <>
                                                                            <Link href={route('projects.members.edit', { project: project.id, user: member.id })}>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-8 w-8 p-0"
                                                                                    title="Manage permissions"
                                                                                >
                                                                                    <Settings className="h-4 w-4" />
                                                                                </Button>
                                                                            </Link>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                                                title="Remove member"
                                                                                onClick={() => {
                                                                                    setMemberToDelete(member);
                                                                                    setDeleteDialogOpen(true);
                                                                                }}
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </>
                                                                    ) : member.id !== project.owner_id ? (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-8 w-8 p-0"
                                                                            disabled
                                                                            title="No permission to manage"
                                                                        >
                                                                            <Lock className="h-4 w-4" />
                                                                        </Button>
                                                                    ) : null}
                                                                </div>
                                                            </div>

                                                            {/* Member Stats */}
                                                            <div className="grid grid-cols-2 gap-2 mt-4">
                                                                <div className="bg-muted/50 rounded-lg p-2 text-center">
                                                                    <div className="text-sm font-medium">
                                                                        {/* This would need to be calculated from actual task assignments */}
                                                                        0
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">Tasks</div>
                                                                </div>
                                                                <div className="bg-muted/50 rounded-lg p-2 text-center">
                                                                    <div className="text-sm font-medium">
                                                                        {new Date(member.pivot?.created_at || member.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">Joined</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 bg-gradient-to-br from-muted/20 to-muted/40 rounded-xl border-2 border-dashed border-muted-foreground/30">
                                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Users className="h-10 w-10 text-green-600" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-3">Invite Team Members</h3>
                                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                                            Collaboration makes projects successful. Invite team members to work together
                                            on tasks, share ideas, and achieve your project goals.
                                        </p>
                                        {project.can_manage_members ? (
                                            <Button
                                                onClick={() => setInviteModalOpen(true)}
                                                size="lg"
                                                className="shadow-lg hover:shadow-xl transition-shadow"
                                            >
                                                <UserPlus className="h-5 w-5 mr-2" />
                                                Invite Your First Member
                                            </Button>
                                        ) : (
                                            <Button size="lg" disabled className="shadow-lg">
                                                <Lock className="h-5 w-5 mr-2" />
                                                No Permission to Invite Members
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="labels" className="mt-0">
                        <Card className="rounded-t-none border-t-0">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Tag className="h-5 w-5" />
                                            Project Labels
                                        </CardTitle>
                                        <CardDescription>
                                            Create custom labels to organize and categorize tasks
                                        </CardDescription>
                                    </div>
                                    {canEdit && (
                                        <Link href={route('labels.index', { project: project.id })}>
                                            <Button className="shadow-sm hover:shadow-md">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Manage Labels
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
                                    <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-muted-foreground mb-2">Label Management</h3>
                                    <p className="text-sm text-muted-foreground mb-6">
                                        Create and manage custom labels to organize your tasks effectively
                                    </p>
                                    <Link href={route('labels.index', { project: project.id })}>
                                        <Button variant="outline">
                                            <Tag className="h-4 w-4 mr-2" />
                                            Manage Labels
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="calendar" className="mt-0">
                        <Card className="rounded-t-none border-t-0">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calendar className="h-5 w-5" />
                                            Project Calendar
                                        </CardTitle>
                                        <CardDescription>
                                            View project tasks and deadlines in calendar format
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {/* Calendar Navigation */}
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-semibold">{formatMonthYear(currentDate)}</h3>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigateMonth('prev')}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentDate(new Date())}
                                            >
                                                Today
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigateMonth('next')}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Calendar Grid */}
                                    <div className="border rounded-lg overflow-hidden bg-background">
                                        {/* Week days header */}
                                        <div className="grid grid-cols-7 bg-muted/50">
                                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                                <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-r border-border last:border-r-0">
                                                    {day}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Calendar weeks */}
                                        {weeks.map((week, weekIndex) => (
                                            <div key={weekIndex} className="grid grid-cols-7">
                                                {week.map((day, dayIndex) => (
                                                    <div
                                                        key={day.date.toISOString()}
                                                        className={`min-h-[100px] p-2 border-r border-b border-border last:border-r-0 cursor-pointer hover:bg-muted/30 transition-colors ${
                                                            !day.isCurrentMonth
                                                                ? 'bg-muted/20 text-muted-foreground'
                                                                : 'bg-background'
                                                        } ${isToday(day.date) ? 'bg-primary/10 border-primary/20' : ''}`}
                                                        onClick={() => setSelectedDay(day.date)}
                                                    >
                                                        <div className={`text-sm font-medium mb-1 ${
                                                            isToday(day.date) ? 'text-primary' : day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                                                        }`}>
                                                            {day.date.getDate()}
                                                        </div>

                                                        {/* Task indicators would go here */}
                                                        <div className="space-y-1">
                                                            {day.tasks.slice(0, 3).map((task, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="text-xs p-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded truncate"
                                                                >
                                                                    {task.title}
                                                                </div>
                                                            ))}
                                                            {day.tasks.length > 3 && (
                                                                <div className="text-xs text-muted-foreground">
                                                                    +{day.tasks.length - 3} more
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                        <Card className="border-2 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.get(route('calendar'))}>
                                            <CardContent className="p-4 text-center">
                                                <Calendar className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                                                <h4 className="font-medium">Full Calendar</h4>
                                                <p className="text-sm text-muted-foreground">View all tasks</p>
                                            </CardContent>
                                        </Card>

                                        {canEdit && (
                                            <Card className="border-2 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.get(route('tasks.create', { project: project.id }))}>
                                                <CardContent className="p-4 text-center">
                                                    <Plus className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                                    <h4 className="font-medium">Add Task</h4>
                                                    <p className="text-sm text-muted-foreground">Create new task</p>
                                                </CardContent>
                                            </Card>
                                        )}

                                        <Card className="border-2 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('boards')}>
                                            <CardContent className="p-4 text-center">
                                                <ListTodo className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                                <h4 className="font-medium">View Boards</h4>
                                                <p className="text-sm text-muted-foreground">Manage tasks</p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Calendar Legend */}
                                    <Card className="border-2">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Calendar Legend</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                                                    <span>Overdue Tasks</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                                                    <span>Due Soon</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                                    <span>Project Tasks</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                                                    <span>Completed</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Calendar Stats */}
                                    <Card className="border-2">
                                        <CardHeader>
                                            <CardTitle className="text-lg">This Month's Overview</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg text-center">
                                                    <div className="text-2xl font-bold text-blue-600">
                                                        {/* This would be calculated from actual tasks */}
                                                        0
                                                    </div>
                                                    <div className="text-sm text-blue-600/80">Tasks Due</div>
                                                </div>
                                                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg text-center">
                                                    <div className="text-2xl font-bold text-green-600">
                                                        0
                                                    </div>
                                                    <div className="text-sm text-green-600/80">Completed</div>
                                                </div>
                                                <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg text-center">
                                                    <div className="text-2xl font-bold text-orange-600">
                                                        0
                                                    </div>
                                                    <div className="text-sm text-orange-600/80">In Progress</div>
                                                </div>
                                                <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg text-center">
                                                    <div className="text-2xl font-bold text-red-600">
                                                        0
                                                    </div>
                                                    <div className="text-sm text-red-600/80">Overdue</div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="details" className="mt-0">
                        <Card className="rounded-t-none border-t-0">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Settings className="h-5 w-5" />
                                            Project Details
                                        </CardTitle>
                                        <CardDescription>
                                            View and manage project information and settings
                                        </CardDescription>
                                    </div>
                                    {canEdit && (
                                        <Link href={route('projects.edit', { project: project.id })}>
                                            <Button className="shadow-sm hover:shadow-md">
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit Project
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Project Information */}
                                    <Card className="border-2">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Project Information</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-muted-foreground">Project Key</label>
                                                    <p className="text-lg font-mono bg-muted/50 px-3 py-2 rounded-md">{project.key}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-muted-foreground">Visibility</label>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {project.is_public ? (
                                                            <>
                                                                <Globe className="h-4 w-4 text-green-600" />
                                                                <span className="text-green-600 font-medium">Public</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Shield className="h-4 w-4 text-blue-600" />
                                                                <span className="text-blue-600 font-medium">Private</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Description</label>
                                                <p className="mt-1 text-sm bg-muted/50 px-3 py-2 rounded-md min-h-[60px]">
                                                    {project.description || 'No description provided'}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                                                    <p className="text-sm mt-1">
                                                        {new Date(project.created_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                                                    <p className="text-sm mt-1">
                                                        {new Date(project.updated_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Project Statistics */}
                                    <Card className="border-2">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Project Statistics</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg text-center">
                                                    <div className="text-2xl font-bold text-blue-600">{project.boards?.length || 0}</div>
                                                    <div className="text-sm text-blue-600/80">Boards</div>
                                                </div>
                                                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg text-center">
                                                    <div className="text-2xl font-bold text-green-600">{project.members?.length || 0}</div>
                                                    <div className="text-sm text-green-600/80">Members</div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg text-center">
                                                    <div className="text-2xl font-bold text-purple-600">
                                                        {project.boards?.reduce((acc, board) =>
                                                            acc + (board.lists?.reduce((listAcc, list) =>
                                                                listAcc + (list.tasks?.length || 0), 0) || 0), 0) || 0}
                                                    </div>
                                                    <div className="text-sm text-purple-600/80">Total Tasks</div>
                                                </div>
                                                <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg text-center">
                                                    <div className="text-2xl font-bold text-orange-600">
                                                        {project.boards?.reduce((acc, board) =>
                                                            acc + (board.lists?.reduce((listAcc, list) =>
                                                                listAcc + (list.tasks?.filter(task => task.status === 'done').length || 0), 0) || 0), 0) || 0}
                                                    </div>
                                                    <div className="text-sm text-orange-600/80">Completed</div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Project Owner Information */}
                                <Card className="border-2">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Project Owner</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-16 w-16 border-2 border-background shadow-md">
                                                <AvatarImage src={project.owner?.avatar} />
                                                <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-yellow-400/20 to-yellow-600/20">
                                                    {project.owner?.name?.charAt(0).toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-lg">{project.owner?.name}</h4>
                                                <p className="text-muted-foreground">{project.owner?.email}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Badge variant="default" className="flex items-center gap-1">
                                                        <Crown className="h-3 w-3" />
                                                        Project Owner
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </CardContent>
                        </Card>
                    </TabsContent>


                    </Tabs>
                </div>
            </div>

            <InviteMemberModal
                project={project}
                open={inviteModalOpen}
                onOpenChange={setInviteModalOpen}
            />

            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Remove Team Member"
                description={`Are you sure you want to remove ${memberToDelete?.name} from this project? They will lose access to all project resources.`}
                onConfirm={handleDeleteMember}
                confirmText="Remove"
                cancelText="Cancel"
                variant="destructive"
            />
        </AppLayout>
    );
}
