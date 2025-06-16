import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
    AlertTriangle, 
    Clock, 
    CheckCircle, 
    XCircle, 
    RefreshCw,
    Crown,
    Edit,
    Eye
} from 'lucide-react';
import { route } from 'ziggy-js';
import { useShortName } from '@/hooks/use-initials';

interface PendingAttentionProps {
    pendingAttention: {
        expiringSoon: Array<{
            id: number;
            email: string;
            role: string;
            expires_at: string;
            project: { id: number; name: string };
            invited_user?: { id: number; name: string; avatar?: string };
        }>;
        pendingReceived: Array<{
            id: number;
            email: string;
            role: string;
            expires_at: string;
            token: string;
            project: { id: number; name: string };
            invited_by: { id: number; name: string };
        }>;
    };
}

const roleIcons = {
    admin: Crown,
    editor: Edit,
    viewer: Eye,
};

export function PendingAttention({ pendingAttention }: PendingAttentionProps) {
    const getShortName = useShortName();
    const { post, processing } = useForm();
    const [processingId, setProcessingId] = useState<number | null>(null);

    const formatTimeUntilExpiry = (expiresAt: string) => {
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diffInHours = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60));
        
        if (diffInHours < 1) {
            const diffInMinutes = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60));
            return `${Math.max(0, diffInMinutes)}m`;
        } else if (diffInHours < 24) {
            return `${diffInHours}h`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays}d`;
        }
    };

    const handleResend = (invitationId: number) => {
        setProcessingId(invitationId);
        post(route('invitations.resend', invitationId), {
            preserveScroll: true,
            onFinish: () => setProcessingId(null),
        });
    };

    const handleAccept = (token: string) => {
        post(route('invitations.accept', token));
    };

    const handleDecline = (token: string) => {
        post(route('invitations.decline', token));
    };

    const totalItems = pendingAttention.expiringSoon.length + pendingAttention.pendingReceived.length;

    if (totalItems === 0) {
        return null;
    }

    return (
        <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <CardTitle className="text-lg text-orange-900">
                        Needs Attention ({totalItems})
                    </CardTitle>
                </div>
                <CardDescription className="text-orange-700">
                    Invitations that require immediate action
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Expiring Soon */}
                {pendingAttention.expiringSoon.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <span className="font-medium text-orange-900">
                                Expiring Soon ({pendingAttention.expiringSoon.length})
                            </span>
                        </div>
                        
                        {pendingAttention.expiringSoon.map((invitation) => {
                            const RoleIcon = roleIcons[invitation.role as keyof typeof roleIcons];
                            const timeLeft = formatTimeUntilExpiry(invitation.expires_at);
                            
                            return (
                                <div key={invitation.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                                    <div className="flex items-center gap-3">
                                        {invitation.invited_user ? (
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={invitation.invited_user.avatar} />
                                                <AvatarFallback className="text-xs">
                                                    {getShortName(invitation.invited_user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                                                <span className="text-xs font-medium text-orange-700">
                                                    {invitation.email.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm">
                                                    {invitation.invited_user?.name || invitation.email}
                                                </span>
                                                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                                    <RoleIcon className="h-3 w-3" />
                                                    {invitation.role}
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {invitation.project.name} • Expires in {timeLeft}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleResend(invitation.id)}
                                        disabled={processing || processingId === invitation.id}
                                        className="text-orange-700 border-orange-300 hover:bg-orange-100"
                                    >
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Resend
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pending Received */}
                {pendingAttention.pendingReceived.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-900">
                                Awaiting Your Response ({pendingAttention.pendingReceived.length})
                            </span>
                        </div>
                        
                        {pendingAttention.pendingReceived.map((invitation) => {
                            const RoleIcon = roleIcons[invitation.role as keyof typeof roleIcons];
                            const timeLeft = formatTimeUntilExpiry(invitation.expires_at);
                            
                            return (
                                <div key={invitation.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                                            {invitation.project.name.charAt(0).toUpperCase()}
                                        </div>
                                        
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm">
                                                    {invitation.project.name}
                                                </span>
                                                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                                    <RoleIcon className="h-3 w-3" />
                                                    {invitation.role}
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                From {invitation.invited_by.name} • Expires in {timeLeft}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDecline(invitation.token)}
                                            disabled={processing}
                                            className="text-red-700 border-red-300 hover:bg-red-100"
                                        >
                                            <XCircle className="h-3 w-3 mr-1" />
                                            Decline
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => handleAccept(invitation.token)}
                                            disabled={processing}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Accept
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
