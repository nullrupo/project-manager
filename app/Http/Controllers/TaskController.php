<?php

namespace App\Http\Controllers;

use App\Models\Board;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskList;
use App\Models\Section;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\ProjectPermissionService;

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
            ->with(['list', 'assignees', 'labels', 'tags', 'creator', 'checklistItems'])
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
    public function create(Request $request, Project $project, Board $board, TaskList $list): Response
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

        // Get user's tags
        $tags = Auth::user()->tags()->orderBy('name')->get();

        return Inertia::render('tasks/create', [
            'project' => $project,
            'board' => $board,
            'list' => $list,
            'members' => $members,
            'labels' => $labels,
            'tags' => $tags,
            'tab' => $request->get('tab', 'list'), // Pass tab parameter
            'status' => $request->get('status'), // Pass status parameter if provided
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

        // Check if user has permission to manage tasks in this project
        if (!ProjectPermissionService::can($project, 'can_manage_tasks')) {
            abort(403, 'You do not have permission to create tasks in this project.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|string|in:low,medium,high,urgent',
            'status' => 'required|string',
            'estimate' => 'nullable|integer|min:0',
            'due_date' => 'nullable|date',
            'reviewer_id' => 'nullable|string',
            'section_id' => 'nullable|exists:sections,id',
            'assignee_ids' => 'nullable|array',
            'assignee_ids.*' => 'exists:users,id',
            'label_ids' => 'nullable|array',
            'label_ids.*' => 'exists:labels,id',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:tags,id',
        ]);

        // Get the highest position value
        $maxPosition = $list->tasks()->max('position') ?? -1;

        // Handle reviewer_id
        $reviewerId = $validated['reviewer_id'] ?? null;
        if ($reviewerId === 'default' || empty($reviewerId)) {
            $reviewerId = null;
        }

        // Handle section_id - allow tasks without sections or auto-create default section
        $sectionId = $validated['section_id'] ?? null;

        // Optional: Auto-create a default section if requested via query parameter
        if ($sectionId === null && $request->get('auto_create_section') === 'true') {
            $defaultSection = $project->sections()->where('name', 'General')->first();
            if (!$defaultSection) {
                $maxPosition = $project->sections()->max('position') ?? -1;
                $defaultSection = Section::create([
                    'name' => 'General',
                    'description' => 'Default section for tasks',
                    'project_id' => $project->id,
                    'position' => $maxPosition + 1,
                ]);
            }
            $sectionId = $defaultSection->id;
        }

        // Create the task
        $task = new Task([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'priority' => $validated['priority'],
            'status' => $validated['status'],
            'estimate' => $validated['estimate'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
            'reviewer_id' => $reviewerId,
            'section_id' => $sectionId,
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

        // Attach tags if any (with permission check)
        if (!empty($validated['tag_ids'])) {
            $userTags = Auth::user()->tags()->whereIn('id', $validated['tag_ids'])->pluck('id');
            if ($userTags->isNotEmpty()) {
                $task->tags()->attach($userTags);
            }
        }

        // Check if there's a tab parameter to preserve navigation state
        $tab = $request->get('tab', 'list'); // Default to list tab

        return redirect()->route('projects.show', ['project' => $project->id, 'tab' => $tab])
            ->with('success', 'Task created successfully.');
    }

    /**
     * Store a newly created task directly in a project (for List tab view).
     */
    public function storeProjectTask(Request $request, Project $project): RedirectResponse
    {
        // Check if user has permission to manage tasks in this project
        if (!ProjectPermissionService::can($project, 'can_manage_tasks')) {
            abort(403, 'You do not have permission to create tasks in this project.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|string|in:low,medium,high,urgent',
            'status' => 'required|string',
            'estimate' => 'nullable|integer|min:0',
            'due_date' => 'nullable|date',
            'reviewer_id' => 'nullable|string',
            'section_id' => 'nullable|exists:sections,id',
            'assignee_ids' => 'nullable|array',
            'assignee_ids.*' => 'exists:users,id',
            'label_ids' => 'nullable|array',
            'label_ids.*' => 'exists:labels,id',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:tags,id',
        ]);

        // Get or create a default board and list for the project
        $board = $project->boards()->first();
        if (!$board) {
            $board = Board::create([
                'name' => 'Main Board',
                'description' => 'Default board for project tasks',
                'project_id' => $project->id,
                'position' => 0,
            ]);
        }

        $list = $board->lists()->first();
        if (!$list) {
            $list = TaskList::create([
                'name' => 'To Do',
                'description' => 'Default list for new tasks',
                'board_id' => $board->id,
                'position' => 0,
            ]);
        }

        // Get the highest position value
        $maxPosition = $list->tasks()->max('position') ?? -1;

        // Handle reviewer_id
        $reviewerId = $validated['reviewer_id'] ?? null;
        if ($reviewerId === 'default' || empty($reviewerId)) {
            $reviewerId = null;
        }

        // Handle section_id
        $sectionId = $validated['section_id'] ?? null;

        // Create the task
        $task = new Task([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'priority' => $validated['priority'],
            'status' => $validated['status'],
            'estimate' => $validated['estimate'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
            'reviewer_id' => $reviewerId,
            'section_id' => $sectionId,
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

        // Attach tags if any (with permission check)
        if (!empty($validated['tag_ids'])) {
            $userTags = Auth::user()->tags()->whereIn('id', $validated['tag_ids'])->pluck('id');
            if ($userTags->isNotEmpty()) {
                $task->tags()->attach($userTags);
            }
        }

        // Check if there's a tab parameter to preserve navigation state
        $tab = $request->get('tab', 'list'); // Default to list tab

        return redirect()->route('projects.show', ['project' => $project->id, 'tab' => $tab])
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
            'tags',
            'creator',
            'reviewer',
            'section',
            'checklistItems',
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
            'tags',
            'creator',
            'checklistItems',
        ]);

        // Get project members for assignee selection
        $members = $project->members()->get();
        $members->push($project->owner);
        $members = $members->unique('id');

        // Get project labels
        $labels = $project->labels()->get();

        // Get user's tags
        $tags = Auth::user()->tags()->orderBy('name')->get();

        // Get all lists in the project for list selection
        $lists = $project->boards()->with('lists')->get()->flatMap(function ($board) {
            return $board->lists;
        });

        return Inertia::render('tasks/edit', [
            'project' => $project,
            'task' => $task,
            'members' => $members,
            'labels' => $labels,
            'tags' => $tags,
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
            'review_status' => 'nullable|string|in:pending,approved,rejected',
            'estimate' => 'nullable|integer|min:0',
            'due_date' => 'nullable|date',
            'start_date' => 'nullable|date',
            'duration_days' => 'nullable|integer|min:1',
            'list_id' => 'required|exists:lists,id',
            'reviewer_id' => 'nullable|string',
            'section_id' => 'nullable|exists:sections,id',
            'assignee_ids' => 'nullable|array',
            'assignee_ids.*' => 'exists:users,id',
            'label_ids' => 'nullable|array',
            'label_ids.*' => 'exists:labels,id',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:tags,id',
            'is_archived' => 'boolean',
        ]);

        // Handle reviewer_id
        $reviewerId = $validated['reviewer_id'] ?? null;
        if ($reviewerId === 'default' || empty($reviewerId)) {
            $reviewerId = null;
        }

        // Update the task
        $updateData = [
            'title' => $validated['title'],
            'description' => $validated['description'],
            'priority' => $validated['priority'],
            'status' => $validated['status'],
            'estimate' => $validated['estimate'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
            'start_date' => $validated['start_date'] ?? null,
            'duration_days' => $validated['duration_days'] ?? null,
            'list_id' => $validated['list_id'],
            'reviewer_id' => $reviewerId,
            'section_id' => $validated['section_id'] ?? null,
            'is_archived' => $validated['is_archived'] ?? false,
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

        // Sync assignees
        $task->assignees()->sync($validated['assignee_ids'] ?? []);

        // Sync labels
        $task->labels()->sync($validated['label_ids'] ?? []);

        // Sync tags (with permission check - only user's own tags)
        if (isset($validated['tag_ids'])) {
            $userTags = Auth::user()->tags()->whereIn('id', $validated['tag_ids'])->pluck('id');
            $task->tags()->sync($userTags);
        } else {
            $task->tags()->sync([]);
        }

        // Check if this is an AJAX/Inertia request that wants to stay on the same page
        if ($request->wantsJson() || $request->header('X-Inertia')) {
            return redirect()->back()->with('success', 'Task updated successfully.');
        }

        return redirect()->route('tasks.show', [$project, $task])
            ->with('success', 'Task updated successfully.');
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
            'task' => $task->fresh(['assignees', 'labels', 'tags', 'creator'])
        ]);
    }

    /**
     * Move a task to a different list (simple movement for drag and drop).
     */
    public function move(Request $request, Project $project, Task $task): JsonResponse
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
            'list_id' => 'required|exists:lists,id',
            'section_id' => 'nullable|exists:sections,id',
        ]);

        // Get the new list to determine the appropriate status
        $newList = TaskList::find($validated['list_id']);
        $newStatus = $this->getStatusFromListName($newList->name);

        $updateData = [
            'list_id' => $validated['list_id'],
            'section_id' => $validated['section_id'] ?? null,
        ];

        // Update status if it should change based on the list
        if ($newStatus && $newStatus !== $task->status) {
            $updateData['status'] = $newStatus;

            // If moving to 'Done' status, set completed_at timestamp
            if ($newStatus === 'done' && $task->status !== 'done') {
                $updateData['completed_at'] = now();
            } elseif ($newStatus !== 'done' && $task->status === 'done') {
                $updateData['completed_at'] = null;
            }
        }

        $task->update($updateData);

        return response()->json([
            'success' => true,
            'task' => $task->fresh(['assignees', 'labels', 'tags', 'creator', 'list'])
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
     * Toggle task completion using the flexible completion logic.
     */
    public function toggleCompletion(Project $project, Task $task): \Illuminate\Http\JsonResponse
    {
        // Check if the task belongs to the project
        if ($task->project_id !== $project->id) {
            abort(404, 'Task not found in this project.');
        }

        // Check if user has permission to manage tasks in this project
        if (!ProjectPermissionService::can($project, 'can_manage_tasks')) {
            abort(403, 'You do not have permission to manage tasks in this project.');
        }

        // Use the task's toggle completion method
        $updateData = $task->toggleCompletion();
        $task->update($updateData);

        return response()->json([
            'success' => true,
            'task' => $task->fresh(['project', 'assignees', 'labels', 'tags', 'creator', 'list'])
        ]);
    }

    /**
     * Remove the specified task from storage.
     */
    public function destroy(Request $request, Project $project, Task $task): RedirectResponse|\Illuminate\Http\JsonResponse
    {
        // Check if the task belongs to the project
        if ($task->project_id !== $project->id) {
            abort(404, 'Task not found in this project.');
        }

        // Check if user has permission to delete this task
        if ($task->created_by !== Auth::id() && !ProjectPermissionService::can($project, 'can_manage_tasks')) {
            abort(403, 'You do not have permission to delete this task.');
        }

        // Soft delete the task
        $task->delete();

        // Preserve the current view if specified in the request
        $redirectParams = ['project' => $project->id];
        if ($request->has('view')) {
            $redirectParams['view'] = $request->get('view');
        }

        // Return JSON response for AJAX requests (for undo functionality)
        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Task deleted successfully',
                'task_id' => $task->id,
                'undo_url' => route('tasks.restore', ['project' => $project->id, 'task' => $task->id])
            ]);
        }

        // Redirect back to the project page for non-AJAX requests
        return redirect()->route('projects.show', $redirectParams)
            ->with('success', 'Task deleted successfully.');
    }

    /**
     * Restore a soft-deleted task.
     */
    public function restore(Request $request, Project $project, $taskId): \Illuminate\Http\JsonResponse
    {
        // Find the soft-deleted task
        $task = Task::withTrashed()->where('id', $taskId)->where('project_id', $project->id)->first();

        if (!$task) {
            return response()->json(['error' => 'Task not found'], 404);
        }

        // Check if user has permission to restore this task
        if ($task->created_by !== Auth::id() && !ProjectPermissionService::can($project, 'can_manage_tasks')) {
            return response()->json(['error' => 'You do not have permission to restore this task'], 403);
        }

        // Restore the task
        $task->restore();

        return response()->json([
            'success' => true,
            'message' => 'Task restored successfully',
            'task' => $task->fresh(['assignees', 'labels', 'tags', 'creator', 'list'])
        ]);
    }
}
