import React, { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Project, User } from '@/types/project-manager';
import { Save, Shield, User as UserIcon, Crown, Settings, Eye, Users, ListTodo, Tag, MessageSquare, Lock } from 'lucide-react';
import InputError from '@/components/input-error';
import { useShortName } from '@/hooks/use-initials';

interface MemberPermissionModalProps {
    project: Project;
    member: User | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
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
    viewer: 'Can view project content and add comments, but cannot edit anything',
};

const roleIcons = {
    admin: Crown,
    editor: Settings,
    viewer: Eye,
};

const permissionLabels = {
    can_manage_members: 'Manage Members',
    can_manage_boards: 'Manage Boards',
    can_manage_tasks: 'Manage Tasks',
    can_manage_labels: 'Manage Labels',
    can_view_project: 'View Project',
    can_comment: 'Comment',
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

const defaultPermissions = {
    admin: {
        can_manage_members: true,
        can_manage_boards: true,
        can_manage_tasks: true,
        can_manage_labels: true,
        can_view_project: true,
        can_comment: true,
    },
    editor: {
        can_manage_members: false,
        can_manage_boards: false,
        can_manage_tasks: true,
        can_manage_labels: false,
        can_view_project: true,
        can_comment: true,
    },
    viewer: {
        can_manage_members: false,
        can_manage_boards: false,
        can_manage_tasks: false,
        can_manage_labels: false,
        can_view_project: true,
        can_comment: true,
    },
};

export default function MemberPermissionModal({ project, member, open, onOpenChange }: MemberPermissionModalProps) {
    const getShortName = useShortName();
    const [selectedRole, setSelectedRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');

    const { data, setData, put, processing, errors, reset } = useForm<MemberEditForm>({
        role: 'viewer',
        can_manage_members: false,
        can_manage_boards: false,
        can_manage_tasks: false,
        can_manage_labels: false,
        can_view_project: true,
        can_comment: true,
    });

    useEffect(() => {
        if (member && open) {
            const memberRole = member.pivot?.role || 'viewer';
            const memberPermissions = {
                can_manage_members: member.pivot?.can_manage_members || false,
                can_manage_boards: member.pivot?.can_manage_boards || false,
                can_manage_tasks: member.pivot?.can_manage_tasks || false,
                can_manage_labels: member.pivot?.can_manage_labels || false,
                can_view_project: member.pivot?.can_view_project || true,
                can_comment: member.pivot?.can_comment || true,
            };

            setSelectedRole(memberRole as 'admin' | 'editor' | 'viewer');
            setData({
                role: memberRole as 'admin' | 'editor' | 'viewer',
                ...memberPermissions,
            });
        }
    }, [member, open]);

    const handleRoleChange = (newRole: 'admin' | 'editor' | 'viewer') => {
        setSelectedRole(newRole);
        setData('role', newRole);

        // Update permissions based on role defaults
        const rolePermissions = defaultPermissions[newRole];
        setData({
            ...data,
            role: newRole,
            ...rolePermissions,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!member) return;

        put(route('projects.members.update', { project: project.id, user: member.id }), {
            onSuccess: () => {
                onOpenChange(false);
                reset();
            },
        });
    };

    const handleClose = () => {
        onOpenChange(false);
        reset();
    };

    if (!member) return null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-6xl sm:max-w-6xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Manage Member Permissions
                    </DialogTitle>
                    <DialogDescription>
                        Configure {member.name}'s access and permissions for {project.name}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    {/* Member Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={member.avatar} />
                                <AvatarFallback className="text-lg font-medium">
                                    {member.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-medium">{getShortName(member.name)}</h3>
                                <p className="text-sm text-muted-foreground">{member.email}</p>
                                <Badge variant="outline" className="mt-1 text-xs">
                                    Current: {member.pivot?.role || 'viewer'}
                                </Badge>
                            </div>
                        </div>

                        {/* Role Preview */}
                        <div className="p-4 border rounded-lg">
                            <h4 className="font-medium mb-3">Role Preview</h4>
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
                                    <h5 className="font-medium text-sm">Permissions:</h5>
                                    {Object.entries(data).map(([key, value]) => {
                                        if (key === 'role' || !value) return null;
                                        const Icon = permissionIcons[key as keyof typeof permissionIcons];
                                        return (
                                            <div key={key} className="flex items-center gap-2 text-sm">
                                                <Icon className="h-3 w-3 text-green-600" />
                                                <span className="text-muted-foreground">
                                                    {permissionLabels[key as keyof typeof permissionLabels]}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Role Selection and Permissions */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <Label className="text-base font-medium">Role</Label>
                                <Select value={data.role} onValueChange={handleRoleChange}>
                                    <SelectTrigger className="text-left h-auto min-h-[2.5rem] py-2">
                                        <SelectValue>
                                            {data.role && (
                                                <div className="flex items-center gap-2">
                                                    {React.createElement(roleIcons[data.role as keyof typeof roleIcons], { className: "h-4 w-4 flex-shrink-0" })}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-medium capitalize">{data.role}</div>
                                                        <div className="text-xs text-muted-foreground truncate">
                                                            {roleDescriptions[data.role as keyof typeof roleDescriptions]}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="w-[400px]">
                                        {Object.entries(roleDescriptions).map(([role, description]) => {
                                            const Icon = roleIcons[role as keyof typeof roleIcons];
                                            return (
                                                <SelectItem key={role} value={role} className="h-auto py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Icon className="h-4 w-4 flex-shrink-0" />
                                                        <div className="min-w-0">
                                                            <div className="font-medium capitalize">{role}</div>
                                                            <div className="text-xs text-muted-foreground whitespace-normal">{description}</div>
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
                                                        {permissionLabels[permission as keyof typeof permissionLabels]}
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
                                <Button type="button" variant="outline" onClick={handleClose}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
