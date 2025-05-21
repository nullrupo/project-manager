import { Head } from '@inertiajs/react';
import { Users, Search, Plus, Mail, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';

const breadcrumbs = [
    { title: 'Team', href: '/team' }
];

interface TeamMember {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
    initials: string;
    xp: number;
    level: number;
    projects: string[];
    tasksCompleted: number;
    tasksInProgress: number;
}

interface TeamProps {
    teamMembers: TeamMember[];
}

export default function TeamPage({ teamMembers }: TeamProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredMembers = teamMembers.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.projects.some(project => project.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Team" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Team header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Team</h1>
                        <p className="text-muted-foreground">Manage your team members and their roles</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search team members..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button onClick={() => window.location.href = '/settings/users'}>
                            <Plus className="mr-1 h-4 w-4" />
                            Add Member
                        </Button>
                    </div>
                </div>

                {/* Team stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle>Team Size</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <span className="text-2xl font-bold">{teamMembers.length}</span>
                                <span className="text-muted-foreground">members</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle>Tasks Completed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold">
                                    {teamMembers.reduce((total, member) => total + member.tasksCompleted, 0)}
                                </span>
                                <span className="text-muted-foreground">total tasks</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle>Average Level</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold">
                                    {Math.round(teamMembers.reduce((total, member) => total + member.level, 0) / teamMembers.length)}
                                </span>
                                <span className="text-muted-foreground">average level</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Team members list */}
                <Card>
                    <CardHeader>
                        <CardTitle>Team Members</CardTitle>
                        <CardDescription>Manage your team and their roles</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {filteredMembers.map((member) => (
                                <div key={member.id} className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start">
                                    <Avatar className="h-12 w-12">
                                        {member.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                                        <AvatarFallback>{member.initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-grow space-y-2">
                                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                                            <div>
                                                <h3 className="font-medium">{member.name}</h3>
                                                <p className="text-sm text-muted-foreground">{member.email}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">{member.role}</Badge>
                                                <Button variant="outline" size="icon">
                                                    <Mail className="h-4 w-4" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                                                        <DropdownMenuItem>Edit Role</DropdownMenuItem>
                                                        <DropdownMenuItem>Assign to Project</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <div className="mb-1 flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Level {member.level}</span>
                                                    <span>{member.xp} XP</span>
                                                </div>
                                                <Progress value={80} className="h-2" />
                                            </div>
                                            <div>
                                                <div className="mb-1 flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Tasks</span>
                                                    <span>{member.tasksCompleted} completed, {member.tasksInProgress} in progress</span>
                                                </div>
                                                <Progress
                                                    value={(member.tasksCompleted / (member.tasksCompleted + member.tasksInProgress)) * 100}
                                                    className="h-2"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-sm text-muted-foreground">Projects: </span>
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {member.projects.map((project, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                        {project}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
