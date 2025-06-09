import { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    UserPlus, 
    Mail, 
    Users, 
    X, 
    Plus,
    Crown,
    Edit,
    Eye,
    Folder,
    AlertCircle
} from 'lucide-react';
import InputError from '@/components/input-error';
import { Project } from '@/types/project-manager';
import { route } from 'ziggy-js';

interface BulkInvitationModalProps {
    projects: Project[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface BulkInviteForm {
    project_ids: number[];
    emails: string[];
    role: 'admin' | 'editor' | 'viewer';
    message: string;
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

export default function BulkInvitationModal({ projects, open, onOpenChange }: BulkInvitationModalProps) {
    const [emailInput, setEmailInput] = useState('');
    const [emailList, setEmailList] = useState<string[]>([]);
    const [selectedProjects, setSelectedProjects] = useState<number[]>([]);

    const { data, setData, post, processing, errors, reset } = useForm<BulkInviteForm>({
        project_ids: [],
        emails: [],
        role: 'viewer',
        message: '',
    });

    // Update form data when selections change
    useEffect(() => {
        setData('project_ids', selectedProjects);
    }, [selectedProjects]);

    useEffect(() => {
        setData('emails', emailList);
    }, [emailList]);

    const handleAddEmail = () => {
        const email = emailInput.trim();
        if (email && isValidEmail(email) && !emailList.includes(email)) {
            setEmailList([...emailList, email]);
            setEmailInput('');
        }
    };

    const handleRemoveEmail = (emailToRemove: string) => {
        setEmailList(emailList.filter(email => email !== emailToRemove));
    };

    const handleEmailKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddEmail();
        }
    };

    const handleBulkEmailPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        const emails = pastedText
            .split(/[,;\n\r\t\s]+/)
            .map(email => email.trim())
            .filter(email => email && isValidEmail(email))
            .filter(email => !emailList.includes(email));
        
        if (emails.length > 0) {
            setEmailList([...emailList, ...emails]);
            setEmailInput('');
        }
    };

    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleProjectToggle = (projectId: number) => {
        setSelectedProjects(prev => 
            prev.includes(projectId)
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId]
        );
    };

    const handleSelectAllProjects = () => {
        if (selectedProjects.length === projects.length) {
            setSelectedProjects([]);
        } else {
            setSelectedProjects(projects.map(p => p.id));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (selectedProjects.length === 0) {
            return;
        }

        if (emailList.length === 0) {
            return;
        }

        post(route('invitations.bulk'), {
            onSuccess: () => {
                handleClose();
            },
        });
    };

    const handleClose = () => {
        reset();
        setEmailInput('');
        setEmailList([]);
        setSelectedProjects([]);
        onOpenChange(false);
    };

    const totalInvitations = selectedProjects.length * emailList.length;
    const RoleIcon = roleIcons[data.role];

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Bulk Project Invitations
                    </DialogTitle>
                    <DialogDescription>
                        Invite multiple users to multiple projects simultaneously
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Project Selection */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Folder className="h-4 w-4" />
                                    Select Projects ({selectedProjects.length})
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="select-all-projects"
                                        checked={selectedProjects.length === projects.length}
                                        onCheckedChange={handleSelectAllProjects}
                                    />
                                    <Label htmlFor="select-all-projects" className="text-sm">
                                        Select all projects
                                    </Label>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                                {projects.map((project) => (
                                    <div key={project.id} className="flex items-center space-x-2 p-2 rounded hover:bg-muted">
                                        <Checkbox
                                            id={`project-${project.id}`}
                                            checked={selectedProjects.includes(project.id)}
                                            onCheckedChange={() => handleProjectToggle(project.id)}
                                        />
                                        <Label 
                                            htmlFor={`project-${project.id}`} 
                                            className="flex-1 cursor-pointer"
                                        >
                                            <div className="font-medium">{project.name}</div>
                                            {project.description && (
                                                <div className="text-xs text-muted-foreground truncate">
                                                    {project.description}
                                                </div>
                                            )}
                                        </Label>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Email Management */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Email Addresses ({emailList.length})
                                </CardTitle>
                                <CardDescription>
                                    Add emails one by one or paste multiple emails separated by commas
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Enter email address..."
                                        value={emailInput}
                                        onChange={(e) => setEmailInput(e.target.value)}
                                        onKeyPress={handleEmailKeyPress}
                                        onPaste={handleBulkEmailPaste}
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleAddEmail}
                                        disabled={!emailInput.trim() || !isValidEmail(emailInput.trim())}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>

                                {emailList.length > 0 && (
                                    <div className="max-h-32 overflow-y-auto space-y-1">
                                        {emailList.map((email, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                                <span className="text-sm">{email}</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveEmail(email)}
                                                    className="h-6 w-6 p-0"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="role">Role for all invitations</Label>
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

                    {/* Message */}
                    <div className="space-y-2">
                        <Label htmlFor="message">Personal Message (Optional)</Label>
                        <Textarea
                            id="message"
                            placeholder="Add a personal message to all invitations..."
                            value={data.message}
                            onChange={(e) => setData('message', e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* Summary */}
                    {totalInvitations > 0 && (
                        <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-2 text-blue-800">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="font-medium">
                                        Ready to send {totalInvitations} invitations
                                    </span>
                                </div>
                                <div className="text-sm text-blue-700 mt-1">
                                    {emailList.length} users × {selectedProjects.length} projects as {data.role}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={processing || selectedProjects.length === 0 || emailList.length === 0}
                            className="flex items-center gap-2"
                        >
                            <UserPlus className="h-4 w-4" />
                            {processing ? 'Sending...' : `Send ${totalInvitations} Invitations`}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
