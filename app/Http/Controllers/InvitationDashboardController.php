<?php

namespace App\Http\Controllers;

use App\Models\ProjectInvitation;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class InvitationDashboardController extends Controller
{
    /**
     * Display the invitation dashboard.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        
        // Get filter parameters
        $filter = $request->get('filter', 'all'); // all, sent, received
        $status = $request->get('status', 'all'); // all, pending, accepted, declined, expired
        $timeframe = $request->get('timeframe', '30'); // 7, 30, 90, all
        
        // Base query for user's invitations
        $sentInvitations = $this->getSentInvitations($user, $status, $timeframe);
        $receivedInvitations = $this->getReceivedInvitations($user, $status, $timeframe);
        
        // Get analytics data
        $analytics = $this->getInvitationAnalytics($user, $timeframe);
        
        // Get recent activity
        $recentActivity = $this->getRecentActivity($user, 10);
        
        // Get pending invitations requiring attention
        $pendingAttention = $this->getPendingAttention($user);

        return Inertia::render('invitations/dashboard', [
            'sentInvitations' => $sentInvitations,
            'receivedInvitations' => $receivedInvitations,
            'analytics' => $analytics,
            'recentActivity' => $recentActivity,
            'pendingAttention' => $pendingAttention,
            'filters' => [
                'filter' => $filter,
                'status' => $status,
                'timeframe' => $timeframe,
            ],
        ]);
    }

    /**
     * Get sent invitations for the user.
     */
    private function getSentInvitations(User $user, string $status, string $timeframe)
    {
        $query = ProjectInvitation::with(['project:id,name', 'invitedUser:id,name,email'])
            ->where('invited_by', $user->id);

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        if ($timeframe !== 'all') {
            $query->where('created_at', '>=', Carbon::now()->subDays((int)$timeframe));
        }

        return $query->orderBy('created_at', 'desc')
            ->paginate(10, ['*'], 'sent_page');
    }

    /**
     * Get received invitations for the user.
     */
    private function getReceivedInvitations(User $user, string $status, string $timeframe)
    {
        $query = ProjectInvitation::with(['project:id,name', 'invitedBy:id,name,email'])
            ->where(function ($q) use ($user) {
                $q->where('invited_user_id', $user->id)
                  ->orWhere('email', $user->email);
            });

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        if ($timeframe !== 'all') {
            $query->where('created_at', '>=', Carbon::now()->subDays((int)$timeframe));
        }

        return $query->orderBy('created_at', 'desc')
            ->paginate(10, ['*'], 'received_page');
    }

    /**
     * Get invitation analytics.
     */
    private function getInvitationAnalytics(User $user, string $timeframe)
    {
        $timeConstraint = $timeframe !== 'all' 
            ? ['created_at', '>=', Carbon::now()->subDays((int)$timeframe)]
            : ['id', '>', 0];

        // Sent invitations analytics
        $sentStats = ProjectInvitation::where('invited_by', $user->id)
            ->where(...$timeConstraint)
            ->selectRaw('
                COUNT(*) as total,
                SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = "accepted" THEN 1 ELSE 0 END) as accepted,
                SUM(CASE WHEN status = "declined" THEN 1 ELSE 0 END) as declined,
                SUM(CASE WHEN status = "expired" THEN 1 ELSE 0 END) as expired,
                SUM(CASE WHEN status = "cancelled" THEN 1 ELSE 0 END) as cancelled
            ')
            ->first();

        // Received invitations analytics
        $receivedStats = ProjectInvitation::where(function ($q) use ($user) {
                $q->where('invited_user_id', $user->id)
                  ->orWhere('email', $user->email);
            })
            ->where(...$timeConstraint)
            ->selectRaw('
                COUNT(*) as total,
                SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = "accepted" THEN 1 ELSE 0 END) as accepted,
                SUM(CASE WHEN status = "declined" THEN 1 ELSE 0 END) as declined,
                SUM(CASE WHEN status = "expired" THEN 1 ELSE 0 END) as expired
            ')
            ->first();

        // Role distribution for sent invitations
        $roleDistribution = ProjectInvitation::where('invited_by', $user->id)
            ->where(...$timeConstraint)
            ->selectRaw('role, COUNT(*) as count')
            ->groupBy('role')
            ->pluck('count', 'role')
            ->toArray();

        // Acceptance rate over time (last 12 weeks)
        $acceptanceRate = ProjectInvitation::where('invited_by', $user->id)
            ->where('created_at', '>=', Carbon::now()->subWeeks(12))
            ->selectRaw('
                WEEK(created_at) as week,
                YEAR(created_at) as year,
                COUNT(*) as total,
                SUM(CASE WHEN status = "accepted" THEN 1 ELSE 0 END) as accepted
            ')
            ->groupBy('year', 'week')
            ->orderBy('year', 'desc')
            ->orderBy('week', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'period' => "Week {$item->week}, {$item->year}",
                    'rate' => $item->total > 0 ? round(($item->accepted / $item->total) * 100, 1) : 0,
                    'total' => $item->total,
                    'accepted' => $item->accepted,
                ];
            });

        // Most active projects
        $activeProjects = ProjectInvitation::where('invited_by', $user->id)
            ->where(...$timeConstraint)
            ->with('project:id,name')
            ->selectRaw('project_id, COUNT(*) as invitation_count')
            ->groupBy('project_id')
            ->orderBy('invitation_count', 'desc')
            ->limit(5)
            ->get();

        return [
            'sent' => $sentStats,
            'received' => $receivedStats,
            'roleDistribution' => $roleDistribution,
            'acceptanceRate' => $acceptanceRate,
            'activeProjects' => $activeProjects,
        ];
    }

    /**
     * Get recent invitation activity.
     */
    private function getRecentActivity(User $user, int $limit = 10)
    {
        return ProjectInvitation::with(['project:id,name', 'invitedBy:id,name', 'invitedUser:id,name'])
            ->where(function ($q) use ($user) {
                $q->where('invited_by', $user->id)
                  ->orWhere('invited_user_id', $user->id)
                  ->orWhere('email', $user->email);
            })
            ->whereIn('status', ['accepted', 'declined', 'expired', 'cancelled'])
            ->orderBy('responded_at', 'desc')
            ->orderBy('updated_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($invitation) use ($user) {
                $isSent = $invitation->invited_by === $user->id;
                return [
                    'id' => $invitation->id,
                    'type' => $isSent ? 'sent' : 'received',
                    'action' => $invitation->status,
                    'project' => $invitation->project->name,
                    'user' => $isSent 
                        ? ($invitation->invitedUser->name ?? $invitation->email)
                        : $invitation->invitedBy->name,
                    'date' => $invitation->responded_at ?? $invitation->updated_at,
                    'role' => $invitation->role,
                ];
            });
    }

    /**
     * Get pending invitations requiring attention.
     */
    private function getPendingAttention(User $user)
    {
        // Pending invitations about to expire (within 24 hours)
        $expiringSoon = ProjectInvitation::where('invited_by', $user->id)
            ->where('status', 'pending')
            ->where('expires_at', '<=', Carbon::now()->addDay())
            ->where('expires_at', '>', Carbon::now())
            ->with(['project:id,name', 'invitedUser:id,name'])
            ->get();

        // Pending invitations received by user
        $pendingReceived = ProjectInvitation::where(function ($q) use ($user) {
                $q->where('invited_user_id', $user->id)
                  ->orWhere('email', $user->email);
            })
            ->where('status', 'pending')
            ->where('expires_at', '>', Carbon::now())
            ->with(['project:id,name', 'invitedBy:id,name'])
            ->get();

        return [
            'expiringSoon' => $expiringSoon,
            'pendingReceived' => $pendingReceived,
        ];
    }

    /**
     * Get invitation statistics for API.
     */
    public function stats(Request $request)
    {
        $user = Auth::user();
        $timeframe = $request->get('timeframe', '30');
        
        $analytics = $this->getInvitationAnalytics($user, $timeframe);
        
        return response()->json($analytics);
    }
}
