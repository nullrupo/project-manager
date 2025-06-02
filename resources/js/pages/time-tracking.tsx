import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Timer, Play, Pause, Square, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TimeTracking() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Time Tracking', href: route('time-tracking') },
            ]}
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Timer className="h-8 w-8 text-primary" />
                        <div>
                            <Heading>Time Tracking</Heading>
                            <p className="text-muted-foreground">
                                Track time spent on tasks and projects
                            </p>
                        </div>
                    </div>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Timer
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card hoverable={true}>
                        <CardHeader>
                            <CardTitle>Active Timer</CardTitle>
                            <CardDescription>
                                Currently tracking time
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center">
                                <div className="text-4xl font-mono font-bold">00:00:00</div>
                                <p className="text-sm text-muted-foreground mt-2">No active timer</p>
                            </div>
                            <div className="flex justify-center gap-2">
                                <Button size="sm" variant="outline">
                                    <Play className="h-4 w-4 mr-2" />
                                    Start
                                </Button>
                                <Button size="sm" variant="outline" disabled>
                                    <Pause className="h-4 w-4 mr-2" />
                                    Pause
                                </Button>
                                <Button size="sm" variant="outline" disabled>
                                    <Square className="h-4 w-4 mr-2" />
                                    Stop
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Today's Summary</CardTitle>
                            <CardDescription>
                                Time tracked today
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold">0h 0m</div>
                                <p className="text-sm text-muted-foreground mt-2">Total time today</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Billable hours</span>
                                    <span>0h 0m</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Non-billable hours</span>
                                    <span>0h 0m</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Time Entries</CardTitle>
                        <CardDescription>
                            Your latest tracked time
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center h-32 text-muted-foreground">
                            <div className="text-center">
                                <Timer className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>No time entries yet</p>
                                <p className="text-sm">Start tracking time to see your entries here</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
