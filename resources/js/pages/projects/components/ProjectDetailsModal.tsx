import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Project } from '@/types/project-manager';
import { Link, router, useForm } from '@inertiajs/react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { type SharedData } from '@/types';
import InputError from '@/components/input-error';
import {
    Settings,
    Tag,
    Users,
    Calendar,
    Crown,
    ExternalLink,
    Edit,
    Trash2,
    Save,
    X,
    LoaderCircle
} from 'lucide-react';
import { useAuth } from '../../../app';

interface ProjectDetailsModalProps {
    project: Project;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function ProjectDetailsModal({ project, open, onOpenChange }: ProjectDetailsModalProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const { user, isAuthenticated } = useAuth();

    // Check if current user is the project owner
    const isProjectOwner = user && user.id === project.owner_id;

    // Form for editing project
    const { data, setData, put, processing, errors, reset } = useForm({
        name: project.name,
        description: project.description || '',
        background_color: project.background_color || '#3498db',
        completion_behavior: project.completion_behavior || 'simple',
        requires_review: project.requires_review || false,
        default_reviewer_id: project.default_reviewer_id?.toString() || 'none',
        enable_multiple_boards: project.enable_multiple_boards || false,
        is_archived: project.is_archived || false,
    });

    // Get project members for reviewer selection
    const members = project.members || [];

    const handleSave = () => {
        put(route('projects.update', project.id), {
            onSuccess: () => {
                setIsEditing(false);
            }
        });
    };

    const handleCancel = () => {
        reset();
        setIsEditing(false);
    };

    const handleDeleteProject = () => {
        router.delete(route('projects.destroy', { project: project.id }), {
            onSuccess: () => {
                onOpenChange(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="flex items-center gap-3">
                                <Settings className="h-6 w-6" />
                                Project Details & Settings
                            </DialogTitle>
                            <DialogDescription>
                                Manage your project settings and access management tools
                            </DialogDescription>
                        </div>
                        {project.can_edit && !isEditing && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditing(true)}
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        )}
                        {isEditing && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancel}
                                    disabled={processing}
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={processing}
                                >
                                    {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="h-4 w-4 mr-2" />
                                    Save
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Project Information */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Project Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Project Name</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <textarea
                                            id="description"
                                            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Enter project description..."
                                        />
                                        <InputError message={errors.description} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="background_color">Background Color</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="background_color"
                                                type="color"
                                                className="w-12 h-10 p-1"
                                                value={data.background_color}
                                                onChange={(e) => setData('background_color', e.target.value)}
                                            />
                                            <Input
                                                type="text"
                                                value={data.background_color}
                                                onChange={(e) => setData('background_color', e.target.value)}
                                            />
                                        </div>
                                        <InputError message={errors.background_color} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="archived">Archived</Label>
                                        <Checkbox
                                            id="archived"
                                            checked={!!data.is_archived}
                                            onCheckedChange={checked => setData('is_archived', !!checked)}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="mb-2 flex items-center gap-2">
                                        <h3 className="text-lg font-semibold">{project.name}</h3>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${project.is_team_project ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{project.is_team_project ? 'Team' : 'Personal'}</span>
                                    </div>
                                    {project.description && (
                                        <p className="text-muted-foreground">{project.description}</p>
                                    )}
                                </div>
                            )}

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

                    {/* Project Settings */}
                    {isEditing && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    Project Settings
                                </CardTitle>
                                <CardDescription>
                                    Configure task completion behavior and review settings
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="completion_behavior" className="text-sm font-medium">Task Completion Behavior</Label>
                                    <select
                                        id="completion_behavior"
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        value={data.completion_behavior}
                                        onChange={(e) => setData('completion_behavior', e.target.value as 'simple' | 'review' | 'custom')}
                                    >
                                        <option value="simple">Simple (To Do ↔ Done)</option>
                                        <option value="review">Review Workflow (To Do → Review → Done)</option>
                                        <option value="custom">Custom (Advanced)</option>
                                    </select>
                                    <p className="text-xs text-muted-foreground">
                                        {data.completion_behavior === 'simple' && 'Tasks can be marked as done directly. Best for personal projects.'}
                                        {data.completion_behavior === 'review' && 'Tasks go through a review process before being marked as done. Best for team projects.'}
                                        {data.completion_behavior === 'custom' && 'Advanced completion workflow with custom statuses.'}
                                    </p>
                                    <InputError message={errors.completion_behavior} />
                                </div>

                                {data.completion_behavior === 'review' && (
                                    <>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="requires_review"
                                                checked={data.requires_review}
                                                onCheckedChange={(checked) => setData('requires_review', !!checked)}
                                            />
                                            <Label htmlFor="requires_review" className="text-sm">
                                                Require review approval for task completion
                                            </Label>
                                            <InputError message={errors.requires_review} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="default_reviewer_id" className="text-sm font-medium">Default Reviewer</Label>
                                            <Select
                                                value={data.default_reviewer_id}
                                                onValueChange={(value) => setData('default_reviewer_id', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a default reviewer" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">No default reviewer</SelectItem>
                                                    {members.map((member) => (
                                                        <SelectItem key={member.id} value={member.id.toString()}>
                                                            {member.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">
                                                Tasks will be assigned to this reviewer by default when submitted for review.
                                                Individual tasks can override this setting.
                                            </p>
                                            <InputError message={errors.default_reviewer_id} />
                                        </div>
                                    </>
                                )}

                                <Separator />

                                {/* Multiple Boards Feature */}
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="enable_multiple_boards"
                                            checked={data.enable_multiple_boards}
                                            onCheckedChange={(checked) => setData('enable_multiple_boards', !!checked)}
                                        />
                                        <Label htmlFor="enable_multiple_boards" className="text-sm font-medium">
                                            Enable Multiple Boards
                                        </Label>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Allow this project to have multiple boards for different workflows or team organization.
                                        When enabled, you can create additional boards and switch between them.
                                    </p>
                                    <InputError message={errors.enable_multiple_boards} />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Management Tools */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2">
                                <Tag className="h-5 w-5" />
                                Management Tools
                            </CardTitle>
                            <CardDescription>
                                Access project management tools
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

                            {/* Delete Project */}
                            {isProjectOwner && (
                                <>
                                    <Separator />
                                    <div className="flex items-center justify-between p-3 border border-destructive/20 rounded-lg bg-destructive/5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-red-50">
                                                <Trash2 className="h-5 w-5 text-red-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-destructive">Delete Project</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Permanently delete this project and all its data
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => setShowDeleteConfirm(true)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                title="Delete Project"
                description={`Are you sure you want to delete "${project.name}"? This action cannot be undone and will permanently delete all tasks, boards, and data associated with this project.`}
                confirmText="Delete Project"
                cancelText="Cancel"
                onConfirm={handleDeleteProject}
                variant="destructive"
            />
        </Dialog>
    );
}
