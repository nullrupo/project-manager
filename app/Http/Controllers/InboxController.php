<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class InboxController extends Controller
{
    /**
     * Display the inbox tasks.
     */
    public function index(): Response
    {
        $user = Auth::user();

        // Get inbox tasks created by or assigned to the user
        $tasks = Task::where('is_inbox', true)
            ->where(function ($query) use ($user) {
                $query->where('created_by', $user->id)
                      ->orWhereHas('assignees', function ($q) use ($user) {
                          $q->where('users.id', $user->id);
                      });
            })
            ->with(['assignees', 'labels', 'tags', 'creator', 'project', 'checklistItems'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Get all users for assignee selection
        $users = User::all();

        // Get projects where the user is a member or owner
        $projects = Project::where(function ($query) use ($user) {
            $query->where('owner_id', $user->id)
                  ->orWhereHas('members', function ($q) use ($user) {
                      $q->where('users.id', $user->id);
                  });
        })->orderBy('name')->get();

        // Get user's tags
        $tags = $user->tags()->orderBy('name')->get();

        return Inertia::render('inbox', [
            'tasks' => $tasks,
            'users' => $users,
            'projects' => $projects,
            'tags' => $tags,
        ]);
    }

    /**
     * Store a newly created inbox task.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|string|in:low,medium,high,urgent',
            'status' => 'required|string|in:to_do,in_progress,review,done',
            'due_date' => 'nullable|date',
            'assignee_ids' => 'nullable|array',
            'assignee_ids.*' => 'exists:users,id',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:tags,id',
            'project_id' => 'nullable|exists:projects,id',
        ]);

        // Check project authorization if project_id is provided
        if (!empty($validated['project_id'])) {
            $project = Project::findOrFail($validated['project_id']);

            // Check if user has permission to add tasks to this project
            $user = Auth::user();
            $hasPermission = $project->owner_id === $user->id ||
                           $project->members()->where('users.id', $user->id)->exists();

            if (!$hasPermission) {
                return back()->withErrors(['project_id' => 'You do not have permission to add tasks to this project.']);
            }
        }

        // Determine if task should be in inbox or moved to project
        $isInboxTask = empty($validated['project_id']);
        $listId = null;
        $position = 0;

        // If project is assigned, find the appropriate list and position
        $sectionId = null;
        if (!$isInboxTask) {
            $project = Project::findOrFail($validated['project_id']);

            // Find the first available list in the project's default board
            $defaultBoard = $project->boards()->where('is_default', true)->first();
            if ($defaultBoard) {
                $firstList = $defaultBoard->lists()->orderBy('position')->first();
                if ($firstList) {
                    $listId = $firstList->id;
                    $position = Task::where('list_id', $listId)->max('position') + 1;
                }
            }

            // Assign to default section if project has sections
            if ($project->sections()->count() > 0) {
                $defaultSection = $project->sections()->orderBy('position')->first();
                if ($defaultSection) {
                    $sectionId = $defaultSection->id;
                }
            }
        }

        // Create the task
        $task = new Task([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'priority' => $validated['priority'],
            'status' => $validated['status'],
            'due_date' => $validated['due_date'] ?? null,
            'project_id' => $validated['project_id'] ?? null,
            'list_id' => $listId,
            'section_id' => $sectionId,
            'position' => $position,
            'is_inbox' => $isInboxTask,
            'created_by' => Auth::id(),
        ]);

        $task->save();

        // Attach assignees if provided
        if (isset($validated['assignee_ids']) && !empty($validated['assignee_ids'])) {
            $task->assignees()->attach($validated['assignee_ids']);
        }

        // Attach tags if provided (with permission check - only user's own tags)
        if (isset($validated['tag_ids']) && !empty($validated['tag_ids'])) {
            $userTags = Auth::user()->tags()->whereIn('id', $validated['tag_ids'])->pluck('id');
            if ($userTags->isNotEmpty()) {
                $task->tags()->attach($userTags);
            }
        }

        // Check if this is a quick task (minimal data) to avoid notification spam
        $isQuickTask = empty($validated['description']) &&
                      $validated['priority'] === 'medium' &&
                      $validated['status'] === 'to_do' &&
                      empty($validated['due_date']) &&
                      empty($validated['assignee_ids']);

        if ($isQuickTask) {
            // No notification for quick tasks to avoid spam
            return redirect()->route('inbox');
        } else {
            // Show notification for full tasks
            $message = 'Task created successfully.';
            if (!$isInboxTask && isset($project)) {
                $message = "Task created and moved to project '{$project->name}' successfully.";
            }
            return redirect()->route('inbox')
                ->with('success', $message);
        }
    }

    /**
     * Update the specified inbox task.
     */
    public function update(Request $request, Task $task): RedirectResponse
    {
        // Check if the task is an inbox task
        if (!$task->is_inbox) {
            abort(404, 'Task not found in inbox.');
        }

        // Check if user has permission to update this task
        if ($task->created_by !== Auth::id() && !$task->assignees->contains(Auth::id())) {
            abort(403, 'You do not have permission to update this task.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|string|in:low,medium,high,urgent',
            'status' => 'required|string|in:to_do,in_progress,review,done',
            'review_status' => 'nullable|string|in:pending,approved,rejected',
            'due_date' => 'nullable|date',
            'project_id' => 'nullable|exists:projects,id',
            'assignee_ids' => 'nullable|array',
            'assignee_ids.*' => 'exists:users,id',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:tags,id',
        ]);

        // Check if user has permission to assign task to the project
        if (!empty($validated['project_id'])) {
            $project = Project::findOrFail($validated['project_id']);
            $user = Auth::user();

            if ($project->owner_id !== $user->id && !$project->members->contains($user->id)) {
                return back()->withErrors(['project_id' => 'You do not have permission to assign tasks to this project.']);
            }
        }

        // Handle project assignment logic
        $newProjectId = $validated['project_id'] ?? null;
        $currentProjectId = $task->project_id;

        // Determine if task should be moved to/from inbox
        $shouldBeInInbox = empty($newProjectId);
        $listId = $task->list_id;
        $position = $task->position;

        // If project assignment is changing
        $sectionId = $task->section_id; // Keep current section by default
        if ($newProjectId !== $currentProjectId) {
            if ($newProjectId) {
                // Moving to a project - find appropriate list and position
                $project = Project::findOrFail($newProjectId);

                // Find the first available list in the project's default board
                $defaultBoard = $project->boards()->where('is_default', true)->first();
                if ($defaultBoard) {
                    $firstList = $defaultBoard->lists()->orderBy('position')->first();
                    if ($firstList) {
                        $listId = $firstList->id;
                        $position = Task::where('list_id', $listId)->max('position') + 1;
                    }
                }

                // Assign to default section if project has sections
                $sectionId = null;
                if ($project->sections()->count() > 0) {
                    $defaultSection = $project->sections()->orderBy('position')->first();
                    if ($defaultSection) {
                        $sectionId = $defaultSection->id;
                    }
                }
            } else {
                // Moving back to inbox - clear list, position, and section
                $listId = null;
                $position = 0;
                $sectionId = null;
            }
        }

        // Handle status and review_status updates
        $updateData = [
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'priority' => $validated['priority'],
            'status' => $validated['status'],
            'due_date' => $validated['due_date'] ?? null,
            'project_id' => $newProjectId,
            'list_id' => $listId,
            'section_id' => $sectionId,
            'position' => $position,
            'is_inbox' => $shouldBeInInbox,
        ];

        // Handle review status if provided
        if (isset($validated['review_status'])) {
            $updateData['review_status'] = $validated['review_status'];
        }

        // Set completed_at timestamp when marking as done
        if ($validated['status'] === 'done' && $task->status !== 'done') {
            $updateData['completed_at'] = now();
        } elseif ($validated['status'] !== 'done' && $task->status === 'done') {
            $updateData['completed_at'] = null;
        }

        $task->update($updateData);

        // Sync assignees if provided
        if (isset($validated['assignee_ids'])) {
            $task->assignees()->sync($validated['assignee_ids']);
        }

        // Sync tags (with permission check - only user's own tags)
        if (isset($validated['tag_ids'])) {
            $userTags = Auth::user()->tags()->whereIn('id', $validated['tag_ids'])->pluck('id');
            $task->tags()->sync($userTags);
        } else {
            $task->tags()->sync([]);
        }

        // Determine success message based on what happened
        $message = 'Task updated successfully.';
        if ($newProjectId !== $currentProjectId) {
            if ($newProjectId) {
                $project = Project::find($newProjectId);
                $message = "Task updated and moved to project '{$project->name}' successfully.";
            } else {
                $message = 'Task updated and moved back to inbox successfully.';
            }
        }

        return redirect()->route('inbox')
            ->with('success', $message);
    }

    /**
     * Remove the specified inbox task.
     */
    public function destroy(Task $task): RedirectResponse|\Illuminate\Http\JsonResponse
    {
        // Check if the task is an inbox task
        if (!$task->is_inbox) {
            abort(404, 'Task not found in inbox.');
        }

        // Check if user has permission to delete this task
        if ($task->created_by !== Auth::id()) {
            abort(403, 'You do not have permission to delete this task.');
        }

        // Soft delete the task
        $task->delete();

        // Return JSON response for AJAX requests (for undo functionality)
        if (request()->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Task deleted successfully',
                'task_id' => $task->id,
                'undo_url' => route('inbox.tasks.restore', ['task' => $task->id])
            ]);
        }

        return redirect()->route('inbox')
            ->with('success', 'Task deleted successfully.');
    }

    /**
     * Move an inbox task to a project.
     */
    public function moveToProject(Request $request, Task $task): RedirectResponse
    {
        // Check if the task is an inbox task
        if (!$task->is_inbox) {
            abort(404, 'Task not found in inbox.');
        }

        // Check if user has permission to move this task
        if ($task->created_by !== Auth::id() && !$task->assignees->contains(Auth::id())) {
            abort(403, 'You do not have permission to move this task.');
        }

        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'list_id' => 'nullable|exists:task_lists,id',
        ]);

        $project = Project::findOrFail($validated['project_id']);

        // Check if user has access to the project (all projects are private, check membership)
        if (!$project->members->contains(Auth::id()) && $project->owner_id !== Auth::id()) {
            abort(403, 'You do not have permission to add tasks to this project.');
        }

        // If list_id is provided, verify it belongs to the project
        $listId = null;
        if (!empty($validated['list_id'])) {
            $list = \App\Models\TaskList::findOrFail($validated['list_id']);
            if ($list->board->project_id !== $project->id) {
                abort(404, 'List not found in this project.');
            }
            $listId = $validated['list_id'];
        } else {
            // Find the first available list in the project's default board
            $defaultBoard = $project->boards()->where('is_default', true)->first();
            if ($defaultBoard) {
                $firstList = $defaultBoard->lists()->orderBy('position')->first();
                if ($firstList) {
                    $listId = $firstList->id;
                }
            }
        }

        // Assign to default section if project has sections
        $sectionId = null;
        if ($project->sections()->count() > 0) {
            $defaultSection = $project->sections()->orderBy('position')->first();
            if ($defaultSection) {
                $sectionId = $defaultSection->id;
            }
        }

        // Update the task to move it to the project
        $task->update([
            'project_id' => $project->id,
            'list_id' => $listId,
            'section_id' => $sectionId,
            'is_inbox' => false,
            'position' => $listId ? \App\Models\Task::where('list_id', $listId)->max('position') + 1 : 0,
        ]);

        return redirect()->route('inbox')
            ->with('success', "Task moved to project '{$project->name}' successfully.");
    }

    /**
     * Clean up completed and moved tasks from inbox.
     * Archives completed tasks and moves project tasks back to their projects.
     */
    public function cleanup(Request $request): RedirectResponse
    {
        $user = Auth::user();

        // Find tasks eligible for cleanup:
        // 1. Completed tasks (status === 'done') - these will be archived
        // 2. Tasks that have been moved to projects (project_id is not null) - these will be moved back to projects
        $completedTasks = Task::where(function ($query) use ($user) {
            $query->where('created_by', $user->id)
                  ->orWhereHas('assignees', function ($q) use ($user) {
                      $q->where('users.id', $user->id);
                  });
        })
        ->where('status', 'done')
        ->where('is_inbox', true)
        ->get();

        $projectTasks = Task::where(function ($query) use ($user) {
            $query->where('created_by', $user->id)
                  ->orWhereHas('assignees', function ($q) use ($user) {
                      $q->where('users.id', $user->id);
                  });
        })
        ->whereNotNull('project_id')
        ->where('is_inbox', true)
        ->get();

        $cleanupCount = 0;

        // Archive completed tasks (remove from inbox but keep in database)
        foreach ($completedTasks as $task) {
            if ($task->created_by === $user->id || $task->assignees->contains($user->id)) {
                $task->update(['is_inbox' => false]);
                $cleanupCount++;
            }
        }

        // Move project tasks back to their projects (remove from inbox)
        foreach ($projectTasks as $task) {
            if ($task->created_by === $user->id || $task->assignees->contains($user->id)) {
                $task->update(['is_inbox' => false]);
                $cleanupCount++;
            }
        }

        return redirect()->route('inbox')
            ->with('success', "Inbox cleaned! {$cleanupCount} tasks moved to archives and projects.");
    }

    /**
     * Toggle task completion using the flexible completion logic.
     */
    public function toggleCompletion(Task $task): \Illuminate\Http\JsonResponse
    {
        // Check if the task is an inbox task
        if (!$task->is_inbox) {
            abort(404, 'Task not found in inbox.');
        }

        // Check if user has permission to update this task
        if ($task->created_by !== Auth::id() && !$task->assignees->contains(Auth::id())) {
            abort(403, 'You do not have permission to update this task.');
        }

        // Use the task's toggle completion method
        $updateData = $task->toggleCompletion();
        $task->update($updateData);

        return response()->json([
            'success' => true,
            'task' => $task->fresh(['project', 'assignees', 'labels', 'tags', 'creator', 'checklistItems'])
        ]);
    }

    /**
     * Restore a soft-deleted inbox task.
     */
    public function restore($taskId): \Illuminate\Http\JsonResponse
    {
        // Find the soft-deleted task
        $task = Task::withTrashed()->where('id', $taskId)->where('is_inbox', true)->first();

        if (!$task) {
            return response()->json(['error' => 'Task not found'], 404);
        }

        // Check if user has permission to restore this task
        if ($task->created_by !== Auth::id() && !$task->assignees->contains(Auth::id())) {
            return response()->json(['error' => 'You do not have permission to restore this task'], 403);
        }

        // Restore the task
        $task->restore();

        return response()->json([
            'success' => true,
            'message' => 'Task restored successfully',
            'task' => $task->fresh(['project', 'assignees', 'labels', 'tags', 'creator', 'checklistItems'])
        ]);
    }
}
