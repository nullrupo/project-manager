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

        // Check if there's a view parameter to preserve navigation state
        $view = $request->get('view', 'list'); // Default to list view

        // Redirect based on the view parameter - use consistent URL structure
        return redirect()->route('projects.show', ['project' => $project->id, 'view' => $view])
            ->with('success', 'Task created successfully.');
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
            'position' => 'nullable|integer|min:0',
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
            'reviewer_id' => $reviewerId,
            'section_id' => $validated['section_id'] ?? null,
            'is_archived' => $validated['is_archived'] ?? false,
        ];

        // Preserve position if provided, otherwise keep current position
        if (isset($validated['position'])) {
            $updateData['position'] = $validated['position'];
        }

        // Handle review status if provided
        if (isset($validated['review_status'])) {
            $updateData['review_status'] = $validated['review_status'];
        }

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

        // Sync tags (with permission check - only user's own tags)
        if (isset($validated['tag_ids'])) {
            $userTags = Auth::user()->tags()->whereIn('id', $validated['tag_ids'])->pluck('id');
            $task->tags()->sync($userTags);
        } else {
            $task->tags()->sync([]);
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
            'target_task_id' => 'nullable|integer|exists:tasks,id',
            'position_relative_to_target' => 'nullable|string|in:before,after',
            'insertion_position' => 'nullable|integer|min:0',
        ]);

        // Get the new list and verify it belongs to the project
        $newList = TaskList::find($validated['list_id']);
        if (!$newList || $newList->board->project_id !== $project->id) {
            return response()->json([
                'success' => false,
                'error' => 'List does not belong to this project'
            ], 422);
        }

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

        // Handle insertion-based positioning
        if (isset($validated['insertion_position']) && is_numeric($validated['insertion_position'])) {
            $insertionPosition = (int) $validated['insertion_position'];

            // Get all tasks in the target list, ordered by position, excluding the task being moved
            $listTasks = Task::where('list_id', $validated['list_id'])
                ->where('id', '!=', $task->id)
                ->orderBy('position')
                ->get();

            // Shift positions to make room for insertion
            Task::where('list_id', $validated['list_id'])
                ->where('position', '>=', $insertionPosition)
                ->where('id', '!=', $task->id)
                ->increment('position');

            // Set the exact insertion position
            $updateData['position'] = $insertionPosition;
        } else {
            // If no specific position, add to the end of the list
            $maxPosition = Task::where('list_id', $validated['list_id'])
                ->where('id', '!=', $task->id)
                ->max('position') ?? -1;
            $updateData['position'] = $maxPosition + 1;
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

                // Update status if it should change and newStatus is not null
                if ($newStatus !== null && $newStatus !== $task->status) {
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
    private function getStatusFromListName(string $listName): ?string
    {
        // Convert to lowercase for case-insensitive matching
        $name = strtolower(trim($listName));

        // Comprehensive mapping of common list names to standard statuses
        $statusMappings = [
            // Common "To Do" variations
            'to do' => 'to_do',
            'todo' => 'to_do',
            'backlog' => 'to_do',
            'planned' => 'to_do',
            'new' => 'to_do',
            'open' => 'to_do',
            'pending' => 'to_do',
            'not started' => 'to_do',

            // Common "In Progress" variations
            'in progress' => 'in_progress',
            'in-progress' => 'in_progress',
            'inprogress' => 'in_progress',
            'doing' => 'in_progress',
            'active' => 'in_progress',
            'working' => 'in_progress',
            'started' => 'in_progress',
            'development' => 'in_progress',
            'dev' => 'in_progress',

            // Common "Done" variations
            'done' => 'done',
            'completed' => 'done',
            'complete' => 'done',
            'finished' => 'done',
            'closed' => 'done',
            'resolved' => 'done',
            'deployed' => 'done',
            'live' => 'done',

            // Common "Review" variations
            'review' => 'in_review',
            'in review' => 'in_review',
            'in-review' => 'in_review',
            'testing' => 'in_review',
            'qa' => 'in_review',
            'quality assurance' => 'in_review',
            'code review' => 'in_review',
            'peer review' => 'in_review',

            // Common "Blocked" variations
            'blocked' => 'blocked',
            'on hold' => 'blocked',
            'waiting' => 'blocked',
            'paused' => 'blocked',
            'stuck' => 'blocked',
            'impediment' => 'blocked',
            'error' => 'blocked',
            'failed' => 'blocked',
            'issue' => 'blocked',
        ];

        // Check direct mappings first
        if (isset($statusMappings[$name])) {
            return $statusMappings[$name];
        }

        // Check if the column name contains any of the keywords
        foreach ($statusMappings as $keyword => $status) {
            if (str_contains($name, $keyword)) {
                return $status;
            }
        }

        // Default fallback based on common patterns
        if (str_contains($name, 'do') || str_contains($name, 'start') || str_contains($name, 'plan')) {
            return 'to_do';
        }

        if (str_contains($name, 'progress') || str_contains($name, 'work') || str_contains($name, 'dev')) {
            return 'in_progress';
        }

        if (str_contains($name, 'done') || str_contains($name, 'complete') || str_contains($name, 'finish')) {
            return 'done';
        }

        if (str_contains($name, 'review') || str_contains($name, 'test') || str_contains($name, 'qa')) {
            return 'in_review';
        }

        if (str_contains($name, 'block') || str_contains($name, 'hold') || str_contains($name, 'wait')) {
            return 'blocked';
        }

        // Don't change status for unrecognized list names
        return null;
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

    /**
     * Clean up completed tasks from the project.
     * Archives completed tasks by setting is_archived = true.
     */
    public function cleanup(Request $request, Project $project): RedirectResponse
    {
        // Check if user has permission to manage tasks in this project
        if (!ProjectPermissionService::can($project, 'can_manage_tasks')) {
            abort(403, 'You do not have permission to manage tasks in this project.');
        }

        $user = Auth::user();

        // Find completed tasks in this project that the user can manage
        $completedTasks = Task::where('project_id', $project->id)
            ->where('status', 'done')
            ->where('is_archived', false) // Only non-archived tasks
            ->where(function ($query) use ($user) {
                $query->where('created_by', $user->id)
                      ->orWhereHas('assignees', function ($q) use ($user) {
                          $q->where('users.id', $user->id);
                      });
            })
            ->whereNull('deleted_at') // Only non-deleted tasks
            ->get();

        $cleanupCount = 0;

        // Archive completed tasks by setting is_archived = true
        foreach ($completedTasks as $task) {
            if ($task->created_by === $user->id || $task->assignees->contains($user->id)) {
                $task->update(['is_archived' => true]);
                $cleanupCount++;
            }
        }

        // Preserve the current view if specified in the request
        $redirectParams = ['project' => $project->id];
        if ($request->has('view')) {
            $redirectParams['view'] = $request->get('view');
        }

        return redirect()->route('projects.show', $redirectParams)
            ->with('success', "Project cleaned! {$cleanupCount} completed tasks moved to project archive.");
    }

    /**
     * Unarchive a task (restore from project archive).
     */
    public function unarchive(Request $request, Project $project, Task $task): \Illuminate\Http\JsonResponse
    {
        // Check if the task belongs to the project
        if ($task->project_id !== $project->id) {
            abort(404, 'Task not found in this project.');
        }

        // Check if user has permission to manage this task
        if (!ProjectPermissionService::can($project, 'can_manage_tasks')) {
            abort(403, 'You do not have permission to manage tasks in this project.');
        }

        // Check if task is actually archived
        if (!$task->is_archived) {
            return response()->json([
                'success' => false,
                'message' => 'Task is not archived'
            ], 400);
        }

        // Unarchive the task
        $task->update(['is_archived' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Task restored from archive successfully',
            'task' => $task->fresh(['assignees', 'labels', 'tags', 'creator', 'section', 'list'])
        ]);
    }
}
