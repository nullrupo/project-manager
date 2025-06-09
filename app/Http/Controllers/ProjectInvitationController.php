<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectInvitation;
use App\Services\ProjectInvitationService;
use App\Services\ProjectPermissionService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProjectInvitationController extends Controller
{
    /**
     * Send invitation to join a project.
     */
    public function store(Request $request, Project $project): RedirectResponse
    {
        // Check permissions
        if (!ProjectPermissionService::can($project, 'can_manage_members')) {
            abort(403, 'You do not have permission to invite members to this project.');
        }

        $validated = $request->validate([
            'email' => 'required|email',
            'role' => 'required|string|in:admin,editor,viewer',
            'message' => 'nullable|string|max:500',
            'custom_permissions' => 'nullable|array',
            'custom_permissions.can_manage_members' => 'nullable|boolean',
            'custom_permissions.can_manage_boards' => 'nullable|boolean',
            'custom_permissions.can_manage_tasks' => 'nullable|boolean',
            'custom_permissions.can_manage_labels' => 'nullable|boolean',
            'custom_permissions.can_view_project' => 'nullable|boolean',
            'custom_permissions.can_comment' => 'nullable|boolean',
        ]);

        try {
            $invitation = ProjectInvitationService::sendInvitation(
                $project,
                $validated['email'],
                $validated['role'],
                $validated['custom_permissions'] ?? [],
                $validated['message'] ?? null
            );

            return redirect()->back()->with('success', "Invitation sent to {$validated['email']} successfully.");
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['email' => $e->getMessage()]);
        }
    }

    /**
     * Send bulk invitations to multiple projects.
     */
    public function bulkStore(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'project_ids' => 'required|array|min:1',
            'project_ids.*' => 'exists:projects,id',
            'emails' => 'required|array|min:1',
            'emails.*' => 'email',
            'role' => 'required|string|in:admin,editor,viewer',
            'message' => 'nullable|string|max:500',
        ]);

        $results = ProjectInvitationService::sendBulkInvitations(
            $validated['project_ids'],
            $validated['emails'],
            $validated['role'],
            [],
            $validated['message'] ?? null
        );

        $successCount = count($results['successful']);
        $failureCount = count($results['failed']);

        if ($successCount > 0 && $failureCount === 0) {
            return redirect()->back()->with('success', "Successfully sent {$successCount} invitations.");
        } elseif ($successCount > 0 && $failureCount > 0) {
            return redirect()->back()->with('warning', "Sent {$successCount} invitations successfully, {$failureCount} failed.");
        } else {
            return redirect()->back()->withErrors(['error' => 'All invitations failed to send.']);
        }
    }

    /**
     * Accept an invitation.
     */
    public function accept(string $token): RedirectResponse
    {
        $invitation = ProjectInvitation::where('token', $token)->first();

        if (!$invitation) {
            return redirect()->route('dashboard')->withErrors(['error' => 'Invalid invitation link.']);
        }

        if ($invitation->status !== 'pending') {
            $message = match($invitation->status) {
                'accepted' => 'This invitation has already been accepted.',
                'declined' => 'This invitation has been declined.',
                'expired' => 'This invitation has expired.',
                'cancelled' => 'This invitation has been cancelled.',
                default => 'This invitation is no longer valid.'
            };
            return redirect()->route('dashboard')->withErrors(['error' => $message]);
        }

        if ($invitation->isExpired()) {
            $invitation->update(['status' => 'expired']);
            return redirect()->route('dashboard')->withErrors(['error' => 'This invitation has expired.']);
        }

        // Check if user is logged in
        if (!Auth::check()) {
            // Store invitation token in session and redirect to login
            session(['invitation_token' => $token]);
            return redirect()->route('login')->with('message', 'Please log in to accept the invitation.');
        }

        // Check if logged-in user's email matches invitation
        if (Auth::user()->email !== $invitation->email) {
            return redirect()->route('dashboard')->withErrors([
                'error' => 'This invitation was sent to a different email address.'
            ]);
        }

        try {
            $success = ProjectInvitationService::acceptInvitation($token);
            
            if ($success) {
                return redirect()->route('projects.show', $invitation->project)
                    ->with('success', "Welcome to {$invitation->project->name}!");
            } else {
                return redirect()->route('dashboard')->withErrors(['error' => 'Failed to accept invitation.']);
            }
        } catch (\Exception $e) {
            return redirect()->route('dashboard')->withErrors(['error' => 'An error occurred while accepting the invitation.']);
        }
    }

    /**
     * Decline an invitation.
     */
    public function decline(string $token): RedirectResponse
    {
        $invitation = ProjectInvitation::where('token', $token)->first();

        if (!$invitation) {
            return redirect()->route('dashboard')->withErrors(['error' => 'Invalid invitation link.']);
        }

        if ($invitation->status !== 'pending') {
            return redirect()->route('dashboard')->with('info', 'This invitation is no longer active.');
        }

        ProjectInvitationService::declineInvitation($token);

        return redirect()->route('dashboard')->with('success', 'Invitation declined successfully.');
    }

    /**
     * Show invitation details (for logged-in users).
     */
    public function show(string $token): Response|RedirectResponse
    {
        $invitation = ProjectInvitation::with(['project', 'invitedBy'])
            ->where('token', $token)
            ->first();

        if (!$invitation) {
            return redirect()->route('dashboard')->withErrors(['error' => 'Invalid invitation link.']);
        }

        // Check if invitation is still valid
        if ($invitation->status !== 'pending' || $invitation->isExpired()) {
            return redirect()->route('dashboard')->withErrors(['error' => 'This invitation is no longer valid.']);
        }

        return Inertia::render('invitations/show', [
            'invitation' => $invitation,
            'project' => $invitation->project,
            'invitedBy' => $invitation->invitedBy,
        ]);
    }

    /**
     * Cancel an invitation (for project managers).
     */
    public function cancel(ProjectInvitation $invitation): RedirectResponse
    {
        if (!ProjectPermissionService::can($invitation->project, 'can_manage_members')) {
            abort(403, 'You do not have permission to cancel this invitation.');
        }

        if ($invitation->status !== 'pending') {
            return redirect()->back()->withErrors(['error' => 'This invitation cannot be cancelled.']);
        }

        ProjectInvitationService::cancelInvitation($invitation);

        return redirect()->back()->with('success', 'Invitation cancelled successfully.');
    }

    /**
     * Resend an invitation.
     */
    public function resend(ProjectInvitation $invitation): RedirectResponse
    {
        if (!ProjectPermissionService::can($invitation->project, 'can_manage_members')) {
            abort(403, 'You do not have permission to resend this invitation.');
        }

        if ($invitation->status !== 'pending') {
            return redirect()->back()->withErrors(['error' => 'This invitation cannot be resent.']);
        }

        $success = ProjectInvitationService::resendInvitation($invitation);

        if ($success) {
            return redirect()->back()->with('success', 'Invitation resent successfully.');
        } else {
            return redirect()->back()->withErrors(['error' => 'Failed to resend invitation.']);
        }
    }
}
