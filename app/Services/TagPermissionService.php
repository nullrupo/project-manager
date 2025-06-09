<?php

namespace App\Services;

use App\Models\Task;
use App\Models\Tag;
use App\Models\User;
use App\Models\Project;
use Illuminate\Support\Facades\Auth;

class TagPermissionService
{
    /**
     * Check if user can manage tags on a specific task
     */
    public static function canManageTagsOnTask(Task $task, User $user): bool
    {
        // User can manage tags if they are assigned to the task
        if ($task->assignees()->where('user_id', $user->id)->exists()) {
            return true;
        }

        // User can manage tags if it's their personal project (no shared members and they are owner)
        if ($task->project) {
            $project = $task->project;
            
            // Check if user is project owner
            if ($project->owner_id === $user->id) {
                // Check if project has no shared members (personal project)
                $memberCount = $project->members()->count();
                return $memberCount === 0;
            }
        }

        // For inbox tasks, user can manage tags if they created the task
        if ($task->is_inbox && $task->created_by === $user->id) {
            return true;
        }

        return false;
    }

    /**
     * Check if user can assign a specific tag to a task
     */
    public static function canAssignTagToTask(Tag $tag, Task $task, User $user): bool
    {
        // User can only assign their own tags
        if ($tag->user_id !== $user->id) {
            return false;
        }

        // User must be able to manage tags on the task
        return self::canManageTagsOnTask($task, $user);
    }

    /**
     * Check if user can create/edit/delete a tag
     */
    public static function canManageTag(Tag $tag, User $user): bool
    {
        // Users can only manage their own tags
        return $tag->user_id === $user->id;
    }

    /**
     * Check if user can view a tag
     */
    public static function canViewTag(Tag $tag, User $user): bool
    {
        // Users can only view their own tags
        return $tag->user_id === $user->id;
    }

    /**
     * Get tasks that user can manage tags for
     */
    public static function getTasksUserCanManageTags(User $user)
    {
        // Get tasks where user is assigned
        $assignedTasks = $user->assignedTasks()->pluck('id');

        // Get tasks from personal projects (projects with no shared members where user is owner)
        $personalProjectTasks = collect();
        $ownedProjects = Project::where('owner_id', $user->id)->get();
        
        foreach ($ownedProjects as $project) {
            if ($project->members()->count() === 0) {
                $personalProjectTasks = $personalProjectTasks->merge(
                    $project->tasks()->pluck('id')
                );
            }
        }

        // Get inbox tasks created by user
        $inboxTasks = Task::where('is_inbox', true)
            ->where('created_by', $user->id)
            ->pluck('id');

        // Combine all task IDs
        return $assignedTasks->merge($personalProjectTasks)->merge($inboxTasks)->unique();
    }

    /**
     * Check if current authenticated user can manage tags on task
     */
    public static function canCurrentUserManageTagsOnTask(Task $task): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }

        return self::canManageTagsOnTask($task, $user);
    }

    /**
     * Check if current authenticated user can assign tag to task
     */
    public static function canCurrentUserAssignTagToTask(Tag $tag, Task $task): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }

        return self::canAssignTagToTask($tag, $task, $user);
    }
}
