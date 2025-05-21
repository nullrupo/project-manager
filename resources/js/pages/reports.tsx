import { Head } from '@inertiajs/react';
import { BarChart3, LineChart, PieChart, Download, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const breadcrumbs = [
    { title: 'Reports', href: '/reports' }
];

interface ProjectCompletion {
    project: string;
    completed: number;
    total: number;
}

interface TeamPerformance {
    name: string;
    tasksCompleted: number;
    xpEarned: number;
}

interface TaskStatusDistribution {
    todo: number;
    doing: number;
    review: number;
    done: number;
}

interface ReportsProps {
    projectCompletionData: ProjectCompletion[];
    teamPerformanceData: TeamPerformance[];
    taskStatusDistribution: TaskStatusDistribution;
}

export default function ReportsPage({
    projectCompletionData,
    teamPerformanceData,
    taskStatusDistribution
}: ReportsProps) {
    const [activeTab, setActiveTab] = useState('overview');
    const [timeRange, setTimeRange] = useState('month');
    const [isLoading, setIsLoading] = useState(false);

    // Fetch data when time range changes
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`/reports?timeRange=${timeRange}`);
                if (response.data) {
                    // The page will reload with the new data
                    window.location.href = `/reports?timeRange=${timeRange}`;
                }
            } catch (error) {
                console.error('Error fetching reports data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        // Only fetch if the time range changes after initial load
        if (timeRange !== 'month') {
            fetchData();
        }
    }, [timeRange]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Reports header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Reports</h1>
                        <p className="text-muted-foreground">Analytics and performance metrics</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select time range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="week">Last 7 days</SelectItem>
                                <SelectItem value="month">Last 30 days</SelectItem>
                                <SelectItem value="quarter">Last 90 days</SelectItem>
                                <SelectItem value="year">Last 12 months</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline">
                            <Filter className="mr-1 h-4 w-4" />
                            Filter
                        </Button>
                        <Button variant="outline">
                            <Download className="mr-1 h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Loading overlay */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                        <div className="text-center">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                            <p className="mt-2 text-sm text-muted-foreground">Loading reports...</p>
                        </div>
                    </div>
                )}

                {/* Report tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList>
                        <TabsTrigger value="overview">
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="projects">
                            <LineChart className="mr-2 h-4 w-4" />
                            Projects
                        </TabsTrigger>
                        <TabsTrigger value="team">
                            <PieChart className="mr-2 h-4 w-4" />
                            Team
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview tab */}
                    <TabsContent value="overview" className="mt-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Task Status Distribution</CardTitle>
                                    <CardDescription>Current status of all tasks</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex h-[200px] items-center justify-center">
                                        <div className="flex w-full max-w-xs flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-3 w-3 rounded-full bg-gray-300"></div>
                                                    <span>Todo</span>
                                                </div>
                                                <span>{taskStatusDistribution.todo}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-3 w-3 rounded-full bg-blue-400"></div>
                                                    <span>In Progress</span>
                                                </div>
                                                <span>{taskStatusDistribution.doing}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                                                    <span>Review</span>
                                                </div>
                                                <span>{taskStatusDistribution.review}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-3 w-3 rounded-full bg-green-400"></div>
                                                    <span>Done</span>
                                                </div>
                                                <span>{taskStatusDistribution.done}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Project Completion</CardTitle>
                                    <CardDescription>Progress across all projects</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex h-[200px] items-center justify-center">
                                        <div className="w-full space-y-4">
                                            {projectCompletionData.map((project) => (
                                                <div key={project.project} className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium">{project.project}</span>
                                                        <span className="text-sm text-muted-foreground">
                                                            {project.completed}/{project.total} tasks
                                                        </span>
                                                    </div>
                                                    <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                                        <div
                                                            className="h-2 rounded-full bg-primary"
                                                            style={{ width: `${(project.completed / project.total) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="md:col-span-2 lg:col-span-1">
                                <CardHeader>
                                    <CardTitle>Team Performance</CardTitle>
                                    <CardDescription>Tasks completed by team members</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex h-[200px] items-center justify-center">
                                        <div className="w-full space-y-4">
                                            {teamPerformanceData.map((member) => (
                                                <div key={member.name} className="flex items-center justify-between">
                                                    <span className="font-medium">{member.name}</span>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-sm text-muted-foreground">
                                                            {member.tasksCompleted} tasks
                                                        </span>
                                                        <span className="text-sm text-muted-foreground">
                                                            {member.xpEarned} XP
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Projects tab */}
                    <TabsContent value="projects" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Project Analytics</CardTitle>
                                <CardDescription>Detailed project performance metrics</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex h-[400px] items-center justify-center">
                                    <p className="text-muted-foreground">Project analytics charts coming soon</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Team tab */}
                    <TabsContent value="team" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Team Analytics</CardTitle>
                                <CardDescription>Detailed team performance metrics</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex h-[400px] items-center justify-center">
                                    <p className="text-muted-foreground">Team analytics charts coming soon</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
