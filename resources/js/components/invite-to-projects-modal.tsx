import { useState, useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { UserPlus, Crown, Edit, Eye, Search } from 'lucide-react';
import { User } from '@/types';
import { Project } from '@/types/project-manager';
import { route } from 'ziggy-js';
import { useShortName } from '@/hooks/use-initials';

interface InviteToProjectsModalProps {
    user: User;
    ownedProjects: Project[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface InviteForm {
    project_ids: number[];
    role: 'admin' | 'editor' | 'viewer';
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

export default function InviteToProjectsModal({
    user,
    ownedProjects,
    open,
    onOpenChange
}: InviteToProjectsModalProps) {
    const getShortName = useShortName();
    const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm<InviteForm>({
        project_ids: [],
        role: 'viewer',
    });

    // Filter projects based on search query
    const filteredProjects = useMemo(() => {
        if (!searchQuery.trim()) return ownedProjects;
        const query = searchQuery.toLowerCase();
        return ownedProjects.filter(project =>
            project.name.toLowerCase().includes(query) ||
            (project.owner?.name && project.owner.name.toLowerCase().includes(query))
        );
    }, [ownedProjects, searchQuery]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedProjects.length === 0) {
            return;
        }

        console.log('Submitting invitation:', {
            user_id: user.id,
            project_ids: selectedProjects,
            role: data.role,
            route: route('team.invite-to-projects', user.id)
        });

        post(route('team.invite-to-projects', user.id), {
            project_ids: selectedProjects,
            role: data.role,
        }, {
            onSuccess: () => {
                console.log('Invitation successful');
                handleClose();
            },
            onError: (errors) => {
                console.error('Invitation failed:', errors);
            },
        });
    };

    const handleClose = () => {
        reset();
        setSelectedProjects([]);
        setSearchQuery('');
        onOpenChange(false);
    };

    const handleProjectToggle = (projectId: number) => {
        setSelectedProjects(prev =>
            prev.includes(projectId)
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId]
        );
    };

    const handleSelectAll = () => {
        const filteredProjectIds = filteredProjects.map(p => p.id);
        const allFilteredSelected = filteredProjectIds.every(id => selectedProjects.includes(id));

        if (allFilteredSelected) {
            // Deselect all filtered projects
            setSelectedProjects(prev => prev.filter(id => !filteredProjectIds.includes(id)));
        } else {
            // Select all filtered projects
            setSelectedProjects(prev => [...new Set([...prev, ...filteredProjectIds])]);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Invite to Projects
                    </DialogTitle>
                    <DialogDescription>
                        Invite {getShortName(user.name)} to your projects
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* User Info */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback className="text-lg font-medium">
                                        {user.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-medium">{getShortName(user.name)}</h3>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Project Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-medium">Select Projects</Label>
                            {filteredProjects.length > 1 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSelectAll}
                                >
                                    {filteredProjects.every(p => selectedProjects.includes(p.id)) ? 'Deselect All' : 'Select All'}
                                </Button>
                            )}
                        </div>

                        {/* Search Input */}
                        {ownedProjects.length > 0 && (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search projects..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        )}

                        {ownedProjects.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                You don't own any projects yet.
                            </p>
                        ) : filteredProjects.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No projects found matching your search.
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {filteredProjects.map((project) => (
                                    <div
                                        key={project.id}
                                        className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <Checkbox
                                            id={`project-${project.id}`}
                                            checked={selectedProjects.includes(project.id)}
                                            onCheckedChange={() => handleProjectToggle(project.id)}
                                        />
                                        <Label
                                            htmlFor={`project-${project.id}`}
                                            className="flex-1 cursor-pointer"
                                        >
                                            <div className="space-y-1">
                                                <div className="font-medium">{project.name}</div>
                                                {project.owner && (
                                                    <div className="text-xs text-muted-foreground">
                                                        Owner: {getShortName(project.owner.name)}
                                                    </div>
                                                )}
                                            </div>
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-4">
                        <Label className="text-base font-medium">Role</Label>
                        <RadioGroup
                            value={data.role}
                            onValueChange={(value: 'admin' | 'editor' | 'viewer') => setData('role', value)}
                        >
                            {Object.entries(roleDescriptions).map(([role, description]) => {
                                const IconComponent = roleIcons[role as keyof typeof roleIcons];
                                return (
                                    <div key={role} className="flex items-start space-x-3 p-3 border rounded-lg">
                                        <RadioGroupItem value={role} id={role} className="mt-1" />
                                        <div className="flex-1">
                                            <Label htmlFor={role} className="flex items-center gap-2 cursor-pointer">
                                                <IconComponent className="h-4 w-4" />
                                                <span className="font-medium capitalize">{role}</span>
                                            </Label>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </RadioGroup>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={processing || selectedProjects.length === 0}
                        >
                            {processing ? 'Inviting...' : `Invite to ${selectedProjects.length} Project${selectedProjects.length !== 1 ? 's' : ''}`}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
