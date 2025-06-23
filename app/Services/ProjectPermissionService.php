<?php

namespace App\Services;

use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class ProjectPermissionService
{
    /**
     * Define default permissions for each role
     */
    public static function getDefaultPermissions(string $role): array
    {
        return match ($role) {
            'owner' => [
                'can_manage_members' => true,
                'can_manage_boards' => true,
                'can_manage_tasks' => true,
                'can_manage_labels' => true,
                'can_view_project' => true,
                'can_comment' => true,
            ],
            'admin' => [
                'can_manage_members' => true,
                'can_manage_boards' => true,
                'can_manage_tasks' => true,
                'can_manage_labels' => true,
                'can_view_project' => true,
                'can_comment' => true,
            ],
            'editor' => [
                'can_manage_members' => false,
                'can_manage_boards' => false,
                'can_manage_tasks' => true,
                'can_manage_labels' => false,
                'can_view_project' => true,
                'can_comment' => true,
            ],
            'viewer' => [
                'can_manage_members' => false,
                'can_manage_boards' => false,
                'can_manage_tasks' => false,
                'can_manage_labels' => false,
                'can_view_project' => true,
                'can_comment' => true,
            ],
            default => [
                'can_manage_members' => false,
                'can_manage_boards' => false,
                'can_manage_tasks' => false,
                'can_manage_labels' => false,
                'can_view_project' => false,
                'can_comment' => false,
            ],
        };
    }

    /**
     * Get role descriptions
     */
    public static function getRoleDescriptions(): array
    {
        return [
            'owner' => 'Full access to all project features and settings',
            'admin' => 'Can manage all aspects of the project except ownership transfer',
            'editor' => 'Can create and edit tasks, but cannot manage project structure',
            'viewer' => 'Can view project content and add comments, but cannot edit',
        ];
    }

    /**
     * Check if user has specific permission for a project
     */
    public static function hasPermission(Project $project, User $user, string $permission): bool
    {
        // Project owner or admin always has all permissions
        if ($project->owner_id === $user->id || $user->is_admin) {
            return true;
        }

        // Check if user is a member of the project
        $membership = $project->members()->where('user_id', $user->id)->first();

        if (!$membership) {
            return false;
        }

        // Check specific permission
        return (bool) $membership->pivot->{$permission};
    }

    /**
     * Check if current authenticated user has permission
     */
    public static function can(Project $project, string $permission): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }
        // Admins always have all permissions
        if ($user->is_admin) {
            return true;
        }
        return self::hasPermission($project, $user, $permission);
    }

    /**
     * Get user's role in project
     */
    public static function getUserRole(Project $project, User $user): ?string
    {
        if ($project->owner_id === $user->id) {
            return 'owner';
        }
        if ($user->is_admin) {
            return 'admin';
        }
        $membership = $project->members()->where('user_id', $user->id)->first();
        return $membership ? $membership->pivot->role : null;
    }

    /**
     * Get user's permissions in project
     */
    public static function getUserPermissions(Project $project, User $user): array
    {
        if ($project->owner_id === $user->id || $user->is_admin) {
            return self::getDefaultPermissions('owner');
        }
        $membership = $project->members()->where('user_id', $user->id)->first();
        if (!$membership) {
            return [];
        }
        return [
            'can_manage_members' => (bool) $membership->pivot->can_manage_members,
            'can_manage_boards' => (bool) $membership->pivot->can_manage_boards,
            'can_manage_tasks' => (bool) $membership->pivot->can_manage_tasks,
            'can_manage_labels' => (bool) $membership->pivot->can_manage_labels,
            'can_view_project' => (bool) $membership->pivot->can_view_project,
            'can_comment' => (bool) $membership->pivot->can_comment,
        ];
    }

    /**
     * Update user permissions in project
     */
    public static function updateUserPermissions(Project $project, User $user, string $role, array $customPermissions = []): bool
    {
        $membership = $project->members()->where('user_id', $user->id)->first();

        if (!$membership) {
            return false;
        }

        $permissions = array_merge(
            self::getDefaultPermissions($role),
            $customPermissions
        );

        $project->members()->updateExistingPivot($user->id, array_merge(
            ['role' => $role],
            $permissions
        ));

        return true;
    }

    /**
     * Add user to project with role and permissions
     */
    public static function addUserToProject(Project $project, User $user, string $role, array $customPermissions = []): void
    {
        $permissions = array_merge(
            self::getDefaultPermissions($role),
            $customPermissions
        );

        $project->members()->attach($user->id, array_merge(
            ['role' => $role],
            $permissions
        ));
    }
}
