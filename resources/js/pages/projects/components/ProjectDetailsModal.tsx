import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Project } from '@/types/project-manager';
import { Link } from '@inertiajs/react';
import { 
    Settings, 
    Tag, 
    Tags, 
    Users, 
    Calendar, 
    Globe, 
    Shield, 
    Crown,
    ExternalLink,
    Edit
} from 'lucide-react';

interface ProjectDetailsModalProps {
    project: Project;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function ProjectDetailsModal({ project, open, onOpenChange }: ProjectDetailsModalProps) {
    const getProjectIcon = () => {
        if (project.visibility === 'private') {
            return <Shield className="h-5 w-5 text-orange-500" />;
        }
        return <Globe className="h-5 w-5 text-blue-500" />;
    };

    const getProjectBadge = () => {
        if (project.visibility === 'private') {
            return (
                <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                    <Shield className="h-3 w-3 mr-1" />
                    Private
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                <Globe className="h-3 w-3 mr-1" />
                Team
            </Badge>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <Settings className="h-6 w-6" />
                        Project Details & Settings
                    </DialogTitle>
                    <DialogDescription>
                        Manage your project settings and access management tools
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Project Information */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2">
                                {getProjectIcon()}
                                Project Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-lg font-semibold">{project.name}</h3>
                                    {getProjectBadge()}
                                    <Badge variant="secondary" className="text-xs">
                                        {project.key}
                                    </Badge>
                                </div>
                                {project.description && (
                                    <p className="text-muted-foreground">{project.description}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium">Owner:</span>
                                    <div className="flex items-center gap-1 mt-1">
                                        <Crown className="h-4 w-4 text-yellow-500" />
                                        <span>{project.owner?.name}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="font-medium">Created:</span>
                                    <div className="flex items-center gap-1 mt-1">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>{new Date(project.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="font-medium">Members:</span>
                                    <div className="flex items-center gap-1 mt-1">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <span>{project.members?.length || 0} member{(project.members?.length || 0) !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="font-medium">Tasks:</span>
                                    <div className="flex items-center gap-1 mt-1">
                                        <Tag className="h-4 w-4 text-muted-foreground" />
                                        <span>{project.boards?.[0]?.lists?.reduce((acc, list) => acc + (list.tasks?.length || 0), 0) || 0} task{(project.boards?.[0]?.lists?.reduce((acc, list) => acc + (list.tasks?.length || 0), 0) || 0) !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Management Tools */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Management Tools
                            </CardTitle>
                            <CardDescription>
                                Access project management and configuration tools
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* Project Labels */}
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-50">
                                        <Tag className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium">Project Labels</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Manage project-wide labels for task categorization
                                        </p>
                                    </div>
                                </div>
                                <Link href={route('labels.index', { project: project.id })}>
                                    <Button variant="outline" size="sm">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Manage
                                    </Button>
                                </Link>
                            </div>

                            {/* Personal Tags */}
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-green-50">
                                        <Tags className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium">Personal Tags</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Manage your personal GTD context tags
                                        </p>
                                    </div>
                                </div>
                                <Link href={route('tags.manage')}>
                                    <Button variant="outline" size="sm">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Manage
                                    </Button>
                                </Link>
                            </div>

                            <Separator />

                            {/* Project Settings */}
                            {project.can_edit && (
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-purple-50">
                                            <Edit className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium">Project Settings</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Edit project details, permissions, and configuration
                                            </p>
                                        </div>
                                    </div>
                                    <Link href={route('projects.edit', { project: project.id })}>
                                        <Button variant="outline" size="sm">
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Edit
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}
