import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Project } from '@/types/project-manager';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Crown, Lock, Settings, Trash2, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import InviteMemberModal from '@/components/invite-member-modal';

interface MembersIndexProps {
    project: Project;
}

export default function MembersIndex({ project }: MembersIndexProps) {
    const { auth } = usePage<SharedData>().props;
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<any>(null);

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
            title: 'Members',
            href: route('projects.members.index', { project: project.id }),
        },
    ];

    const handleDeleteMember = () => {
        if (memberToDelete) {
            router.delete(route('projects.members.destroy', { project: project.id, user: memberToDelete.id }));
            setMemberToDelete(null);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Members - ${project.name}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('projects.show', { project: project.id })}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Project
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Users className="h-6 w-6" />
                                Project Members
                            </h1>
                            <p className="text-muted-foreground">Manage who has access to {project.name} and their roles</p>
                        </div>
                    </div>
                    {project.can_manage_members ? (
                        <Button
                            className="shadow-sm hover:shadow-md"
                            onClick={() => setInviteModalOpen(true)}
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Invite Members
                        </Button>
                    ) : (
                        <Button disabled className="shadow-sm">
                            <Lock className="h-4 w-4 mr-2" />
                            Invite Members
                        </Button>
                    )}
                </div>

                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl">Team Members ({project.members?.length || 0})</CardTitle>
                                <CardDescription className="mt-1">
                                    People who have access to this project and their permission levels
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {project.members && project.members.length > 0 ? (
                            <div className="divide-y divide-border">
                                {project.members.map((member) => (
                                    <div key={member.id} className="p-6 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage src={member.avatar} />
                                                    <AvatarFallback className="text-sm font-medium">
                                                        {member.name.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-base">{member.name}</p>
                                                        {member.id === project.owner_id && (
                                                            <div className="flex items-center gap-1">
                                                                <Crown className="h-4 w-4 text-yellow-500" />
                                                                <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-full">
                                                                    Project Owner
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">{member.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-3">
                                                <div className="flex items-center gap-3">
                                                    <Badge
                                                        variant={member.id === project.owner_id ? "default" : "secondary"}
                                                        className="text-xs font-medium"
                                                    >
                                                        {member.id === project.owner_id ? 'Owner' : (member.pivot?.role || 'Member')}
                                                    </Badge>
                                                    {project.can_manage_members && member.id !== project.owner_id ? (
                                                        <div className="flex items-center gap-1">
                                                            <Link href={route('projects.members.edit', { project: project.id, user: member.id })}>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                                                                    title="Manage permissions"
                                                                >
                                                                    <Settings className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                title="Remove member"
                                                                onClick={() => {
                                                                    setMemberToDelete(member);
                                                                    setDeleteDialogOpen(true);
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ) : member.id !== project.owner_id ? (
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                                disabled
                                                                title="No permission to manage"
                                                            >
                                                                <Lock className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                                disabled
                                                                title="No permission to remove"
                                                            >
                                                                <Lock className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ) : null}
                                                </div>

                                                {/* Show individual permissions for non-owners */}
                                                {member.id !== project.owner_id && member.pivot && (
                                                    <div className="flex flex-wrap gap-1 justify-end">
                                                        {member.pivot.can_manage_members && (
                                                            <Badge variant="outline" className="text-xs px-2 py-1">
                                                                Members
                                                            </Badge>
                                                        )}
                                                        {member.pivot.can_manage_boards && (
                                                            <Badge variant="outline" className="text-xs px-2 py-1">
                                                                Boards
                                                            </Badge>
                                                        )}
                                                        {member.pivot.can_manage_tasks && (
                                                            <Badge variant="outline" className="text-xs px-2 py-1">
                                                                Tasks
                                                            </Badge>
                                                        )}
                                                        {member.pivot.can_manage_labels && (
                                                            <Badge variant="outline" className="text-xs px-2 py-1">
                                                                Labels
                                                            </Badge>
                                                        )}
                                                        {member.pivot.can_comment && (
                                                            <Badge variant="outline" className="text-xs px-2 py-1">
                                                                Comment
                                                            </Badge>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Show all permissions for owners */}
                                                {member.id === project.owner_id && (
                                                    <div className="flex flex-wrap gap-1 justify-end">
                                                        <Badge variant="outline" className="text-xs px-2 py-1 bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300">
                                                            All Permissions
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 px-6">
                                <div className="max-w-sm mx-auto">
                                    <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-foreground mb-2">No team members yet</h3>
                                    <p className="text-sm text-muted-foreground mb-6">
                                        Invite team members to collaborate on this project and assign them specific roles and permissions.
                                    </p>
                                    {project.can_manage_members ? (
                                        <Button
                                            className="shadow-sm hover:shadow-md"
                                            onClick={() => setInviteModalOpen(true)}
                                        >
                                            <UserPlus className="h-4 w-4 mr-2" />
                                            Invite Team Members
                                        </Button>
                                    ) : (
                                        <Button disabled className="shadow-sm">
                                            <Lock className="h-4 w-4 mr-2" />
                                            Invite Team Members
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <InviteMemberModal
                project={project}
                open={inviteModalOpen}
                onOpenChange={setInviteModalOpen}
            />

            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Remove Team Member"
                description={`Are you sure you want to remove ${memberToDelete?.name} from this project? They will lose access to all project resources.`}
                onConfirm={handleDeleteMember}
                confirmText="Remove"
                cancelText="Cancel"
                variant="destructive"
            />
        </AppLayout>
    );
}
