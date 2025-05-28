import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Star, Search, Filter, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Favorites() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Favorites', href: route('favorites') },
            ]}
        >
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Star className="h-8 w-8 text-primary" />
                    <div>
                        <Heading>Favorites</Heading>
                        <p className="text-muted-foreground">
                            Quick access to your most important items
                        </p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search favorites..."
                            className="pl-10"
                        />
                    </div>
                    <Button variant="outline">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                </div>

                <Tabs defaultValue="all" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="all">All Favorites</TabsTrigger>
                        <TabsTrigger value="projects">Projects</TabsTrigger>
                        <TabsTrigger value="tasks">Tasks</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>All Favorites</CardTitle>
                                <CardDescription>
                                    All your starred items in one place
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-center h-64 text-muted-foreground">
                                    <div className="text-center">
                                        <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No favorites yet</p>
                                        <p className="text-sm">Star items to add them to your favorites</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="projects" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Favorite Projects</CardTitle>
                                <CardDescription>
                                    Projects you've marked as favorites
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-center h-64 text-muted-foreground">
                                    <div className="text-center">
                                        <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No favorite projects</p>
                                        <p className="text-sm">Star projects to see them here</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="tasks" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Favorite Tasks</CardTitle>
                                <CardDescription>
                                    Tasks you've marked as favorites
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-center h-64 text-muted-foreground">
                                    <div className="text-center">
                                        <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No favorite tasks</p>
                                        <p className="text-sm">Star tasks to see them here</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="documents" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Favorite Documents</CardTitle>
                                <CardDescription>
                                    Documents you've marked as favorites
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-center h-64 text-muted-foreground">
                                    <div className="text-center">
                                        <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No favorite documents</p>
                                        <p className="text-sm">Star documents to see them here</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
