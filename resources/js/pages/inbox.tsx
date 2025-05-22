import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Inbox, Plus } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inbox',
        href: route('inbox'),
    },
];

export default function InboxPage() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inbox" />
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-semibold flex items-center gap-2">
                            <Inbox className="h-6 w-6 text-primary" />
                            <span>Inbox</span>
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage tasks that are not associated with any specific project
                        </p>
                    </div>
                    <Button className="shadow-sm hover:shadow-md">
                        <Plus className="h-4 w-4 mr-2" />
                        New Task
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Inbox Tasks</CardTitle>
                        <CardDescription>
                            Tasks that are not associated with any specific project
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12">
                            <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground mb-4">No inbox tasks found</p>
                            <Button 
                                size="sm" 
                                className="shadow-sm hover:shadow-md"
                                onClick={() => {
                                    alert('Create Task functionality will be implemented soon.');
                                }}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Task
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
