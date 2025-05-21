import { Head } from '@inertiajs/react';
import { CalendarDays, CheckCircle, Clock, Inbox, LayoutGrid, ListTodo, Plus, Search, Users } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import { useState, useEffect } from 'react';
import axios from 'axios';
import taskService from '@/services/taskService';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import WorkingTaskForm from '@/components/projects/working-task-form';
import SimpleButton from '@/components/simple-button';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' }
];

interface DashboardProps {
    recentProjects: {
        id: number;
        name: string;
        percentComplete: number;
        dueDate: string;
    }[];
    upcomingTasks: {
        id: number;
        title: string;
        project: string;
        dueDate: string;
        status: string;
    }[];
    teamMembers: {
        name: string;
        avatar: string | null;
        initials: string;
        xp: number;
        level: number;
    }[];
    userStats: {
        tasksCompleted: number;
        xpEarned: number;
        currentLevel: number;
        nextLevelProgress: number;
    };
}

export default function Dashboard({
    recentProjects,
    upcomingTasks,
    teamMembers,
    userStats
}: DashboardProps) {
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
    const [availableTags, setAvailableTags] = useState<{ id: number; name: string; color: string }[]>([]);
    const [projectMembers, setProjectMembers] = useState<{ id: number; name: string }[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

    // Fetch available tags
    useEffect(() => {
        axios.get('/tags')
            .then(response => {
                setAvailableTags(response.data);
            })
            .catch(error => {
                console.error('Error fetching tags:', error);
            });
    }, []);

    // When a project is selected for a new task, fetch its members
    useEffect(() => {
        if (selectedProjectId && recentProjects.length > 0) {
            // For simplicity, we'll just use the first project's members
            // In a real app, you would fetch the members for the selected project
            const projectId = recentProjects[0].id;

            axios.get(`/projects/${projectId}`)
                .then(response => {
                    if (response.data && response.data.project && response.data.project.members) {
                        setProjectMembers(response.data.project.members);
                    }
                })
                .catch(error => {
                    console.error('Error fetching project members:', error);
                });
        }
    }, [selectedProjectId, recentProjects]);

    const handleAddTask = () => {
        // Set the first project as selected by default
        if (recentProjects.length > 0) {
            setSelectedProjectId(recentProjects[0].id);
        }
        setIsTaskFormOpen(true);
    };

    const handleTaskSubmit = async (taskData: any) => {
        try {
            await taskService.createTask({
                project_id: taskData.projectId,
                parent_task_id: taskData.parentTaskId || null,
                title: taskData.title,
                description: taskData.description || null,
                assignee_id: taskData.assigneeId || null,
                reviewer_id: taskData.reviewerId || null,
                due_date: taskData.dueDate || null,
                status: taskData.status || 'todo',
                tags: taskData.tags || []
            });

            // Close the form and refresh the page to show the new task
            setIsTaskFormOpen(false);
            window.location.reload();
        } catch (error) {
            console.error('Error creating task:', error);
            alert('Failed to create task. Please try again.');
        }
    };
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Welcome section */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold">Welcome back!</h1>
                    <p className="text-muted-foreground">Here's what's happening with your projects today.</p>
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
                        <a href="/projects">
                            <LayoutGrid className="mr-2 h-4 w-4" />
                            Projects
                        </a>
                    </Button>
                </div>

                {/* Main content */}
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Left column */}
                    <div className="col-span-2 flex flex-col gap-4">
                        {/* Recent projects */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle>Recent Projects</CardTitle>
                                    <CardDescription>Your recently active projects</CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                    <a href="/projects">View all</a>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentProjects.map((project) => (
                                        <div key={project.id} className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <a href={`/projects/${project.id}`} className="font-medium hover:text-primary">
                                                    {project.name}
                                                </a>
                                                <span className="text-sm text-muted-foreground">
                                                    Due {new Date(project.dueDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Progress value={project.percentComplete} className="h-2 flex-grow" />
                                                <span className="text-sm font-medium">{project.percentComplete}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Upcoming tasks */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle>Upcoming Tasks</CardTitle>
                                    <CardDescription>Tasks due in the next 7 days</CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                    <a href="/my-tasks">View all</a>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {upcomingTasks.map((task) => (
                                        <div key={task.id} className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium">{task.title}</div>
                                                <div className="text-sm text-muted-foreground">{task.project}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        task.status === 'todo' ? 'bg-gray-100 dark:bg-gray-800' :
                                                        task.status === 'doing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                                        task.status === 'review' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                                                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                    }
                                                >
                                                    {task.status === 'todo' ? 'Todo' :
                                                     task.status === 'doing' ? 'In Progress' :
                                                     task.status === 'review' ? 'Review' : 'Done'}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground">
                                                    {new Date(task.dueDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    onClick={handleAddTask}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add New Task
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* Right column */}
                    <div className="flex flex-col gap-4">
                        {/* Your stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Your Stats</CardTitle>
                                <CardDescription>Your personal productivity metrics</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Tasks Completed</span>
                                    <span className="font-medium">{userStats.tasksCompleted}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">XP Earned</span>
                                    <span className="font-medium">{userStats.xpEarned.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Current Level</span>
                                    <span className="font-medium">{userStats.currentLevel}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Next Level</span>
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs text-muted-foreground">
                                            {100 - (userStats.nextLevelProgress % 100)} XP needed
                                        </span>
                                        <Progress value={userStats.nextLevelProgress} className="h-2 w-24" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Team leaderboard */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Team Leaderboard</CardTitle>
                                <CardDescription>Top performers this month</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {teamMembers.sort((a, b) => b.xp - a.xp).map((member, index) => (
                                    <div key={member.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{index + 1}</span>
                                            <Avatar className="h-8 w-8">
                                                {member.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                                                <AvatarFallback>{member.initials}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{member.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium">{member.xp} XP</div>
                                            <div className="text-xs text-muted-foreground">Level {member.level}</div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Task Form Dialog */}
                {selectedProjectId && (
                    <WorkingTaskForm
                        isOpen={isTaskFormOpen}
                        onClose={() => setIsTaskFormOpen(false)}
                        projectId={selectedProjectId}
                        projectMembers={projectMembers}
                        availableTags={availableTags}
                        onSubmit={handleTaskSubmit}
                    />
                )}
            </div>
        </AppLayout>
    );
}
