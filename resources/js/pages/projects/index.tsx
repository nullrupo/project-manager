import { Head } from '@inertiajs/react';
import { CalendarDays, CheckCircle, Clock, Inbox, LayoutGrid, ListTodo, Plus, Search } from 'lucide-react';
import { useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import WorkingProjectForm from '@/components/projects/working-project-form';
import SimpleButton from '@/components/simple-button';

interface ProjectMember {
    name: string;
    avatar: string | null;
    initials: string;
}

interface Project {
    id: number;
    name: string;
    description: string;
    percentComplete: number;
    dueDate: string;
    status: string;
    owner: {
        name: string;
        avatar: string | null;
        initials: string;
    };
    tasks: {
        total: number;
        completed: number;
    };
    members: ProjectMember[];
}

interface ProjectsProps {
    projects: Project[];
}

const breadcrumbs = [
    { title: 'Projects', href: '/projects' }
];

export default function Projects({ projects }: ProjectsProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Projects" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header with search and actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search projects..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button
                        className="shrink-0"
                        onClick={() => setIsProjectFormOpen(true)}
                    >
                        <Plus className="mr-1 h-4 w-4" />
                        New Project
                    </Button>
                </div>

                {/* Quick access section */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <Button variant="outline" className="justify-start" asChild>
                        <a href="/inbox">
                            <Inbox className="mr-2 h-4 w-4" />
                            Inbox
                        </a>
                    </Button>
                    <Button variant="outline" className="justify-start" asChild>
                        <a href="/my-tasks">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            My Tasks
                        </a>
                    </Button>
                    <Button variant="outline" className="justify-start" asChild>
                        <a href="/calendar">
                            <CalendarDays className="mr-2 h-4 w-4" />
                            Calendar
                        </a>
                    </Button>
                    <Button variant="outline" className="justify-start" asChild>
                        <a href="/upcoming">
                            <Clock className="mr-2 h-4 w-4" />
                            Upcoming
                        </a>
                    </Button>
                </div>

                {/* Projects grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.map((project) => (
                        <Card key={project.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle>
                                    <a href={`/projects/${project.id}`} className="hover:text-primary">
                                        {project.name}
                                    </a>
                                </CardTitle>
                                <CardDescription>{project.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <div className="mb-4">
                                    <div className="mb-1 flex justify-between text-sm">
                                        <span>Progress</span>
                                        <span>{project.percentComplete}%</span>
                                    </div>
                                    <Progress value={project.percentComplete} className="h-2" />
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Due Date</span>
                                        <span className="text-sm font-medium">{new Date(project.dueDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Tasks</span>
                                        <span className="text-sm font-medium">{project.tasks.completed}/{project.tasks.total} completed</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Owner</span>
                                        <div className="flex items-center">
                                            <Avatar className="h-6 w-6">
                                                {project.owner.avatar && <AvatarImage src={project.owner.avatar} alt={project.owner.name} />}
                                                <AvatarFallback>{project.owner.initials}</AvatarFallback>
                                            </Avatar>
                                            <span className="ml-2 text-sm font-medium">{project.owner.name}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col items-start gap-4">
                                <div className="flex -space-x-2">
                                    {project.members.map((member, index) => (
                                        <Avatar key={index} className="border-background h-7 w-7 border-2">
                                            {member.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                                            <AvatarFallback>{member.initials}</AvatarFallback>
                                        </Avatar>
                                    ))}
                                    <Button variant="outline" size="icon" className="border-background ml-1 h-7 w-7 rounded-full border-2">
                                        <Plus className="h-3 w-3" />
                                        <span className="sr-only">Add member</span>
                                    </Button>
                                </div>
                                <div className="flex w-full justify-between">
                                    <Badge variant="outline">{project.status === 'active' ? 'Active' : 'Archived'}</Badge>
                                    <Button variant="ghost" size="sm" asChild>
                                        <a href={`/projects/${project.id}`}>
                                            <LayoutGrid className="mr-1 h-4 w-4" />
                                            View
                                        </a>
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                {/* Project Form Dialog */}
                <WorkingProjectForm
                    isOpen={isProjectFormOpen}
                    onClose={() => setIsProjectFormOpen(false)}
                />
            </div>
        </AppLayout>
    );
}
