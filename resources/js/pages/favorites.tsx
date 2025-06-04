import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Star, Search, Filter, Heart, ExternalLink, Calendar, User, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { onFavoriteUpdated } from '@/utils/favorites-events';
import { useShortName } from '@/hooks/use-initials';

interface FavoriteItem {
    id: number;
    title: string;
    description?: string;
    created_at: string;
    type: string;
    url: string;
    key?: string;
    owner?: string;
    background_color?: string;
    priority?: string;
    status?: string;
    due_date?: string;
    project?: string;
}

interface FavoritesData {
    projects: FavoriteItem[];
    tasks: FavoriteItem[];
    documents: FavoriteItem[];
}

interface FavoritesProps {
    favorites: FavoritesData;
    totalCount: number;
}

export default function Favorites({ favorites, totalCount }: FavoritesProps) {
    const getShortName = useShortName();
    const [searchTerm, setSearchTerm] = useState('');

    // Listen for favorite updates and refresh the page data
    useEffect(() => {
        const unsubscribe = onFavoriteUpdated(() => {
            // Reload the favorites data when any favorite is updated
            router.reload({ only: ['favorites', 'totalCount'] });
        });

        return unsubscribe;
    }, []);
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
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                                <CardTitle>All Favorites ({totalCount})</CardTitle>
                                <CardDescription>
                                    All your starred items in one place
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {totalCount === 0 ? (
                                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                                        <div className="text-center">
                                            <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>No favorites yet</p>
                                            <p className="text-sm">Star items to add them to your favorites</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Projects */}
                                        {favorites.projects.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground mb-3">Projects</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {favorites.projects.map((project) => (
                                                        <Link key={project.id} href={project.url}>
                                                            <Card className="hover:shadow-md transition-shadow">
                                                                <CardHeader className="pb-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <div
                                                                                className="w-4 h-4 rounded"
                                                                                style={{ backgroundColor: project.background_color || '#3498db' }}
                                                                            />
                                                                            <CardTitle className="text-base">{project.title}</CardTitle>
                                                                        </div>
                                                                    </div>
                                                                    {project.description && (
                                                                        <CardDescription className="text-sm">
                                                                            {project.description}
                                                                        </CardDescription>
                                                                    )}
                                                                </CardHeader>
                                                                <CardContent className="pt-0">
                                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                        <User className="h-3 w-3" />
                                                                        <span>{getShortName(project.owner)}</span>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Tasks */}
                                        {favorites.tasks.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground mb-3">Tasks</h4>
                                                <div className="space-y-3">
                                                    {favorites.tasks.map((task) => (
                                                        <Link key={task.id} href={task.url}>
                                                            <Card className="hover:shadow-md transition-shadow">
                                                                <CardContent className="p-4">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex-1">
                                                                            <h5 className="font-medium">{task.title}</h5>
                                                                            {task.description && (
                                                                                <p className="text-sm text-muted-foreground mt-1">
                                                                                    {task.description}
                                                                                </p>
                                                                            )}
                                                                            <div className="flex items-center gap-4 mt-2">
                                                                                <Badge variant="outline" className="text-xs">
                                                                                    {task.priority}
                                                                                </Badge>
                                                                                <Badge variant="secondary" className="text-xs">
                                                                                    {task.status}
                                                                                </Badge>
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    {task.project}
                                                                                </span>
                                                                                {task.due_date && (
                                                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                                        <Calendar className="h-3 w-3" />
                                                                                        <span>{new Date(task.due_date).toLocaleDateString()}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="projects" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Favorite Projects ({favorites.projects.length})</CardTitle>
                                <CardDescription>
                                    Projects you've marked as favorites
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {favorites.projects.length === 0 ? (
                                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                                        <div className="text-center">
                                            <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>No favorite projects</p>
                                            <p className="text-sm">Star projects to see them here</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {favorites.projects.map((project) => (
                                            <Link key={project.id} href={project.url}>
                                                <Card className="hover:shadow-md transition-shadow">
                                                    <CardHeader className="pb-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div
                                                                    className="w-4 h-4 rounded"
                                                                    style={{ backgroundColor: project.background_color || '#3498db' }}
                                                                />
                                                                <CardTitle className="text-base">{project.title}</CardTitle>
                                                            </div>
                                                        </div>
                                                        {project.description && (
                                                            <CardDescription className="text-sm">
                                                                {project.description}
                                                            </CardDescription>
                                                        )}
                                                    </CardHeader>
                                                    <CardContent className="pt-0">
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <User className="h-3 w-3" />
                                                            <span>{getShortName(project.owner)}</span>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="tasks" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Favorite Tasks ({favorites.tasks.length})</CardTitle>
                                <CardDescription>
                                    Tasks you've marked as favorites
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {favorites.tasks.length === 0 ? (
                                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                                        <div className="text-center">
                                            <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>No favorite tasks</p>
                                            <p className="text-sm">Star tasks to see them here</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {favorites.tasks.map((task) => (
                                            <Link key={task.id} href={task.url}>
                                                <Card className="hover:shadow-md transition-shadow">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1">
                                                                <h5 className="font-medium">{task.title}</h5>
                                                                {task.description && (
                                                                    <p className="text-sm text-muted-foreground mt-1">
                                                                        {task.description}
                                                                    </p>
                                                                )}
                                                                <div className="flex items-center gap-4 mt-2">
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {task.priority}
                                                                    </Badge>
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        {task.status}
                                                                    </Badge>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {task.project}
                                                                    </span>
                                                                    {task.due_date && (
                                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                            <Calendar className="h-3 w-3" />
                                                                            <span>{new Date(task.due_date).toLocaleDateString()}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        ))}
                                    </div>
                                )}
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
