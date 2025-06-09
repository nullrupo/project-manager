import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    Send, 
    Inbox, 
    CheckCircle, 
    XCircle, 
    Clock, 
    AlertTriangle,
    TrendingUp,
    TrendingDown
} from 'lucide-react';

interface InvitationStatsCardsProps {
    analytics: {
        sent: {
            total: number;
            pending: number;
            accepted: number;
            declined: number;
            expired: number;
            cancelled: number;
        };
        received: {
            total: number;
            pending: number;
            accepted: number;
            declined: number;
            expired: number;
        };
    };
}

export function InvitationStatsCards({ analytics }: InvitationStatsCardsProps) {
    const sentAcceptanceRate = analytics.sent.total > 0 
        ? Math.round((analytics.sent.accepted / analytics.sent.total) * 100)
        : 0;

    const receivedAcceptanceRate = analytics.received.total > 0 
        ? Math.round((analytics.received.accepted / analytics.received.total) * 100)
        : 0;

    const cards = [
        {
            title: 'Sent Invitations',
            value: analytics.sent.total,
            icon: Send,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
            details: [
                { label: 'Pending', value: analytics.sent.pending, color: 'bg-yellow-100 text-yellow-800' },
                { label: 'Accepted', value: analytics.sent.accepted, color: 'bg-green-100 text-green-800' },
                { label: 'Declined', value: analytics.sent.declined, color: 'bg-red-100 text-red-800' },
            ],
            metric: {
                label: 'Acceptance Rate',
                value: `${sentAcceptanceRate}%`,
                trend: sentAcceptanceRate >= 70 ? 'up' : sentAcceptanceRate >= 50 ? 'neutral' : 'down'
            }
        },
        {
            title: 'Received Invitations',
            value: analytics.received.total,
            icon: Inbox,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
            details: [
                { label: 'Pending', value: analytics.received.pending, color: 'bg-yellow-100 text-yellow-800' },
                { label: 'Accepted', value: analytics.received.accepted, color: 'bg-green-100 text-green-800' },
                { label: 'Declined', value: analytics.received.declined, color: 'bg-red-100 text-red-800' },
            ],
            metric: {
                label: 'Response Rate',
                value: `${receivedAcceptanceRate}%`,
                trend: receivedAcceptanceRate >= 80 ? 'up' : receivedAcceptanceRate >= 60 ? 'neutral' : 'down'
            }
        },
        {
            title: 'Pending Actions',
            value: analytics.sent.pending + analytics.received.pending,
            icon: Clock,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
            details: [
                { label: 'Sent Pending', value: analytics.sent.pending, color: 'bg-blue-100 text-blue-800' },
                { label: 'Received Pending', value: analytics.received.pending, color: 'bg-purple-100 text-purple-800' },
            ],
            metric: {
                label: 'Need Attention',
                value: analytics.sent.expired + analytics.received.expired,
                trend: 'neutral'
            }
        },
        {
            title: 'Success Rate',
            value: analytics.sent.accepted + analytics.received.accepted,
            icon: CheckCircle,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-100',
            details: [
                { label: 'Sent Accepted', value: analytics.sent.accepted, color: 'bg-green-100 text-green-800' },
                { label: 'Received Accepted', value: analytics.received.accepted, color: 'bg-emerald-100 text-emerald-800' },
            ],
            metric: {
                label: 'Overall Success',
                value: `${Math.round(((analytics.sent.accepted + analytics.received.accepted) / 
                    Math.max(analytics.sent.total + analytics.received.total, 1)) * 100)}%`,
                trend: 'up'
            }
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, index) => {
                const Icon = card.icon;
                const TrendIcon = card.metric.trend === 'up' ? TrendingUp : 
                                 card.metric.trend === 'down' ? TrendingDown : Clock;
                
                return (
                    <Card key={index} className="relative overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {card.title}
                            </CardTitle>
                            <div className={`p-2 rounded-lg ${card.bgColor}`}>
                                <Icon className={`h-4 w-4 ${card.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="text-2xl font-bold">{card.value}</div>
                            
                            {/* Details */}
                            <div className="flex flex-wrap gap-1">
                                {card.details.map((detail, detailIndex) => (
                                    <Badge 
                                        key={detailIndex}
                                        variant="outline" 
                                        className={`text-xs ${detail.color} border-0`}
                                    >
                                        {detail.label}: {detail.value}
                                    </Badge>
                                ))}
                            </div>

                            {/* Metric */}
                            <div className="flex items-center justify-between pt-2 border-t">
                                <span className="text-xs text-muted-foreground">
                                    {card.metric.label}
                                </span>
                                <div className="flex items-center gap-1">
                                    <TrendIcon className={`h-3 w-3 ${
                                        card.metric.trend === 'up' ? 'text-green-600' :
                                        card.metric.trend === 'down' ? 'text-red-600' :
                                        'text-gray-600'
                                    }`} />
                                    <span className="text-xs font-medium">
                                        {card.metric.value}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
