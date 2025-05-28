import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Calendar() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Calendar', href: route('calendar') },
            ]}
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CalendarIcon className="h-8 w-8 text-primary" />
                        <div>
                            <Heading>Calendar</Heading>
                            <p className="text-muted-foreground">
                                View and manage your schedule and deadlines
                            </p>
                        </div>
                    </div>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Event
                    </Button>
                </div>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Calendar View</CardTitle>
                            <CardDescription>
                                Your tasks and events organized by date
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center h-64 text-muted-foreground">
                                <div className="text-center">
                                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Calendar functionality coming soon</p>
                                    <p className="text-sm">This will show your tasks and events in a calendar view</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
