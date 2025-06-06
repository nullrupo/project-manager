<?php

namespace App\Http\Controllers;

use App\Models\Board;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskList;
use App\Services\ProjectPermissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    // No constructor needed - middleware is applied in routes file

    /**
     * Display a listing of the tasks for a project.
     */
    public function index(Project $project): Response
    {
        // All authenticated users can view projects

        $tasks = $project->tasks()
            ->with(['list', 'assignees', 'labels', 'creator'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('tasks/index', [
            'project' => $project,
            'tasks' => $tasks,
        ]);
    }

    /**
     * Show the form for creating a new task.
     */
    public function create(Project $project, Board $board, TaskList $list): Response
    {
        // Check if the board belongs to the project and the list belongs to the board
        if ($board->project_id !== $project->id || $list->board_id !== $board->id) {
            abort(404, 'List not found in this board.');
        }

        // Get project members for assignee selection
        $members = $project->members()->get();
        $members->push($project->owner);
        $members = $members->unique('id');

        // Get project labels
        $labels = $project->labels()->get();

        return Inertia::render('tasks/create', [
            'project' => $project,
            'board' => $board,
            'list' => $list,
            'members' => $members,
            'labels' => $labels,
        ]);
    }

    /**
     * Store a newly created task in storage.
     */
    public function store(Request $request, Project $project, Board $board, TaskList $list): RedirectResponse
    {
        // Check if the board belongs to the project and the list belongs to the board
        if ($board->project_id !== $project->id || $list->board_id !== $board->id) {
            abort(404, 'List not found in this board.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|string|in:low,medium,high,urgent',
            'status' => 'required|string',
            'estimate' => 'nullable|integer|min:0',
            'due_date' => 'nullable|date',
            'assignee_ids' => 'nullable|array',
            'assignee_ids.*' => 'exists:users,id',
            'label_ids' => 'nullable|array',
            'label_ids.*' => 'exists:labels,id',
        ]);

        // Get the highest position value
        $maxPosition = $list->tasks()->max('position') ?? -1;

        // Create the task
        $task = new Task([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'priority' => $validated['priority'],
            'status' => $validated['status'],
            'estimate' => $validated['estimate'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
            'position' => $maxPosition + 1,
        ]);

        $task->project_id = $project->id;
        $task->list_id = $list->id;
        $task->created_by = Auth::id();
        $task->save();

        // Attach assignees if any
        if (!empty($validated['assignee_ids'])) {
            $task->assignees()->attach($validated['assignee_ids']);
        }

        // Attach labels if any
        if (!empty($validated['label_ids'])) {
            $task->labels()->attach($validated['label_ids']);
        }

        return redirect()->route('boards.show', [$project, $board])
            ->with('success', 'Task created successfully.');
    }



    /**
     * Update the specified task in storage.
     */
    public function update(Request $request, Project $project, Task $task): RedirectResponse|JsonResponse
    {
        // Check if the task belongs to the project
        if ($task->project_id !== $project->id) {
            abort(404, 'Task not found in this project.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|string|in:low,medium,high,urgent',
            'status' => 'required|string',
            'estimate' => 'nullable|integer|min:0',
            'due_date' => 'nullable|date',
            'start_date' => 'nullable|date',
            'duration_days' => 'nullable|integer|min:1',
            'list_id' => 'required|exists:lists,id',
            'assignee_ids' => 'nullable|array',
            'assignee_ids.*' => 'exists:users,id',
            'label_ids' => 'nullable|array',
            'label_ids.*' => 'exists:labels,id',
            'is_archived' => 'boolean',
        ]);

        // Get the new list to determine the appropriate status
        $newList = TaskList::find($validated['list_id']);
        $newStatus = $this->getStatusFromListName($newList->name);

        // Use the list-based status if available, otherwise use the provided status
        $statusToUse = $newStatus ?? $validated['status'];

        $updateData = [
            'title' => $validated['title'],
            'description' => $validated['description'],
            'priority' => $validated['priority'],
            'status' => $statusToUse,
            'estimate' => $validated['estimate'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
            'start_date' => $validated['start_date'] ?? null,
            'duration_days' => $validated['duration_days'] ?? null,
            'list_id' => $validated['list_id'],
            'is_archived' => $validated['is_archived'] ?? false,
        ];

        // If moving to 'Done' status, set completed_at timestamp
        if ($statusToUse === 'done' && $task->status !== 'done') {
            $updateData['completed_at'] = now();
        }
        // If moving away from 'Done' status, clear completed_at timestamp
        elseif ($statusToUse !== 'done' && $task->status === 'done') {
            $updateData['completed_at'] = null;
        }

        // Update the task
        $task->update($updateData);

        // Sync assignees
        $task->assignees()->sync($validated['assignee_ids'] ?? []);

        // Sync labels
        $task->labels()->sync($validated['label_ids'] ?? []);

        // Return JSON for AJAX requests, redirect for regular form submissions
        if ($request->expectsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Task updated successfully.',
                'task' => $task->fresh(['assignees', 'labels', 'creator', 'list.board'])
            ]);
        }

        // Always redirect back since we no longer have a task detail page
        return redirect()->back()->with('success', 'Task updated successfully.');
    }

    /**
     * Update the due date of a task.
     */
    public function updateDueDate(Request $request, Project $project, Task $task): JsonResponse
    {
        // Check if the task belongs to the project
        if ($task->project_id !== $project->id) {
            abort(404, 'Task not found in this project.');
        }

        // Check if user has permission to manage tasks in this project
        if (!ProjectPermissionService::can($project, 'can_manage_tasks')) {
            abort(403, 'You do not have permission to manage tasks in this project.');
        }

        $validated = $request->validate([
            'due_date' => 'nullable|date',
            'start_date' => 'nullable|date',
            'duration_days' => 'nullable|integer|min:1',
        ]);

        $task->update([
            'due_date' => $validated['due_date'] ?? null,
            'start_date' => $validated['start_date'] ?? null,
            'duration_days' => $validated['duration_days'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Task due date updated successfully.',
            'task' => $task->fresh(['assignees', 'labels', 'creator'])
        ]);
    }

    /**
     * Update the position of tasks.
     */
    public function updatePositions(Request $request, Project $project): JsonResponse
    {
        // Check if user has permission to manage tasks in this project
        if (!ProjectPermissionService::can($project, 'can_manage_tasks')) {
            abort(403, 'You do not have permission to manage tasks in this project.');
        }

        $validated = $request->validate([
            'tasks' => 'required|array',
            'tasks.*.id' => 'required|integer|exists:tasks,id',
            'tasks.*.position' => 'required|integer|min:0',
            'tasks.*.list_id' => 'required|integer|exists:lists,id',
            'tasks.*.status' => 'nullable|string|max:255',
            'tasks.*.completed_at' => 'nullable|date',
        ]);

        foreach ($validated['tasks'] as $taskData) {
            $task = Task::find($taskData['id']);

            // Make sure the task belongs to the project
            if ($task && $task->project_id === $project->id) {
                $updateData = [
                    'position' => $taskData['position'],
                    'list_id' => $taskData['list_id'],
                ];

                // Use status from frontend if provided, otherwise determine from list name
                $newStatus = $taskData['status'] ?? null;
                if (!$newStatus) {
                    $newList = TaskList::find($taskData['list_id']);
                    $newStatus = $this->getStatusFromListName($newList->name);
                }

                // Update status if it should change
                if ($newStatus !== $task->status) {
                    $updateData['status'] = $newStatus;
                }

                // Handle completed_at timestamp
                if (isset($taskData['completed_at'])) {
                    $updateData['completed_at'] = $taskData['completed_at'];
                } elseif ($newStatus === 'done' && $task->status !== 'done') {
                    // If moving to 'Done' status, set completed_at timestamp
                    $updateData['completed_at'] = now();
                } elseif ($newStatus !== 'done' && $task->status === 'done') {
                    // If moving away from 'Done' status, clear completed_at timestamp
                    $updateData['completed_at'] = null;
                }

                $task->update($updateData);
            }
        }

        return response()->json(['success' => true]);
    }

    /**
     * Map list name to appropriate task status
     */
    private function getStatusFromListName(string $listName): string
    {
        // Convert to lowercase for case-insensitive matching
        $name = strtolower(trim($listName));

        // Map common list names to standard statuses
        return match($name) {
            'to do', 'todo', 'backlog', 'new', 'open' => 'to_do',
            'in progress', 'in-progress', 'inprogress', 'doing', 'active', 'working' => 'in_progress',
            'done', 'completed', 'finished', 'closed', 'complete' => 'done',
            default => strtolower(preg_replace('/\s+/', '_', trim($listName))), // Use column name as status
        };
    }

    /**
     * Remove the specified task from storage.
     */
    public function destroy(Project $project, Task $task): RedirectResponse
    {
        // Check if the task belongs to the project
        if ($task->project_id !== $project->id) {
            abort(404, 'Task not found in this project.');
        }

        // Check if user has permission to delete this task
        if ($task->created_by !== Auth::id() && !ProjectPermissionService::can($project, 'can_manage_tasks')) {
            abort(403, 'You do not have permission to delete this task.');
        }

        $task->delete();

        return redirect()->route('boards.show', [$project, $task->list->board])
            ->with('success', 'Task deleted successfully.');
    }
}
