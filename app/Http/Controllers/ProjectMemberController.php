<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\User;
use App\Services\ProjectPermissionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProjectMemberController extends Controller
{
    /**
     * Display a listing of project members
     */
    public function index(Project $project): Response
    {
        // Check if current user can view project
        if (!ProjectPermissionService::can($project, 'can_view_project')) {
            abort(403, 'You do not have permission to view this project.');
        }

        // Load project with members and their permissions
        $project->load(['members' => function ($query) {
            $query->withPivot(['role', 'can_manage_members', 'can_manage_boards', 'can_manage_tasks', 'can_manage_labels', 'can_view_project', 'can_comment']);
        }, 'owner']);

        // Add permission information using the permission system
        $user = Auth::user();
        $project->can_edit = ProjectPermissionService::can($project, 'can_manage_boards');
        $project->can_manage_members = ProjectPermissionService::can($project, 'can_manage_members');
        $project->can_manage_tasks = ProjectPermissionService::can($project, 'can_manage_tasks');
        $project->can_manage_labels = ProjectPermissionService::can($project, 'can_manage_labels');
        $project->user_role = ProjectPermissionService::getUserRole($project, $user);
        $project->user_permissions = ProjectPermissionService::getUserPermissions($project, $user);

        return Inertia::render('projects/members/index', [
            'project' => $project,
        ]);
    }

    /**
     * Search for users to add to project
     */
    public function searchUsers(Request $request, Project $project)
    {
        // Check if current user can manage members
        if (!ProjectPermissionService::can($project, 'can_manage_members')) {
            abort(403, 'You do not have permission to manage project members.');
        }

        $search = $request->get('search', '');

        // Get users that are not already members of this project
        $existingMemberIds = $project->members()->pluck('user_id')->toArray();
        $existingMemberIds[] = $project->owner_id; // Exclude project owner too

        // Search all users by name or email
        $users = User::where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
            })
            ->whereNotIn('id', $existingMemberIds)
            ->limit(10)
            ->get(['id', 'name', 'email']);

        return response()->json($users);
    }

    /**
     * Show the form for editing member permissions
     */
    public function edit(Project $project, User $user): Response
    {
        // Check if current user can manage members
        if (!ProjectPermissionService::can($project, 'can_manage_members')) {
            abort(403, 'You do not have permission to manage project members.');
        }

        // Get user's current permissions
        $userPermissions = ProjectPermissionService::getUserPermissions($project, $user);
        $userRole = ProjectPermissionService::getUserRole($project, $user);

        return Inertia::render('projects/members/edit', [
            'project' => $project,
            'member' => $user,
            'memberRole' => $userRole,
            'memberPermissions' => $userPermissions,
            'availableRoles' => [
                'admin' => ProjectPermissionService::getRoleDescriptions()['admin'],
                'editor' => ProjectPermissionService::getRoleDescriptions()['editor'],
                'viewer' => ProjectPermissionService::getRoleDescriptions()['viewer'],
            ],
            'defaultPermissions' => [
                'admin' => ProjectPermissionService::getDefaultPermissions('admin'),
                'editor' => ProjectPermissionService::getDefaultPermissions('editor'),
                'viewer' => ProjectPermissionService::getDefaultPermissions('viewer'),
            ],
        ]);
    }

    /**
     * Update member permissions
     */
    public function update(Request $request, Project $project, User $user): RedirectResponse
    {
        // Check if current user can manage members
        if (!ProjectPermissionService::can($project, 'can_manage_members')) {
            abort(403, 'You do not have permission to manage project members.');
        }

        // Prevent editing project owner
        if ($project->owner_id === $user->id) {
            return redirect()->back()->withErrors(['error' => 'Cannot modify project owner permissions.']);
        }

        $validated = $request->validate([
            'role' => 'required|string|in:admin,editor,viewer',
            'can_manage_members' => 'boolean',
            'can_manage_boards' => 'boolean',
            'can_manage_tasks' => 'boolean',
            'can_manage_labels' => 'boolean',
            'can_view_project' => 'boolean',
            'can_comment' => 'boolean',
        ]);

        $role = $validated['role'];
        unset($validated['role']);

        // Update permissions
        ProjectPermissionService::updateUserPermissions($project, $user, $role, $validated);

        return redirect()->route('projects.show', $project)
            ->with('success', 'Member permissions updated successfully.');
    }

    /**
     * Remove member from project
     */
    public function destroy(Project $project, User $user): RedirectResponse
    {
        // Check if current user can manage members
        if (!ProjectPermissionService::can($project, 'can_manage_members')) {
            abort(403, 'You do not have permission to manage project members.');
        }

        // Prevent removing project owner
        if ($project->owner_id === $user->id) {
            return redirect()->back()->withErrors(['error' => 'Cannot remove project owner from project.']);
        }

        // Remove user from project
        $project->members()->detach($user->id);

        return redirect()->route('projects.show', $project)
            ->with('success', 'Member removed from project successfully.');
    }

    /**
     * Add member to project
     */
    public function store(Request $request, Project $project): RedirectResponse
    {
        // Check if current user can manage members
        if (!ProjectPermissionService::can($project, 'can_manage_members')) {
            abort(403, 'You do not have permission to manage project members.');
        }

        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'email' => 'nullable|email|exists:users,email',
            'role' => 'required|string|in:admin,editor,viewer',
        ]);

        // Ensure either user_id or email is provided
        if (!$validated['user_id'] && !$validated['email']) {
            return redirect()->back()->withErrors(['user' => 'Please select a user or enter an email address.']);
        }

        // Get user by ID or email
        if ($validated['user_id']) {
            $user = User::find($validated['user_id']);
        } else {
            $user = User::where('email', $validated['email'])->first();
        }

        // Check if user is already a member
        if ($project->members()->where('user_id', $user->id)->exists()) {
            return redirect()->back()->withErrors(['user' => 'User is already a member of this project.']);
        }

        // Check if user is the project owner
        if ($project->owner_id === $user->id) {
            return redirect()->back()->withErrors(['user' => 'Project owner is already a member with full permissions.']);
        }

        // Add user to project
        ProjectPermissionService::addUserToProject($project, $user, $validated['role']);

        return redirect()->route('projects.show', $project)
            ->with('success', 'Member added to project successfully.');
    }
}
