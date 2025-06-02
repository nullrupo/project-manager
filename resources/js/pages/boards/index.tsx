import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Board, Project } from '@/types/project-manager';
import { Head, Link } from '@inertiajs/react';
import { Plus, Settings, Eye, Lock } from 'lucide-react';

interface BoardsIndexProps {
    project: Project & { can_edit: boolean };
    boards: Board[];
}

export default function BoardsIndex({ project, boards }: BoardsIndexProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Projects',
            href: route('projects.index'),
        },
        {
            title: project.name,
            href: route('projects.show', { project: project.id }),
        },
        {
            title: 'Boards',
            href: route('boards.index', { project: project.id }),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Boards - ${project.name}`} />
            
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold">Boards</h1>
                    <p className="text-muted-foreground">
                        Manage and organize your project boards
                    </p>
                </div>
                {project.can_edit ? (
                    <Link href={route('boards.create', { project: project.id })}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Board
                        </Button>
                    </Link>
                ) : (
                    <Button disabled>
                        <Lock className="mr-2 h-4 w-4" />
                        New Board
                    </Button>
                )}
            </div>

            {boards.length === 0 ? (
                <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No boards found</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Get started by creating your first board.
                    </p>
                    {project.can_edit && (
                        <div className="mt-6">
                            <Link href={route('boards.create', { project: project.id })}>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Board
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {boards.map((board) => (
                        <Card key={board.id} className="group hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-lg font-semibold truncate">
                                            {board.name}
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            {board.description || 'No description'}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link href={route('boards.show', { project: project.id, board: board.id })}>
                                            <Button variant="ghost" size="sm">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        {project.can_edit && (
                                            <Link href={route('boards.edit', { project: project.id, board: board.id })}>
                                                <Button variant="ghost" size="sm">
                                                    <Settings className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span className="capitalize">{board.type} board</span>
                                    <span>{board.lists?.length || 0} lists</span>
                                </div>
                                <div className="mt-4">
                                    <Link href={route('boards.show', { project: project.id, board: board.id })}>
                                        <Button variant="outline" className="w-full">
                                            Open Board
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </AppLayout>
    );
}
