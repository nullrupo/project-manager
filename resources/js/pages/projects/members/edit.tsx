import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Project, User } from '@/types/project-manager';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Save, Shield, User as UserIcon, Settings, Crown, Users, ListTodo, Tag, MessageSquare, Eye, Lock } from 'lucide-react';
import InputError from '@/components/input-error';

interface MemberEditProps {
    project: Project;
    member: User;
    memberRole: string;
    memberPermissions: {
        can_manage_members: boolean;
        can_manage_boards: boolean;
        can_manage_tasks: boolean;
        can_manage_labels: boolean;
        can_view_project: boolean;
        can_comment: boolean;
    };
    availableRoles: {
        admin: string;
        editor: string;
        viewer: string;
    };
    defaultPermissions: {
        admin: {
            can_manage_members: boolean;
            can_manage_boards: boolean;
            can_manage_tasks: boolean;
            can_manage_labels: boolean;
            can_view_project: boolean;
            can_comment: boolean;
        };
        editor: {
            can_manage_members: boolean;
            can_manage_boards: boolean;
            can_manage_tasks: boolean;
            can_manage_labels: boolean;
            can_view_project: boolean;
            can_comment: boolean;
        };
        viewer: {
            can_manage_members: boolean;
            can_manage_boards: boolean;
            can_manage_tasks: boolean;
            can_manage_labels: boolean;
            can_view_project: boolean;
            can_comment: boolean;
        };
    };
}

interface MemberEditForm {
    role: 'admin' | 'editor' | 'viewer';
    can_manage_members: boolean;
    can_manage_boards: boolean;
    can_manage_tasks: boolean;
    can_manage_labels: boolean;
    can_view_project: boolean;
    can_comment: boolean;
}

const roleDescriptions = {
    admin: 'Can manage all aspects of the project except ownership transfer',
    editor: 'Can create and edit tasks, but cannot manage project structure',
    viewer: 'Can view project content and add comments, but cannot edit',
};

const roleIcons = {
    admin: Crown,
    editor: Settings,
    viewer: Eye,
};

const permissionDescriptions = {
    can_manage_members: 'Add, remove, and modify member permissions',
    can_manage_boards: 'Create, edit, and delete project boards',
    can_manage_tasks: 'Create, edit, and delete tasks',
    can_manage_labels: 'Create, edit, and delete project labels',
    can_view_project: 'View project content and details',
    can_comment: 'Add comments to tasks and discussions',
};

const permissionIcons = {
    can_manage_members: Users,
    can_manage_boards: ListTodo,
    can_manage_tasks: Settings,
    can_manage_labels: Tag,
    can_view_project: Eye,
    can_comment: MessageSquare,
};

export default function MemberEdit({ project, member, memberRole, memberPermissions, availableRoles, defaultPermissions }: MemberEditProps) {
    const [selectedRole, setSelectedRole] = useState<'admin' | 'editor' | 'viewer'>(memberRole as 'admin' | 'editor' | 'viewer');

    const { data, setData, put, processing, errors } = useForm<MemberEditForm>({
        role: memberRole as 'admin' | 'editor' | 'viewer',
        can_manage_members: memberPermissions.can_manage_members,
        can_manage_boards: memberPermissions.can_manage_boards,
        can_manage_tasks: memberPermissions.can_manage_tasks,
        can_manage_labels: memberPermissions.can_manage_labels,
        can_view_project: memberPermissions.can_view_project,
        can_comment: memberPermissions.can_comment,
    });

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
            title: 'Manage Member',
            href: route('projects.members.edit', { project: project.id, user: member.id }),
        },
    ];

    const handleRoleChange = (newRole: 'admin' | 'editor' | 'viewer') => {
        setSelectedRole(newRole);
        setData('role', newRole);

        // Update permissions based on role defaults
        const rolePermissions = defaultPermissions[newRole];
        setData({
            ...data,
            role: newRole,
            can_manage_members: rolePermissions.can_manage_members,
            can_manage_boards: rolePermissions.can_manage_boards,
            can_manage_tasks: rolePermissions.can_manage_tasks,
            can_manage_labels: rolePermissions.can_manage_labels,
            can_view_project: rolePermissions.can_view_project,
            can_comment: rolePermissions.can_comment,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('projects.members.update', { project: project.id, user: member.id }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Manage ${member.name} - ${project.name}`} />

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
                            <h1 className="text-2xl font-bold">Manage Member Permissions</h1>
                            <p className="text-muted-foreground">Configure {member.name}'s access and permissions for {project.name}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Member Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserIcon className="h-5 w-5" />
                                Member Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={member.avatar} />
                                    <AvatarFallback className="text-lg font-medium">
                                        {member.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-medium text-lg">{member.name}</h3>
                                    <p className="text-sm text-muted-foreground">{member.email}</p>
                                    <Badge variant="outline" className="mt-1">
                                        Current: {memberRole}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Role Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Role & Permissions
                            </CardTitle>
                            <CardDescription>
                                Choose a role and customize permissions
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-3">
                                    <Label>Role</Label>
                                    <Select value={data.role} onValueChange={handleRoleChange}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(availableRoles).map(([role, description]) => {
                                                const Icon = roleIcons[role as keyof typeof roleIcons];
                                                return (
                                                    <SelectItem key={role} value={role}>
                                                        <div className="flex items-center gap-2">
                                                            <Icon className="h-4 w-4" />
                                                            <div>
                                                                <div className="font-medium capitalize">{role}</div>
                                                                <div className="text-xs text-muted-foreground">{description}</div>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.role} />
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <Label className="text-base font-medium">Custom Permissions</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Override default role permissions with custom settings
                                    </p>

                                    {Object.entries(permissionDescriptions).map(([permission, description]) => {
                                        const Icon = permissionIcons[permission as keyof typeof permissionIcons];
                                        const isDisabled = permission === 'can_view_project'; // Always required

                                        return (
                                            <div key={permission} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <div className="font-medium text-sm">
                                                            {permission.replace('can_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{description}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isDisabled && <Lock className="h-4 w-4 text-muted-foreground" />}
                                                    <Switch
                                                        checked={data[permission as keyof MemberEditForm] as boolean}
                                                        onCheckedChange={(checked) => setData(permission as keyof MemberEditForm, checked)}
                                                        disabled={isDisabled}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button type="submit" disabled={processing} className="flex-1">
                                        <Save className="h-4 w-4 mr-2" />
                                        {processing ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                    <Link href={route('projects.show', { project: project.id })}>
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </Link>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Role Preview */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Role Preview</CardTitle>
                            <CardDescription>
                                What {member.name} will be able to do
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    {React.createElement(roleIcons[selectedRole], { className: "h-4 w-4" })}
                                    <span className="font-medium capitalize">{selectedRole}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {roleDescriptions[selectedRole]}
                                </p>

                                <Separator />

                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Permissions:</h4>
                                    {Object.entries(data).map(([key, value]) => {
                                        if (key === 'role' || !value) return null;
                                        const Icon = permissionIcons[key as keyof typeof permissionIcons];
                                        return (
                                            <div key={key} className="flex items-center gap-2 text-sm">
                                                <Icon className="h-3 w-3 text-green-600" />
                                                <span className="text-muted-foreground">
                                                    {key.replace('can_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
