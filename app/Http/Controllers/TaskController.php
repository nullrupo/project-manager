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
     * Display the specified task.
     */
    public function show(Project $project, Task $task): Response
    {
        // Check if the task belongs to the project
        if ($task->project_id !== $project->id) {
            abort(404, 'Task not found in this project.');
        }

        // Check if user has access to the project
        if (!$project->is_public && !$project->members->contains(Auth::id()) && $project->owner_id !== Auth::id()) {
            abort(403, 'You do not have permission to view this project.');
        }

        // Load the task with its relationships
        $task->load([
            'list',
            'assignees',
            'labels',
            'creator',
            'comments' => function ($query) {
                $query->whereNull('parent_id')->orderBy('created_at', 'desc');
            },
            'comments.user',
            'comments.replies',
            'comments.replies.user',
        ]);

        // Get project members for assignee selection
        $members = $project->members()->get();
        $members->push($project->owner);
        $members = $members->unique('id');

        // Get project labels
        $labels = $project->labels()->get();

        return Inertia::render('tasks/show', [
            'project' => $project,
            'task' => $task,
            'members' => $members,
            'labels' => $labels,
        ]);
    }

    /**
     * Show the form for editing the specified task.
     */
    public function edit(Project $project, Task $task): Response
    {
        // Check if the task belongs to the project
        if ($task->project_id !== $project->id) {
            abort(404, 'Task not found in this project.');
        }

        // Check if user has permission to edit this task
        if (!ProjectPermissionService::can($project, 'can_manage_tasks')) {
            abort(403, 'You do not have permission to edit this task.');
        }

        // Load the task with its relationships
        $task->load([
            'list',
            'assignees',
            'labels',
            'creator',
        ]);

        // Get project members for assignee selection
        $members = $project->members()->get();
        $members->push($project->owner);
        $members = $members->unique('id');

        // Get project labels
        $labels = $project->labels()->get();

        // Get all lists in the project for list selection
        $lists = $project->boards()->with('lists')->get()->flatMap(function ($board) {
            return $board->lists;
        });

        return Inertia::render('tasks/edit', [
            'project' => $project,
            'task' => $task,
            'members' => $members,
            'labels' => $labels,
            'lists' => $lists,
        ]);
    }

    /**
     * Update the specified task in storage.
     */
    public function update(Request $request, Project $project, Task $task): RedirectResponse
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
            'list_id' => 'required|exists:lists,id',
            'assignee_ids' => 'nullable|array',
            'assignee_ids.*' => 'exists:users,id',
            'label_ids' => 'nullable|array',
            'label_ids.*' => 'exists:labels,id',
            'is_archived' => 'boolean',
        ]);

        // Update the task
        $task->update([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'priority' => $validated['priority'],
            'status' => $validated['status'],
            'estimate' => $validated['estimate'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
            'list_id' => $validated['list_id'],
            'is_archived' => $validated['is_archived'] ?? false,
        ]);

        // Sync assignees
        $task->assignees()->sync($validated['assignee_ids'] ?? []);

        // Sync labels
        $task->labels()->sync($validated['label_ids'] ?? []);

        return redirect()->route('tasks.show', [$project, $task])
            ->with('success', 'Task updated successfully.');
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
        ]);

        foreach ($validated['tasks'] as $taskData) {
            $task = Task::find($taskData['id']);

            // Make sure the task belongs to the project
            if ($task && $task->project_id === $project->id) {
                // Get the new list to determine the appropriate status
                $newList = TaskList::find($taskData['list_id']);
                $newStatus = $this->getStatusFromListName($newList->name);

                $updateData = [
                    'position' => $taskData['position'],
                    'list_id' => $taskData['list_id'],
                ];

                // Update status if it should change based on the list
                if ($newStatus && $newStatus !== $task->status) {
                    $updateData['status'] = $newStatus;

                    // If moving to 'Done' status, set completed_at timestamp
                    if ($newStatus === 'done' && $task->status !== 'done') {
                        $updateData['completed_at'] = now();
                    }
                    // If moving away from 'Done' status, clear completed_at timestamp
                    elseif ($newStatus !== 'done' && $task->status === 'done') {
                        $updateData['completed_at'] = null;
                    }
                }

                $task->update($updateData);
            }
        }

        return response()->json(['success' => true]);
    }

    /**
     * Map list name to appropriate task status
     */
    private function getStatusFromListName(string $listName): ?string
    {
        // Convert to lowercase for case-insensitive matching
        $listName = strtolower(trim($listName));

        // Map common list names to task statuses
        return match($listName) {
            'to do', 'todo', 'backlog', 'new', 'open' => 'to_do',
            'in progress', 'in-progress', 'inprogress', 'doing', 'active', 'working' => 'in_progress',
            'done', 'completed', 'finished', 'closed', 'complete' => 'done',
            'review', 'testing', 'qa', 'pending review' => 'in_progress', // Treat review as in_progress
            default => null, // Don't change status for unrecognized list names
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
