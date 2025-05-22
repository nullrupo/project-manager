import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Project } from '@/types/project-manager';
import { Head, Link } from '@inertiajs/react';
import { Archive, Edit, Plus, Trash2, Users, ListTodo, Tag } from 'lucide-react';

interface ProjectShowProps {
    project: Project;
}

export default function ProjectShow({ project }: ProjectShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Projects',
            href: route('projects.index'),
        },
        {
            title: project.name,
            href: route('projects.show', { project: project.id }),
        },
    ];

    // Default tab is 'boards'
    const defaultTab = 'boards';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={project.name} />
            <div className="space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-semibold flex flex-wrap items-center gap-2 break-words">
                            <span className="break-words">{project.name}</span>
                            <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full font-medium whitespace-nowrap">
                                {project.key}
                            </span>
                        </h1>
                        {project.description && <p className="text-muted-foreground mt-1">{project.description}</p>}
                    </div>
                    <div className="flex gap-2">
                        <Link href={route('projects.edit', { project: project.id })}>
                            <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        </Link>
                        <Link href={route('projects.destroy', { project: project.id })} method="delete" as="button">
                            <Button variant="destructive" size="sm" className="shadow-sm hover:shadow-md">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Project Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-card/90 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ListTodo className="h-5 w-5 text-primary" />
                                Boards
                            </CardTitle>
                            <CardDescription>Manage your project boards</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Organize your tasks with boards. Create different board types for different workflows.
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Link href="#boards" className="w-full">
                                <Button
                                    variant="outline"
                                    className="w-full shadow-sm hover:shadow-md"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        // Find and click the boards tab using a more specific selector
                                        const boardsTab = document.querySelector('button[value="boards"]') as HTMLElement;
                                        if (boardsTab) {
                                            boardsTab.click();
                                            // Scroll to the boards section
                                            setTimeout(() => {
                                                const boardsContent = document.querySelector('[data-state="active"][value="boards"]');
                                                if (boardsContent) {
                                                    boardsContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                }
                                            }, 100);
                                        } else {
                                            // Fallback method if the button isn't found
                                            const tabsList = document.querySelector('.tabs-list');
                                            if (tabsList) {
                                                const tabs = tabsList.querySelectorAll('button');
                                                // Find the tab with "Boards" text
                                                const boardsTabByText = Array.from(tabs).find(tab =>
                                                    tab.textContent?.includes('Boards')
                                                );
                                                if (boardsTabByText) {
                                                    boardsTabByText.click();
                                                }
                                            }
                                        }
                                    }}
                                >
                                    View Boards
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>

                    <Card className="bg-card/90 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Members
                            </CardTitle>
                            <CardDescription>Manage team members</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Add team members to your project and assign them different roles and permissions.
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Button
                                variant="outline"
                                className="w-full shadow-sm hover:shadow-md"
                                onClick={() => {
                                    // Find the members tab using a more specific selector
                                    const membersTab = document.querySelector('button[value="members"]') as HTMLElement;
                                    if (membersTab) {
                                        // Force a click event
                                        membersTab.click();

                                        // Scroll to the members section after a short delay
                                        setTimeout(() => {
                                            const membersContent = document.querySelector('[data-state="active"][value="members"]');
                                            if (membersContent) {
                                                membersContent.scrollIntoView({
                                                    behavior: 'smooth',
                                                    block: 'start'
                                                });
                                            }
                                        }, 150);
                                    } else {
                                        // Fallback method if the button isn't found
                                        const tabsList = document.querySelector('.tabs-list');
                                        if (tabsList) {
                                            const tabs = tabsList.querySelectorAll('button');
                                            // Find the tab with "Members" text
                                            const membersTabByText = Array.from(tabs).find(tab =>
                                                tab.textContent?.includes('Members')
                                            );
                                            if (membersTabByText) {
                                                membersTabByText.click();
                                            }
                                        }
                                    }
                                }}
                            >
                                Manage Project Members
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="bg-card/90 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Tag className="h-5 w-5 text-primary" />
                                Labels
                            </CardTitle>
                            <CardDescription>Organize with labels</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Create and manage labels to categorize and filter tasks across your project.
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Link href={route('labels.index', { project: project.id })} className="w-full">
                                <Button
                                    variant="outline"
                                    className="w-full shadow-sm hover:shadow-md"
                                >
                                    Manage Labels
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                </div>

                {/* Tabs for Project Content */}
                <Tabs defaultValue={defaultTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 tabs-list">
                        <TabsTrigger value="boards" data-value="boards">Boards</TabsTrigger>
                        <TabsTrigger value="members" data-value="members">Members</TabsTrigger>
                        <TabsTrigger value="details" data-value="details">Details</TabsTrigger>
                    </TabsList>

                    <TabsContent value="boards" className="mt-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-center">
                                    <CardTitle>Project Boards</CardTitle>
                                    <Link href={route('boards.create', { project: project.id })}>
                                        <Button size="sm" className="shadow-sm hover:shadow-md">
                                            <Plus className="h-4 w-4 mr-2" />
                                            New Board
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {project.boards && project.boards.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {project.boards.map((board) => (
                                            <div key={board.id}>
                                                <Link href={route('boards.show', { project: project.id, board: board.id })} className="block">
                                                    <Card className="bg-card/80 backdrop-blur-sm hover:shadow-md transition-all duration-200">
                                                        <CardHeader className="pb-2">
                                                            <CardTitle className="text-lg">{board.name}</CardTitle>
                                                            <CardDescription>
                                                                {board.type.charAt(0).toUpperCase() + board.type.slice(1)} board
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent>
                                                            {board.description && (
                                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                                    {board.description}
                                                                </p>
                                                            )}
                                                        </CardContent>
                                                        <CardFooter className="text-sm text-muted-foreground">
                                                            {board.lists?.length || 0} list{(board.lists?.length || 0) !== 1 ? 's' : ''}
                                                        </CardFooter>
                                                    </Card>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 p-8">
                                        <p className="text-muted-foreground mb-4">No boards found</p>
                                        <Link href={route('boards.create', { project: project.id })} className="inline-block">
                                            <Button size="sm" className="shadow-sm hover:shadow-md">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Create Board
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="members" className="mt-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-center">
                                    <CardTitle>Project Members</CardTitle>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="shadow-sm hover:shadow-md"
                                        onClick={() => {
                                            alert('Invite Members functionality will be implemented soon.');
                                        }}
                                    >
                                        <Users className="h-4 w-4 mr-2" />
                                        Invite Members
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {project.members && project.members.length > 0 ? (
                                    <div className="space-y-2 divide-y">
                                        {project.members.map((member) => (
                                            <div key={member.id} className="flex items-center justify-between p-4 bg-card/80 backdrop-blur-sm rounded-lg my-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                                                        {member.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{member.name}</p>
                                                        <p className="text-sm text-muted-foreground">{member.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                                        {member.role || 'Member'}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="rounded-full"
                                                        onClick={() => {
                                                            alert('Edit member functionality will be implemented soon.');
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 p-8">
                                        <p className="text-muted-foreground mb-4">No members found</p>
                                        <Button
                                            size="sm"
                                            className="shadow-sm hover:shadow-md"
                                            onClick={() => {
                                                alert('Invite Team Members functionality will be implemented soon.');
                                            }}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Invite Team Members
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="details" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Project Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4 bg-card/80 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                                        <div>
                                            <h4 className="text-sm font-medium text-primary">Project Key</h4>
                                            <p className="text-sm">{project.key}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-primary">Owner</h4>
                                            <p className="text-sm">{project.owner?.name}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-primary">Created</h4>
                                            <p className="text-sm">
                                                {new Date(project.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 bg-card/80 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                                        <div>
                                            <h4 className="text-sm font-medium text-primary">Visibility</h4>
                                            <p className="text-sm">
                                                {project.is_public ? 'Public' : 'Private'}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-primary">Status</h4>
                                            <p className="text-sm">
                                                {project.is_archived ? 'Archived' : 'Active'}
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-medium text-primary">Description</h4>
                                            <p className="text-sm">
                                                {project.description || 'No description provided'}
                                            </p>
                                        </div>
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
