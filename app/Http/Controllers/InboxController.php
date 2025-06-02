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
            ->with(['assignees', 'labels', 'creator'])
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

        return Inertia::render('inbox', [
            'tasks' => $tasks,
            'users' => $users,
            'projects' => $projects,
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
            'status' => 'required|string|in:to_do,in_progress,done',
            'due_date' => 'nullable|date',
            'assignee_ids' => 'nullable|array',
            'assignee_ids.*' => 'exists:users,id',
        ]);

        // Create the task
        $task = new Task([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'priority' => $validated['priority'],
            'status' => $validated['status'],
            'due_date' => $validated['due_date'] ?? null,
            'is_inbox' => true,
            'created_by' => Auth::id(),
        ]);

        $task->save();

        // Attach assignees if provided
        if (isset($validated['assignee_ids']) && !empty($validated['assignee_ids'])) {
            $task->assignees()->attach($validated['assignee_ids']);
        }

        return redirect()->route('inbox')
            ->with('success', 'Task created successfully.');
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
            'status' => 'required|string|in:to_do,in_progress,done',
            'due_date' => 'nullable|date',
            'assignee_ids' => 'nullable|array',
            'assignee_ids.*' => 'exists:users,id',
        ]);

        $task->update([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'priority' => $validated['priority'],
            'status' => $validated['status'],
            'due_date' => $validated['due_date'] ?? null,
        ]);

        // Sync assignees if provided
        if (isset($validated['assignee_ids'])) {
            $task->assignees()->sync($validated['assignee_ids']);
        }

        return redirect()->route('inbox')
            ->with('success', 'Task updated successfully.');
    }

    /**
     * Remove the specified inbox task.
     */
    public function destroy(Task $task): RedirectResponse
    {
        // Check if the task is an inbox task
        if (!$task->is_inbox) {
            abort(404, 'Task not found in inbox.');
        }

        // Check if user has permission to delete this task
        if ($task->created_by !== Auth::id()) {
            abort(403, 'You do not have permission to delete this task.');
        }

        $task->delete();

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

        // Check if user has access to the project
        if (!$project->is_public && !$project->members->contains(Auth::id()) && $project->owner_id !== Auth::id()) {
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

        // Update the task to move it to the project
        $task->update([
            'project_id' => $project->id,
            'list_id' => $listId,
            'is_inbox' => false,
            'position' => $listId ? \App\Models\Task::where('list_id', $listId)->max('position') + 1 : 0,
        ]);

        return redirect()->route('inbox')
            ->with('success', "Task moved to project '{$project->name}' successfully.");
    }
}
