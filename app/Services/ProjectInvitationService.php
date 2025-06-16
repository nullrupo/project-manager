<?php

namespace App\Services;

use App\Models\Project;
use App\Models\ProjectInvitation;
use App\Models\User;
use App\Mail\ProjectInvitationMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ProjectInvitationService
{
    /**
     * Send invitation to a user for a project.
     */
    public static function sendInvitation(
        Project $project,
        string $email,
        string $role = 'viewer',
        array $customPermissions = [],
        string $message = null,
        int $expiryDays = 7
    ): ProjectInvitation {
        // Check if user exists
        $invitedUser = User::where('email', $email)->first();
        
        // Check if user is already a member
        if ($invitedUser && self::isUserAlreadyMember($project, $invitedUser)) {
            throw new \Exception("User is already a member of this project.");
        }

        // Check for existing pending invitation
        $existingInvitation = ProjectInvitation::where('project_id', $project->id)
            ->where('email', $email)
            ->where('status', 'pending')
            ->first();

        if ($existingInvitation && !$existingInvitation->isExpired()) {
            throw new \Exception("A pending invitation already exists for this email.");
        }

        // Cancel existing pending invitation if expired
        if ($existingInvitation) {
            $existingInvitation->update(['status' => 'expired']);
        }

        // Get permissions (use custom or defaults)
        $permissions = empty($customPermissions) 
            ? ProjectPermissionService::getDefaultPermissions($role)
            : array_merge(ProjectPermissionService::getDefaultPermissions($role), $customPermissions);

        // Create invitation
        $invitation = ProjectInvitation::create([
            'project_id' => $project->id,
            'invited_by' => Auth::id(),
            'invited_user_id' => $invitedUser?->id,
            'email' => $email,
            'role' => $role,
            'can_manage_members' => $permissions['can_manage_members'] ?? null,
            'can_manage_boards' => $permissions['can_manage_boards'] ?? null,
            'can_manage_tasks' => $permissions['can_manage_tasks'] ?? null,
            'can_manage_labels' => $permissions['can_manage_labels'] ?? null,
            'can_view_project' => $permissions['can_view_project'] ?? null,
            'can_comment' => $permissions['can_comment'] ?? null,
            'expires_at' => Carbon::now()->addDays($expiryDays),
            'message' => $message,
        ]);

        // Send email notification
        try {
            Mail::to($email)->send(new ProjectInvitationMail($invitation));
        } catch (\Exception $e) {
            // Log error but don't fail the invitation
            \Log::error('Failed to send invitation email: ' . $e->getMessage());
        }

        return $invitation;
    }

    /**
     * Send bulk invitations to multiple users for multiple projects.
     */
    public static function sendBulkInvitations(
        array $projectIds,
        array $emails,
        string $role = 'viewer',
        array $customPermissions = [],
        string $message = null
    ): array {
        $results = [
            'successful' => [],
            'failed' => [],
        ];

        foreach ($projectIds as $projectId) {
            $project = Project::find($projectId);
            
            if (!$project || !ProjectPermissionService::can($project, 'can_manage_members')) {
                $results['failed'][] = [
                    'project' => $project?->name ?? "Project ID: $projectId",
                    'error' => 'Permission denied or project not found'
                ];
                continue;
            }

            foreach ($emails as $email) {
                try {
                    $invitation = self::sendInvitation($project, $email, $role, $customPermissions, $message);
                    $results['successful'][] = [
                        'project' => $project->name,
                        'email' => $email,
                        'invitation_id' => $invitation->id
                    ];
                } catch (\Exception $e) {
                    $results['failed'][] = [
                        'project' => $project->name,
                        'email' => $email,
                        'error' => $e->getMessage()
                    ];
                }
            }
        }

        return $results;
    }

    /**
     * Accept an invitation.
     */
    public static function acceptInvitation(string $token): bool
    {
        $invitation = ProjectInvitation::where('token', $token)
            ->where('status', 'pending')
            ->first();

        if (!$invitation || $invitation->isExpired()) {
            return false;
        }

        // Get or create user
        $user = $invitation->invitedUser ?? User::where('email', $invitation->email)->first();
        
        if (!$user) {
            // For now, require user to exist. In future, could redirect to registration
            return false;
        }

        // Check if user is already a member
        if (self::isUserAlreadyMember($invitation->project, $user)) {
            $invitation->update(['status' => 'accepted', 'responded_at' => now()]);
            return true;
        }

        // Add user to project
        $permissions = array_filter($invitation->getPermissions(), fn($value) => $value !== null);
        ProjectPermissionService::addUserToProject($invitation->project, $user, $invitation->role, $permissions);

        // Mark invitation as accepted
        $invitation->update(['status' => 'accepted', 'responded_at' => now()]);

        return true;
    }

    /**
     * Decline an invitation.
     */
    public static function declineInvitation(string $token): bool
    {
        $invitation = ProjectInvitation::where('token', $token)
            ->where('status', 'pending')
            ->first();

        if (!$invitation) {
            return false;
        }

        $invitation->update(['status' => 'declined', 'responded_at' => now()]);
        return true;
    }

    /**
     * Cancel an invitation.
     */
    public static function cancelInvitation(ProjectInvitation $invitation): bool
    {
        if ($invitation->status !== 'pending') {
            return false;
        }

        $invitation->update(['status' => 'cancelled']);
        return true;
    }

    /**
     * Resend an invitation.
     */
    public static function resendInvitation(ProjectInvitation $invitation): bool
    {
        if ($invitation->status !== 'pending') {
            return false;
        }

        // Extend expiry
        $invitation->update(['expires_at' => Carbon::now()->addDays(7)]);

        // Resend email
        try {
            Mail::to($invitation->email)->send(new ProjectInvitationMail($invitation));
            return true;
        } catch (\Exception $e) {
            \Log::error('Failed to resend invitation email: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if user is already a member of the project.
     */
    private static function isUserAlreadyMember(Project $project, User $user): bool
    {
        return $project->owner_id === $user->id || 
               $project->members()->where('user_id', $user->id)->exists();
    }

    /**
     * Clean up expired invitations.
     */
    public static function cleanupExpiredInvitations(): int
    {
        return ProjectInvitation::expired()->update(['status' => 'expired']);
    }
}
