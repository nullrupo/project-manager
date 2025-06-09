import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
    CheckCircle, 
    XCircle, 
    Clock, 
    AlertTriangle,
    Send,
    Inbox,
    Crown,
    Edit,
    Eye
} from 'lucide-react';
import { useShortName } from '@/hooks/use-initials';

interface RecentActivityProps {
    activities: Array<{
        id: number;
        type: 'sent' | 'received';
        action: string;
        project: string;
        user: string;
        date: string;
        role: string;
    }>;
}

const actionConfig = {
    accepted: { 
        icon: CheckCircle, 
        color: 'text-green-600 bg-green-100',
        label: 'Accepted' 
    },
    declined: { 
        icon: XCircle, 
        color: 'text-red-600 bg-red-100',
        label: 'Declined' 
    },
    expired: { 
        icon: AlertTriangle, 
        color: 'text-orange-600 bg-orange-100',
        label: 'Expired' 
    },
    cancelled: { 
        icon: XCircle, 
        color: 'text-gray-600 bg-gray-100',
        label: 'Cancelled' 
    },
};

const roleIcons = {
    admin: Crown,
    editor: Edit,
    viewer: Eye,
};

export function RecentActivity({ activities }: RecentActivityProps) {
    const getShortName = useShortName();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        
        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }
    };

    if (activities.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                    <CardDescription>
                        No recent invitation activity to display
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>
                    Latest invitation responses and updates
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {activities.map((activity) => {
                    const actionInfo = actionConfig[activity.action as keyof typeof actionConfig];
                    const ActionIcon = actionInfo?.icon || Clock;
                    const RoleIcon = roleIcons[activity.role as keyof typeof roleIcons] || Eye;
                    const TypeIcon = activity.type === 'sent' ? Send : Inbox;

                    return (
                        <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card">
                            {/* Action Icon */}
                            <div className={`p-2 rounded-full ${actionInfo?.color || 'text-gray-600 bg-gray-100'}`}>
                                <ActionIcon className="h-4 w-4" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <TypeIcon className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-sm font-medium">
                                        {activity.type === 'sent' ? 'Invitation sent to' : 'You'} {activity.user}
                                    </span>
                                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                        <RoleIcon className="h-3 w-3" />
                                        {activity.role}
                                    </Badge>
                                </div>
                                
                                <div className="text-sm text-muted-foreground">
                                    {actionInfo?.label || activity.action} • {activity.project}
                                </div>
                            </div>

                            {/* Timestamp */}
                            <div className="text-xs text-muted-foreground">
                                {formatDate(activity.date)}
                            </div>
                        </div>
                    );
                })}

                {activities.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No recent activity</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
