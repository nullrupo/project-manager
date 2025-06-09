import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
    Settings, 
    Plus, 
    MoreHorizontal, 
    Edit, 
    Trash2, 
    Copy,
    Crown,
    Eye,
    Users,
    Kanban,
    Tags,
    MessageSquare,
    CheckCircle,
    Globe,
    User,
    Folder
} from 'lucide-react';
import { route } from 'ziggy-js';

interface PermissionTemplate {
    id: number;
    name: string;
    description?: string;
    scope: 'global' | 'project' | 'personal';
    base_role: 'admin' | 'editor' | 'viewer';
    usage_count: number;
    can_manage_members: boolean;
    can_manage_boards: boolean;
    can_manage_tasks: boolean;
    can_manage_labels: boolean;
    can_view_project: boolean;
    can_comment: boolean;
    created_at: string;
}

interface PermissionTemplateManagerProps {
    templates: PermissionTemplate[];
    projectId?: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTemplateSelect?: (template: PermissionTemplate) => void;
}

interface TemplateForm {
    name: string;
    description: string;
    scope: 'global' | 'project' | 'personal';
    base_role: 'admin' | 'editor' | 'viewer';
    can_manage_members: boolean;
    can_manage_boards: boolean;
    can_manage_tasks: boolean;
    can_manage_labels: boolean;
    can_view_project: boolean;
    can_comment: boolean;
}

const scopeIcons = {
    global: Globe,
    project: Folder,
    personal: User,
};

const scopeLabels = {
    global: 'Global',
    project: 'Project',
    personal: 'Personal',
};

const roleIcons = {
    admin: Crown,
    editor: Edit,
    viewer: Eye,
};

const permissionIcons = {
    can_manage_members: Users,
    can_manage_boards: Kanban,
    can_manage_tasks: CheckCircle,
    can_manage_labels: Tags,
    can_view_project: Eye,
    can_comment: MessageSquare,
};

const permissionLabels = {
    can_manage_members: 'Manage Members',
    can_manage_boards: 'Manage Boards',
    can_manage_tasks: 'Manage Tasks',
    can_manage_labels: 'Manage Labels',
    can_view_project: 'View Project',
    can_comment: 'Add Comments',
};

export default function PermissionTemplateManager({ 
    templates, 
    projectId, 
    open, 
    onOpenChange, 
    onTemplateSelect 
}: PermissionTemplateManagerProps) {
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<PermissionTemplate | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm<TemplateForm>({
        name: '',
        description: '',
        scope: 'personal',
        base_role: 'viewer',
        can_manage_members: false,
        can_manage_boards: false,
        can_manage_tasks: false,
        can_manage_labels: false,
        can_view_project: true,
        can_comment: true,
    });

    const handleCreateTemplate = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('permission-templates.store'), {
            onSuccess: () => {
                setCreateModalOpen(false);
                reset();
            },
        });
    };

    const handleEditTemplate = (template: PermissionTemplate) => {
        setEditingTemplate(template);
        setData({
            name: template.name,
            description: template.description || '',
            scope: template.scope,
            base_role: template.base_role,
            can_manage_members: template.can_manage_members,
            can_manage_boards: template.can_manage_boards,
            can_manage_tasks: template.can_manage_tasks,
            can_manage_labels: template.can_manage_labels,
            can_view_project: template.can_view_project,
            can_comment: template.can_comment,
        });
        setCreateModalOpen(true);
    };

    const handleUpdateTemplate = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTemplate) {
            put(route('permission-templates.update', editingTemplate.id), {
                onSuccess: () => {
                    setCreateModalOpen(false);
                    setEditingTemplate(null);
                    reset();
                },
            });
        }
    };

    const handleDeleteTemplate = (template: PermissionTemplate) => {
        if (confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
            destroy(route('permission-templates.destroy', template.id));
        }
    };

    const handleDuplicateTemplate = (template: PermissionTemplate) => {
        setData({
            name: `${template.name} (Copy)`,
            description: template.description || '',
            scope: 'personal',
            base_role: template.base_role,
            can_manage_members: template.can_manage_members,
            can_manage_boards: template.can_manage_boards,
            can_manage_tasks: template.can_manage_tasks,
            can_manage_labels: template.can_manage_labels,
            can_view_project: template.can_view_project,
            can_comment: template.can_comment,
        });
        setCreateModalOpen(true);
    };

    const handlePermissionChange = (permission: keyof TemplateForm, value: boolean) => {
        setData(permission, value);
    };

    const getEnabledPermissions = (template: PermissionTemplate) => {
        return Object.entries(permissionLabels).filter(([key]) => 
            template[key as keyof PermissionTemplate] === true
        );
    };

    const closeCreateModal = () => {
        setCreateModalOpen(false);
        setEditingTemplate(null);
        reset();
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Permission Templates
                        </DialogTitle>
                        <DialogDescription>
                            Manage reusable permission templates for project invitations
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">
                                {templates.length} templates available
                            </div>
                            <Button onClick={() => setCreateModalOpen(true)} size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Template
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {templates.map((template) => {
                                const ScopeIcon = scopeIcons[template.scope];
                                const RoleIcon = roleIcons[template.base_role];
                                const enabledPermissions = getEnabledPermissions(template);

                                return (
                                    <Card key={template.id} className="relative">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <CardTitle className="text-base">{template.name}</CardTitle>
                                                        <Badge variant="outline" className="flex items-center gap-1">
                                                            <ScopeIcon className="h-3 w-3" />
                                                            {scopeLabels[template.scope]}
                                                        </Badge>
                                                    </div>
                                                    {template.description && (
                                                        <CardDescription className="text-sm">
                                                            {template.description}
                                                        </CardDescription>
                                                    )}
                                                </div>
                                                
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {onTemplateSelect && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => onTemplateSelect(template)}>
                                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                                    Use Template
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                            </>
                                                        )}
                                                        <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                                                            <Copy className="h-4 w-4 mr-2" />
                                                            Duplicate
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            onClick={() => handleDeleteTemplate(template)}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </CardHeader>
                                        
                                        <CardContent className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <RoleIcon className="h-4 w-4" />
                                                <span className="text-sm font-medium">
                                                    {template.base_role.charAt(0).toUpperCase() + template.base_role.slice(1)}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    • Used {template.usage_count} times
                                                </span>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="text-xs font-medium text-muted-foreground">
                                                    Permissions ({enabledPermissions.length})
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {enabledPermissions.slice(0, 3).map(([key, label]) => {
                                                        const Icon = permissionIcons[key as keyof typeof permissionIcons];
                                                        return (
                                                            <Badge key={key} variant="secondary" className="text-xs">
                                                                <Icon className="h-3 w-3 mr-1" />
                                                                {label}
                                                            </Badge>
                                                        );
                                                    })}
                                                    {enabledPermissions.length > 3 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            +{enabledPermissions.length - 3} more
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {templates.length === 0 && (
                            <div className="text-center py-12">
                                <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <h3 className="text-lg font-medium mb-2">No templates yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Create your first permission template to streamline invitations
                                </p>
                                <Button onClick={() => setCreateModalOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Template
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create/Edit Template Modal */}
            <Dialog open={createModalOpen} onOpenChange={closeCreateModal}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingTemplate ? 'Edit Template' : 'Create Permission Template'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingTemplate 
                                ? 'Update the permission template settings'
                                : 'Create a reusable permission template for project invitations'
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={editingTemplate ? handleUpdateTemplate : handleCreateTemplate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Template Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g., Developer Access"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="scope">Scope</Label>
                                <Select value={data.scope} onValueChange={(value) => setData('scope', value as any)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="personal">Personal (Only you)</SelectItem>
                                        <SelectItem value="project">Project (Project members)</SelectItem>
                                        <SelectItem value="global">Global (Everyone)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Describe when to use this template..."
                                rows={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="base_role">Base Role</Label>
                            <Select value={data.base_role} onValueChange={(value) => setData('base_role', value as any)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="viewer">Viewer</SelectItem>
                                    <SelectItem value="editor">Editor</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <Label>Permissions</Label>
                            {Object.entries(permissionLabels).map(([key, label]) => {
                                const Icon = permissionIcons[key as keyof typeof permissionIcons];
                                return (
                                    <div key={key} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                            <Label htmlFor={key} className="text-sm">{label}</Label>
                                        </div>
                                        <Switch
                                            id={key}
                                            checked={data[key as keyof TemplateForm] as boolean}
                                            onCheckedChange={(checked) => 
                                                handlePermissionChange(key as keyof TemplateForm, checked)
                                            }
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeCreateModal}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {editingTemplate ? 'Update Template' : 'Create Template'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
