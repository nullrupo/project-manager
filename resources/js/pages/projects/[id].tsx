import { Head, Link } from '@inertiajs/react';
import { CalendarDays, ChevronDown, Clock, ListTodo, MoreHorizontal, Plus, Settings, Table2, Users } from 'lucide-react';
import { useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import KanbanBoard from '@/components/projects/kanban-board';
import ProjectTable from '@/components/projects/project-table';

interface ProjectProps {
    project: {
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
        members: {
            name: string;
            avatar: string | null;
            initials: string;
        }[];
    };
    tasks: {
        todo: {
            id: number;
            title: string;
            description: string;
            assignee: {
                name: string;
                initials: string;
                avatar?: string | null;
            } | null;
            dueDate: string;
            tags: string[];
        }[];
        doing: {
            id: number;
            title: string;
            description: string;
            assignee: {
                name: string;
                initials: string;
                avatar?: string | null;
            } | null;
            dueDate: string;
            tags: string[];
        }[];
        review: {
            id: number;
            title: string;
            description: string;
            assignee: {
                name: string;
                initials: string;
                avatar?: string | null;
            } | null;
            dueDate: string;
            tags: string[];
        }[];
        done: {
            id: number;
            title: string;
            description: string;
            assignee: {
                name: string;
                initials: string;
                avatar?: string | null;
            } | null;
            dueDate: string;
            tags: string[];
        }[];
    }
}

export default function ProjectDetail({ project, tasks }: ProjectProps) {
    const [activeTab, setActiveTab] = useState('kanban');

    const breadcrumbs = [
        { title: 'Projects', href: '/projects' },
        { title: project.name, href: `/projects/${project.id}` }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={project.name} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Project header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{project.name}</h1>
                        <p className="text-muted-foreground">{project.description}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">
                            <Users className="mr-2 h-4 w-4" />
                            Invite
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Project Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Clock className="mr-2 h-4 w-4" />
                                    View Activity
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Project stats */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="p-4">
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Progress</span>
                            <div className="mt-2 flex items-center gap-2">
                                <Progress value={project.percentComplete} className="h-2 flex-grow" />
                                <span className="text-sm font-medium">{project.percentComplete}%</span>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Due Date</span>
                            <span className="mt-1 text-lg font-medium">{new Date(project.dueDate).toLocaleDateString()}</span>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Tasks</span>
                            <span className="mt-1 text-lg font-medium">{project.tasks.completed}/{project.tasks.total} completed</span>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Team</span>
                            <div className="mt-1 flex -space-x-2">
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
                        </div>
                    </Card>
                </div>

                {/* Project views */}
                <div className="flex items-center justify-between">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="flex items-center justify-between">
                            <TabsList>
                                <TabsTrigger value="kanban">
                                    <ListTodo className="mr-2 h-4 w-4" />
                                    Kanban
                                </TabsTrigger>
                                <TabsTrigger value="table">
                                    <Table2 className="mr-2 h-4 w-4" />
                                    Table
                                </TabsTrigger>
                                <TabsTrigger value="calendar">
                                    <CalendarDays className="mr-2 h-4 w-4" />
                                    Calendar
                                </TabsTrigger>
                            </TabsList>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Task
                            </Button>
                        </div>

                        <TabsContent value="kanban" className="mt-4">
                            <KanbanBoard tasks={tasks} />
                        </TabsContent>

                        <TabsContent value="table" className="mt-4">
                            <ProjectTable tasks={tasks} />
                        </TabsContent>

                        <TabsContent value="calendar" className="mt-4">
                            <div className="flex h-[500px] items-center justify-center rounded-lg border border-dashed">
                                <p className="text-muted-foreground">Calendar view coming soon</p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </AppLayout>
    );
}
