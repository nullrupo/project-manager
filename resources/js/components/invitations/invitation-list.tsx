import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    Mail, 
    MoreHorizontal, 
    RefreshCw, 
    X, 
    Clock, 
    CheckCircle, 
    XCircle, 
    AlertTriangle,
    Crown,
    Edit,
    Eye,
    ExternalLink
} from 'lucide-react';
import { route } from 'ziggy-js';
import { useShortName } from '@/hooks/use-initials';

interface InvitationListProps {
    invitations: {
        data: Array<{
            id: number;
            email: string;
            role: string;
            status: string;
            expires_at: string;
            created_at: string;
            project?: { id: number; name: string };
            invited_by?: { id: number; name: string };
            invited_user?: { id: number; name: string; avatar?: string };
            token?: string;
        }>;
        links: any;
        meta: any;
    };
    type: 'sent' | 'received';
    onFilterChange: (key: string, value: string) => void;
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
        icon: AlertTriangle, 
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

export function InvitationList({ invitations, type, onFilterChange }: InvitationListProps) {
    const getShortName = useShortName();
    const { post, processing } = useForm();
    const [processingId, setProcessingId] = useState<number | null>(null);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const isExpired = (invitation: any) => {
        return invitation.status === 'pending' && new Date(invitation.expires_at) < new Date();
    };

    const handleResend = (invitationId: number) => {
        setProcessingId(invitationId);
        post(route('invitations.resend', invitationId), {
            preserveScroll: true,
            onFinish: () => setProcessingId(null),
        });
    };

    const handleCancel = (invitationId: number) => {
        if (confirm('Are you sure you want to cancel this invitation?')) {
            setProcessingId(invitationId);
            post(route('invitations.cancel', invitationId), {
                preserveScroll: true,
                onFinish: () => setProcessingId(null),
            });
        }
    };

    const handleAccept = (token: string) => {
        post(route('invitations.accept', token));
    };

    const handleDecline = (token: string) => {
        post(route('invitations.decline', token));
    };

    if (invitations.data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        {type === 'sent' ? 'Sent Invitations' : 'Received Invitations'}
                    </CardTitle>
                    <CardDescription>
                        No {type} invitations found.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">
                    {type === 'sent' ? 'Sent Invitations' : 'Received Invitations'}
                </CardTitle>
                <CardDescription>
                    {invitations.meta.total} total invitations
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {invitations.data.map((invitation) => {
                    const statusInfo = statusConfig[invitation.status as keyof typeof statusConfig];
                    const StatusIcon = statusInfo?.icon || Clock;
                    const RoleIcon = roleIcons[invitation.role as keyof typeof roleIcons] || Eye;
                    const expired = isExpired(invitation);

                    return (
                        <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4 flex-1">
                                {/* Avatar */}
                                {type === 'sent' ? (
                                    invitation.invited_user ? (
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
                                    )
                                ) : (
                                    <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                        {invitation.project?.name.charAt(0).toUpperCase()}
                                    </div>
                                )}

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="font-medium truncate">
                                            {type === 'sent' 
                                                ? (invitation.invited_user?.name || invitation.email)
                                                : invitation.project?.name
                                            }
                                        </div>
                                        <Badge variant="outline" className="flex items-center gap-1">
                                            <RoleIcon className="h-3 w-3" />
                                            {invitation.role}
                                        </Badge>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span>
                                            {type === 'sent' 
                                                ? `To ${invitation.project?.name}`
                                                : `From ${invitation.invited_by?.name}`
                                            }
                                        </span>
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
                                </div>

                                {/* Status */}
                                <Badge 
                                    variant="outline" 
                                    className={`flex items-center gap-1 ${statusInfo?.color || 'bg-gray-100 text-gray-800'}`}
                                >
                                    <StatusIcon className="h-3 w-3" />
                                    {expired ? 'Expired' : statusInfo?.label || invitation.status}
                                </Badge>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    {type === 'sent' && invitation.status === 'pending' && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem 
                                                    onClick={() => handleResend(invitation.id)}
                                                    disabled={processing || processingId === invitation.id}
                                                >
                                                    <RefreshCw className="h-4 w-4 mr-2" />
                                                    Resend
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    onClick={() => handleCancel(invitation.id)}
                                                    disabled={processing || processingId === invitation.id}
                                                    className="text-red-600"
                                                >
                                                    <X className="h-4 w-4 mr-2" />
                                                    Cancel
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}

                                    {type === 'received' && invitation.status === 'pending' && !expired && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDecline(invitation.token!)}
                                                disabled={processing}
                                            >
                                                Decline
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handleAccept(invitation.token!)}
                                                disabled={processing}
                                            >
                                                Accept
                                            </Button>
                                        </div>
                                    )}

                                    {invitation.token && invitation.status === 'pending' && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => window.open(route('invitations.show', invitation.token), '_blank')}
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Pagination */}
                {invitations.links && (
                    <div className="flex items-center justify-between pt-4">
                        <div className="text-sm text-muted-foreground">
                            Showing {invitations.meta.from} to {invitations.meta.to} of {invitations.meta.total} results
                        </div>
                        <div className="flex items-center gap-2">
                            {invitations.links.map((link: any, index: number) => (
                                <Button
                                    key={index}
                                    variant={link.active ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => {
                                        if (link.url) {
                                            const url = new URL(link.url);
                                            const page = url.searchParams.get('page');
                                            if (page) {
                                                onFilterChange('page', page);
                                            }
                                        }
                                    }}
                                    disabled={!link.url}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
