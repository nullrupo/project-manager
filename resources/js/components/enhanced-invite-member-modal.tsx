import { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { UserPlus, Mail, Shield, Edit, Eye, Crown, Search, Users, X, Settings } from 'lucide-react';
import InputError from '@/components/input-error';
import { Project, User } from '@/types/project-manager';
import { route } from 'ziggy-js';
import { useShortName } from '@/hooks/use-initials';

interface EnhancedInviteMemberModalProps {
    project: Project;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface InviteForm {
    email: string;
    role: 'admin' | 'editor' | 'viewer';
    message: string;
    custom_permissions: {
        can_manage_members: boolean | null;
        can_manage_boards: boolean | null;
        can_manage_tasks: boolean | null;
        can_manage_labels: boolean | null;
        can_view_project: boolean | null;
        can_comment: boolean | null;
    };
}

const roleDescriptions = {
    admin: 'Can manage all aspects of the project except ownership transfer',
    editor: 'Can create and edit tasks, but cannot manage project structure',
    viewer: 'Can view project content and add comments, but cannot edit',
};

const roleIcons = {
    admin: Crown,
    editor: Edit,
    viewer: Eye,
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

export default function EnhancedInviteMemberModal({ project, open, onOpenChange }: EnhancedInviteMemberModalProps) {
    const getShortName = useShortName();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<'search' | 'email'>('search');
    const [showCustomPermissions, setShowCustomPermissions] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm<InviteForm>({
        email: '',
        role: 'viewer',
        message: '',
        custom_permissions: {
            can_manage_members: null,
            can_manage_boards: null,
            can_manage_tasks: null,
            can_manage_labels: null,
            can_view_project: null,
            can_comment: null,
        },
    });

    // Search for users
    useEffect(() => {
        if (searchQuery.trim().length >= 2) {
            setIsSearching(true);
            const timeoutId = setTimeout(async () => {
                try {
                    const response = await fetch(route('projects.members.search', project.id) + `?search=${encodeURIComponent(searchQuery)}`);
                    const data = await response.json();
                    setSearchResults(data);
                } catch (error) {
                    console.error('Error searching users:', error);
                    setSearchResults([]);
                } finally {
                    setIsSearching(false);
                }
            }, 300);

            return () => clearTimeout(timeoutId);
        } else {
            setSearchResults([]);
            setIsSearching(false);
        }
    }, [searchQuery, project.id]);

    // Reset custom permissions when role changes
    useEffect(() => {
        if (!showCustomPermissions) {
            setData('custom_permissions', {
                can_manage_members: null,
                can_manage_boards: null,
                can_manage_tasks: null,
                can_manage_labels: null,
                can_view_project: null,
                can_comment: null,
            });
        }
    }, [data.role, showCustomPermissions]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clean up custom permissions if not using custom settings
        const submitData = {
            ...data,
            custom_permissions: showCustomPermissions ? data.custom_permissions : {},
        };

        post(route('projects.invitations.store', project.id), {
            data: submitData,
            onSuccess: () => {
                handleClose();
            },
        });
    };

    const handleClose = () => {
        reset();
        setSearchQuery('');
        setSearchResults([]);
        setSelectedUser(null);
        setActiveTab('search');
        setShowCustomPermissions(false);
        onOpenChange(false);
    };

    const handleTabChange = (value: string) => {
        setActiveTab(value as 'search' | 'email');
        setSelectedUser(null);
        setData('email', '');
    };

    const handleUserSelect = (user: User) => {
        setSelectedUser(user);
        setData('email', user.email);
        setSearchQuery(user.name);
        setSearchResults([]);
    };

    const handlePermissionChange = (permission: keyof InviteForm['custom_permissions'], value: boolean) => {
        setData('custom_permissions', {
            ...data.custom_permissions,
            [permission]: value,
        });
    };

    const getCurrentPermissions = () => {
        if (showCustomPermissions) {
            return Object.entries(data.custom_permissions).reduce((acc, [key, value]) => {
                acc[key] = value !== null ? value : defaultPermissions[data.role][key];
                return acc;
            }, {} as Record<string, boolean>);
        }
        return defaultPermissions[data.role];
    };

    const permissionLabels = {
        can_manage_members: 'Manage Members',
        can_manage_boards: 'Manage Boards',
        can_manage_tasks: 'Manage Tasks',
        can_manage_labels: 'Manage Labels',
        can_view_project: 'View Project',
        can_comment: 'Add Comments',
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Invite Team Member
                    </DialogTitle>
                    <DialogDescription>
                        Send an invitation to collaborate on "{project.name}"
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="search" className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Search Users
                            </TabsTrigger>
                            <TabsTrigger value="email" className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                By Email
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="search" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="search">Search for team members</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                    <Input
                                        id="search"
                                        placeholder="Search by name or email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                
                                {isSearching && (
                                    <div className="text-sm text-muted-foreground">Searching...</div>
                                )}
                                
                                {searchResults.length > 0 && (
                                    <div className="border rounded-md max-h-48 overflow-y-auto">
                                        {searchResults.map((user) => (
                                            <div
                                                key={user.id}
                                                className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                                                onClick={() => handleUserSelect(user)}
                                            >
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={user.avatar} alt={user.name} />
                                                    <AvatarFallback className="text-xs">
                                                        {getShortName(user.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">{user.name}</div>
                                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {selectedUser && (
                                    <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                                            <AvatarFallback className="text-xs">
                                                {getShortName(selectedUser.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{selectedUser.name}</div>
                                            <div className="text-xs text-muted-foreground">{selectedUser.email}</div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedUser(null);
                                                setData('email', '');
                                                setSearchQuery('');
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="email" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter email address..."
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                                <InputError message={errors.email} />
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={data.role} onValueChange={(value) => setData('role', value as any)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(roleDescriptions).map(([role, description]) => {
                                        const Icon = roleIcons[role as keyof typeof roleIcons];
                                        return (
                                            <SelectItem key={role} value={role}>
                                                <div className="flex items-center gap-2">
                                                    <Icon className="h-4 w-4" />
                                                    <div>
                                                        <div className="font-medium">{role.charAt(0).toUpperCase() + role.slice(1)}</div>
                                                        <div className="text-xs text-muted-foreground">{description}</div>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="custom-permissions">Custom Permissions</Label>
                                <div className="flex items-center gap-2">
                                    <Settings className="h-4 w-4 text-muted-foreground" />
                                    <Switch
                                        id="custom-permissions"
                                        checked={showCustomPermissions}
                                        onCheckedChange={setShowCustomPermissions}
                                    />
                                </div>
                            </div>

                            {showCustomPermissions && (
                                <div className="space-y-3 p-4 border rounded-md bg-muted/50">
                                    <div className="text-sm font-medium">Override default role permissions:</div>
                                    {Object.entries(permissionLabels).map(([key, label]) => (
                                        <div key={key} className="flex items-center justify-between">
                                            <Label htmlFor={key} className="text-sm">{label}</Label>
                                            <Switch
                                                id={key}
                                                checked={getCurrentPermissions()[key]}
                                                onCheckedChange={(checked) => 
                                                    handlePermissionChange(key as keyof InviteForm['custom_permissions'], checked)
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Personal Message (Optional)</Label>
                            <Textarea
                                id="message"
                                placeholder="Add a personal message to the invitation..."
                                value={data.message}
                                onChange={(e) => setData('message', e.target.value)}
                                rows={3}
                            />
                            <div className="text-xs text-muted-foreground">
                                This message will be included in the invitation email.
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={processing || !data.email}
                            className="flex items-center gap-2"
                        >
                            <Mail className="h-4 w-4" />
                            {processing ? 'Sending...' : 'Send Invitation'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
