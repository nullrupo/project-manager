<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
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

        return Inertia::render('inbox', [
            'tasks' => $tasks,
            'users' => $users,
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
}
