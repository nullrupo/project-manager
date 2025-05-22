import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { LayoutDashboard, ListTodo, Plus, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
    },
];

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-semibold">Dashboard</h1>
                    <Link href={route('projects.create')}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Project
                        </Button>
                    </Link>
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

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Your recent activity across all projects</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No recent activity</p>
                            <p className="text-sm mt-1">Start by creating a project or task</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
