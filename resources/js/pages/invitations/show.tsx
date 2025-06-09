import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
    CheckCircle, 
    XCircle, 
    UserPlus, 
    Clock, 
    Mail,
    Crown,
    Edit,
    Eye,
    Shield,
    Users,
    Kanban,
    Tags,
    MessageSquare
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Project, User } from '@/types/project-manager';
import { route } from 'ziggy-js';
import { useShortName } from '@/hooks/use-initials';

interface ProjectInvitation {
    id: number;
    email: string;
    role: 'admin' | 'editor' | 'viewer';
    status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
    message?: string;
    expires_at: string;
    created_at: string;
    can_manage_members?: boolean;
    can_manage_boards?: boolean;
    can_manage_tasks?: boolean;
    can_manage_labels?: boolean;
    can_view_project?: boolean;
    can_comment?: boolean;
}

interface InvitationShowProps {
    invitation: ProjectInvitation;
    project: Project;
    invitedBy: User;
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

const permissionIcons = {
    can_manage_members: Users,
    can_manage_boards: Kanban,
    can_manage_tasks: CheckCircle,
    can_manage_labels: Tags,
    can_view_project: Eye,
    can_comment: MessageSquare,
};

const permissionLabels = {
    can_manage_members: 'Manage team members',
    can_manage_boards: 'Manage project boards',
    can_manage_tasks: 'Create and edit tasks',
    can_manage_labels: 'Manage project labels',
    can_view_project: 'View project content',
    can_comment: 'Add comments and participate in discussions',
};

export default function InvitationShow({ invitation, project, invitedBy }: InvitationShowProps) {
    const getShortName = useShortName();
    const [isProcessing, setIsProcessing] = useState(false);

    const { post } = useForm();

    const handleAccept = () => {
        setIsProcessing(true);
        post(route('invitations.accept', invitation.id), {
            onFinish: () => setIsProcessing(false),
        });
    };

    const handleDecline = () => {
        setIsProcessing(true);
        post(route('invitations.decline', invitation.id), {
            onFinish: () => setIsProcessing(false),
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const isExpired = new Date(invitation.expires_at) < new Date();
    const RoleIcon = roleIcons[invitation.role];

    // Get permissions (use custom if available, otherwise use role defaults)
    const getPermissions = () => {
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

        return Object.entries(permissionLabels).reduce((acc, [key, label]) => {
            const customValue = invitation[key as keyof ProjectInvitation];
            const defaultValue = defaultPermissions[invitation.role][key as keyof typeof defaultPermissions.admin];
            acc[key] = customValue !== null && customValue !== undefined ? customValue : defaultValue;
            return acc;
        }, {} as Record<string, boolean>);
    };

    const permissions = getPermissions();

    return (
        <AppLayout>
            <Head title={`Invitation to ${project.name}`} />
            
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserPlus className="h-8 w-8 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-bold">You're Invited!</h1>
                    <p className="text-muted-foreground">
                        You've been invited to collaborate on a project
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                {project.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-xl">{project.name}</CardTitle>
                                {project.description && (
                                    <CardDescription className="mt-1">
                                        {project.description}
                                    </CardDescription>
                                )}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={invitedBy.avatar} alt={invitedBy.name} />
                                <AvatarFallback>
                                    {getShortName(invitedBy.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="font-medium">{invitedBy.name}</div>
                                <div className="text-sm text-muted-foreground">
                                    invited you to join this project
                                </div>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                                {formatDate(invitation.created_at)}
                            </div>
                        </div>

                        {invitation.message && (
                            <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                                <div className="flex items-start gap-2">
                                    <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <div className="font-medium text-blue-900 mb-1">Personal Message</div>
                                        <div className="text-blue-800 italic">"{invitation.message}"</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-muted-foreground" />
                                    <span className="font-medium">Your Role:</span>
                                </div>
                                <Badge variant="outline" className="flex items-center gap-2">
                                    <RoleIcon className="h-4 w-4" />
                                    {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                                </Badge>
                            </div>

                            <div className="text-sm text-muted-foreground">
                                {roleDescriptions[invitation.role]}
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <div className="font-medium">What you'll be able to do:</div>
                                <div className="grid grid-cols-1 gap-2">
                                    {Object.entries(permissions).map(([key, enabled]) => {
                                        const Icon = permissionIcons[key as keyof typeof permissionIcons];
                                        const label = permissionLabels[key as keyof typeof permissionLabels];
                                        
                                        return (
                                            <div 
                                                key={key} 
                                                className={`flex items-center gap-3 p-2 rounded ${
                                                    enabled ? 'text-green-700 bg-green-50' : 'text-gray-500 bg-gray-50'
                                                }`}
                                            >
                                                <Icon className="h-4 w-4" />
                                                <span className="text-sm">{label}</span>
                                                {enabled ? (
                                                    <CheckCircle className="h-4 w-4 ml-auto" />
                                                ) : (
                                                    <XCircle className="h-4 w-4 ml-auto" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {invitation.status === 'pending' && !isExpired && (
                            <>
                                <Separator />
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    This invitation expires on {formatDate(invitation.expires_at)}
                                </div>

                                <div className="flex gap-3">
                                    <Button 
                                        onClick={handleAccept}
                                        disabled={isProcessing}
                                        className="flex-1"
                                        size="lg"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        {isProcessing ? 'Accepting...' : 'Accept Invitation'}
                                    </Button>
                                    <Button 
                                        onClick={handleDecline}
                                        disabled={isProcessing}
                                        variant="outline"
                                        size="lg"
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Decline
                                    </Button>
                                </div>
                            </>
                        )}

                        {(invitation.status !== 'pending' || isExpired) && (
                            <div className="text-center p-4 bg-muted rounded-lg">
                                <div className="text-muted-foreground">
                                    {invitation.status === 'accepted' && 'This invitation has been accepted.'}
                                    {invitation.status === 'declined' && 'This invitation has been declined.'}
                                    {invitation.status === 'expired' && 'This invitation has expired.'}
                                    {invitation.status === 'cancelled' && 'This invitation has been cancelled.'}
                                    {invitation.status === 'pending' && isExpired && 'This invitation has expired.'}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
