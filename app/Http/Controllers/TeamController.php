<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Project;
use App\Services\ProjectPermissionService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TeamController extends Controller
{
    /**
     * Display the team members.
     */
    public function index(): Response
    {
        // For now, just get all users as team members
        // In a real app, you would filter by organization or team
        $team = User::with(['teamRole', 'department'])->select(['id', 'name', 'email', 'phone', 'team_role_id', 'department_id', 'created_at', 'role'])->get();

        // Get current user's owned projects for invitation functionality
        $ownedProjects = Auth::user()->ownedProjects()
            ->with(['owner:id,name'])
            ->select(['id', 'name', 'key', 'owner_id'])
            ->orderBy('name')
            ->get();

        return Inertia::render('team', [
            'team' => $team,
            'ownedProjects' => $ownedProjects,
        ]);
    }

    /**
     * Invite a user to multiple projects.
     */
    public function inviteToProjects(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'project_ids' => 'required|array|min:1',
            'project_ids.*' => 'exists:projects,id',
            'role' => 'required|string|in:admin,editor,viewer',
        ]);

        $currentUser = Auth::user();
        $invitedToProjects = [];
        $errors = [];

        foreach ($validated['project_ids'] as $projectId) {
            $project = Project::find($projectId);

            // Check if current user owns this project
            if ($project->owner_id !== $currentUser->id) {
                $errors[] = "You don't have permission to invite members to '{$project->name}'";
                continue;
            }

            // Check if user is already a member
            if ($project->members()->where('user_id', $user->id)->exists() || $project->owner_id === $user->id) {
                $errors[] = "User is already a member of '{$project->name}'";
                continue;
            }

            // Add user to project
            ProjectPermissionService::addUserToProject($project, $user, $validated['role']);
            $invitedToProjects[] = $project->name;
        }

        if (!empty($invitedToProjects)) {
            $message = "Successfully invited {$user->name} to: " . implode(', ', $invitedToProjects);
            if (!empty($errors)) {
                $message .= ". Some invitations failed: " . implode(', ', $errors);
            }
            return redirect()->back()->with('success', $message);
        } else {
            return redirect()->back()->withErrors(['error' => implode(', ', $errors)]);
        }
    }
}
