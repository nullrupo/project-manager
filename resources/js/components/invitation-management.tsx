import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger, 
    DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { 
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
    Mail, 
    MoreHorizontal, 
    RefreshCw, 
    X, 
    Clock, 
    CheckCircle, 
    XCircle, 
    AlertCircle,
    Crown,
    Edit,
    Eye
} from 'lucide-react';
import { Project } from '@/types/project-manager';
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
    invited_by: {
        id: number;
        name: string;
        email: string;
    };
    invited_user?: {
        id: number;
        name: string;
        email: string;
        avatar?: string;
    };
}

interface InvitationManagementProps {
    project: Project;
    invitations: ProjectInvitation[];
    canManageMembers: boolean;
}

const statusConfig = {
    pending: { 
        icon: Clock, 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        label: 'Pending' 
    },
    accepted: { 
        icon: CheckCircle, 
        color: 'bg-green-100 text-green-800 border-green-200',
        label: 'Accepted' 
    },
    declined: { 
        icon: XCircle, 
        color: 'bg-red-100 text-red-800 border-red-200',
        label: 'Declined' 
    },
    expired: { 
        icon: AlertCircle, 
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        label: 'Expired' 
    },
    cancelled: { 
        icon: X, 
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        label: 'Cancelled' 
    },
};

const roleIcons = {
    admin: Crown,
    editor: Edit,
    viewer: Eye,
};

export default function InvitationManagement({ project, invitations, canManageMembers }: InvitationManagementProps) {
    const getShortName = useShortName();
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [selectedInvitation, setSelectedInvitation] = useState<ProjectInvitation | null>(null);

    const { post, processing } = useForm();

    const handleResend = (invitation: ProjectInvitation) => {
        post(route('invitations.resend', invitation.id), {
            preserveScroll: true,
        });
    };

    const handleCancel = (invitation: ProjectInvitation) => {
        setSelectedInvitation(invitation);
        setCancelDialogOpen(true);
    };

    const confirmCancel = () => {
        if (selectedInvitation) {
            post(route('invitations.cancel', selectedInvitation.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setCancelDialogOpen(false);
                    setSelectedInvitation(null);
                },
            });
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const isExpired = (invitation: ProjectInvitation) => {
        return invitation.status === 'pending' && new Date(invitation.expires_at) < new Date();
    };

    if (invitations.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Project Invitations</CardTitle>
                    <CardDescription>
                        No invitations have been sent for this project yet.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Project Invitations</CardTitle>
                <CardDescription>
                    Manage pending and completed invitations for this project.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {invitations.map((invitation) => {
                    const statusInfo = statusConfig[invitation.status];
                    const StatusIcon = statusInfo.icon;
                    const RoleIcon = roleIcons[invitation.role];
                    const expired = isExpired(invitation);

                    return (
                        <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4 flex-1">
                                {invitation.invited_user ? (
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={invitation.invited_user.avatar} alt={invitation.invited_user.name} />
                                        <AvatarFallback className="text-sm">
                                            {getShortName(invitation.invited_user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                        <Mail className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="font-medium truncate">
                                            {invitation.invited_user?.name || invitation.email}
                                        </div>
                                        <Badge variant="outline" className="flex items-center gap-1">
                                            <RoleIcon className="h-3 w-3" />
                                            {invitation.role}
                                        </Badge>
                                    </div>
                                    
                                    {invitation.invited_user && invitation.invited_user.email !== invitation.email && (
                                        <div className="text-sm text-muted-foreground truncate">
                                            {invitation.email}
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                        <span>Invited by {invitation.invited_by.name}</span>
                                        <span>•</span>
                                        <span>{formatDate(invitation.created_at)}</span>
                                        {invitation.status === 'pending' && (
                                            <>
                                                <span>•</span>
                                                <span className={expired ? 'text-red-600' : ''}>
                                                    Expires {formatDate(invitation.expires_at)}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {invitation.message && (
                                        <div className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded italic">
                                            "{invitation.message}"
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    <Badge 
                                        variant="outline" 
                                        className={`flex items-center gap-1 ${statusInfo.color}`}
                                    >
                                        <StatusIcon className="h-3 w-3" />
                                        {expired ? 'Expired' : statusInfo.label}
                                    </Badge>

                                    {canManageMembers && invitation.status === 'pending' && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem 
                                                    onClick={() => handleResend(invitation)}
                                                    disabled={processing}
                                                >
                                                    <RefreshCw className="h-4 w-4 mr-2" />
                                                    Resend Invitation
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    onClick={() => handleCancel(invitation)}
                                                    disabled={processing}
                                                    className="text-red-600"
                                                >
                                                    <X className="h-4 w-4 mr-2" />
                                                    Cancel Invitation
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </CardContent>

            <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel the invitation for {selectedInvitation?.email}? 
                            This action cannot be undone, but you can send a new invitation later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Invitation</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmCancel}
                            disabled={processing}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Cancel Invitation
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
