import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    Mail, 
    Send, 
    Inbox, 
    TrendingUp, 
    Users, 
    Clock, 
    CheckCircle, 
    XCircle, 
    AlertTriangle,
    BarChart3,
    Filter,
    Calendar,
    UserPlus
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { InvitationStatsCards } from '@/components/invitations/invitation-stats-cards';
import { InvitationList } from '@/components/invitations/invitation-list';
import { InvitationChart } from '@/components/invitations/invitation-chart';
import { RecentActivity } from '@/components/invitations/recent-activity';
import { PendingAttention } from '@/components/invitations/pending-attention';

interface InvitationDashboardProps {
    sentInvitations: any;
    receivedInvitations: any;
    analytics: {
        sent: any;
        received: any;
        roleDistribution: Record<string, number>;
        acceptanceRate: Array<{
            period: string;
            rate: number;
            total: number;
            accepted: number;
        }>;
        activeProjects: Array<{
            project: { id: number; name: string };
            invitation_count: number;
        }>;
    };
    recentActivity: Array<{
        id: number;
        type: 'sent' | 'received';
        action: string;
        project: string;
        user: string;
        date: string;
        role: string;
    }>;
    pendingAttention: {
        expiringSoon: any[];
        pendingReceived: any[];
    };
    filters: {
        filter: string;
        status: string;
        timeframe: string;
    };
}

export default function InvitationDashboard({
    sentInvitations,
    receivedInvitations,
    analytics,
    recentActivity,
    pendingAttention,
    filters
}: InvitationDashboardProps) {
    const [activeTab, setActiveTab] = useState('overview');

    const handleFilterChange = (key: string, value: string) => {
        router.get(route('invitations.dashboard'), {
            ...filters,
            [key]: value,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const totalPendingAttention = pendingAttention.expiringSoon.length + pendingAttention.pendingReceived.length;

    return (
        <AppLayout>
            <Head title="Invitation Dashboard" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <UserPlus className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Invitation Dashboard</h1>
                            <p className="text-muted-foreground">
                                Manage and track all your project invitations
                            </p>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.get(route('projects.index'))}
                        >
                            <Send className="h-4 w-4 mr-2" />
                            Send Invitations
                        </Button>
                        
                        {totalPendingAttention > 0 && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {totalPendingAttention} need attention
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                <span className="font-medium">Filters</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Select value={filters.timeframe} onValueChange={(value) => handleFilterChange('timeframe', value)}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7">Last 7 days</SelectItem>
                                        <SelectItem value="30">Last 30 days</SelectItem>
                                        <SelectItem value="90">Last 90 days</SelectItem>
                                        <SelectItem value="all">All time</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="accepted">Accepted</SelectItem>
                                        <SelectItem value="declined">Declined</SelectItem>
                                        <SelectItem value="expired">Expired</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Main Content */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview" className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="sent" className="flex items-center gap-2">
                            <Send className="h-4 w-4" />
                            Sent ({analytics.sent.total})
                        </TabsTrigger>
                        <TabsTrigger value="received" className="flex items-center gap-2">
                            <Inbox className="h-4 w-4" />
                            Received ({analytics.received.total})
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Analytics
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* Stats Cards */}
                        <InvitationStatsCards analytics={analytics} />

                        {/* Pending Attention */}
                        {totalPendingAttention > 0 && (
                            <PendingAttention pendingAttention={pendingAttention} />
                        )}

                        {/* Recent Activity */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <RecentActivity activities={recentActivity} />
                            
                            {/* Quick Stats */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Quick Stats</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Acceptance Rate</span>
                                        <span className="font-medium">
                                            {analytics.sent.total > 0 
                                                ? Math.round((analytics.sent.accepted / analytics.sent.total) * 100)
                                                : 0}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Most Used Role</span>
                                        <span className="font-medium">
                                            {Object.entries(analytics.roleDistribution)
                                                .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Active Projects</span>
                                        <span className="font-medium">{analytics.activeProjects.length}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="sent" className="space-y-6">
                        <InvitationList 
                            invitations={sentInvitations} 
                            type="sent"
                            onFilterChange={handleFilterChange}
                        />
                    </TabsContent>

                    <TabsContent value="received" className="space-y-6">
                        <InvitationList 
                            invitations={receivedInvitations} 
                            type="received"
                            onFilterChange={handleFilterChange}
                        />
                    </TabsContent>

                    <TabsContent value="analytics" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <InvitationChart 
                                data={analytics.acceptanceRate}
                                title="Acceptance Rate Trend"
                                type="line"
                            />
                            
                            <InvitationChart 
                                data={Object.entries(analytics.roleDistribution).map(([role, count]) => ({
                                    name: role,
                                    value: count
                                }))}
                                title="Role Distribution"
                                type="pie"
                            />
                        </div>

                        {/* Active Projects */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Most Active Projects</CardTitle>
                                <CardDescription>
                                    Projects with the most invitations sent
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {analytics.activeProjects.map((project, index) => (
                                        <div key={project.project.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                                    {index + 1}
                                                </div>
                                                <span className="font-medium">{project.project.name}</span>
                                            </div>
                                            <Badge variant="secondary">
                                                {project.invitation_count} invitations
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
