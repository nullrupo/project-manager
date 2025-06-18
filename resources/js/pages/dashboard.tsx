import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type RecentActivity } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { LayoutDashboard, ListTodo, Plus, Users, FolderPlus, PlusCircle, CheckCircle, MessageCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import CreateProjectModal from '@/components/project/CreateProjectModal';

interface DashboardProps {
    recentActivities: RecentActivity[];
}

export default function Dashboard({ recentActivities }: DashboardProps) {
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const getActivityIcon = (iconName: string) => {
        switch (iconName) {
            case 'folder-plus':
                return FolderPlus;
            case 'plus-circle':
                return PlusCircle;
            case 'check-circle':
                return CheckCircle;
            case 'message-circle':
                return MessageCircle;
            default:
                return Clock;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays}d ago`;
        }
    };

    return (
        <AppLayout>
            <Head title="Dashboard" />
            <div className="space-y-6">
                <div className="flex justify-between items-center py-2">
                    <h1 className="text-2xl font-semibold">Dashboard</h1>
                    <div className="relative">
                        <Button className="relative z-10" onClick={() => setCreateModalOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Project
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <LayoutDashboard className="h-5 w-5" />
                                Projects
                            </CardTitle>
                            <CardDescription>Manage your projects</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Create and manage projects, boards, and tasks. Organize your work and collaborate with your team.
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Link href={route('projects.index')} className="w-full">
                                <Button variant="outline" className="w-full">View Projects</Button>
                            </Link>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ListTodo className="h-5 w-5" />
                                My Tasks
                            </CardTitle>
                            <CardDescription>View your assigned tasks</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                See all tasks assigned to you across all projects. Track your progress and stay organized.
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Link href={route('my-tasks')} className="w-full">
                                <Button variant="outline" className="w-full">View My Tasks</Button>
                            </Link>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Team
                            </CardTitle>
                            <CardDescription>Manage your team</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Invite team members, assign roles, and collaborate on projects together.
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Link href={route('team')} className="w-full">
                                <Button variant="outline" className="w-full">Manage Team</Button>
                            </Link>
                        </CardFooter>
                    </Card>
                </div>

                <Card hoverable={false}>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Your recent activity across all projects</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentActivities.length > 0 ? (
                            <div className="space-y-3">
                                {recentActivities.map((activity, index) => {
                                    const IconComponent = getActivityIcon(activity.icon);
                                    return (
                                        <Link key={index} href={activity.link}>
                                            <div className="flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                                                <div className="flex-shrink-0 mt-0.5">
                                                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm">
                                                        <span className="font-medium text-foreground">{activity.user}</span>
                                                        <span className="text-muted-foreground"> {activity.action} </span>
                                                        <span className="font-medium text-foreground">"{activity.target}"</span>
                                                    </div>
                                                    {activity.project && (
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            in {activity.project}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-shrink-0 text-xs text-muted-foreground">
                                                    {formatDate(activity.date)}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>No recent activity</p>
                                <p className="text-sm mt-1">Start by creating a project or task</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <CreateProjectModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
        </AppLayout>
    );
}
