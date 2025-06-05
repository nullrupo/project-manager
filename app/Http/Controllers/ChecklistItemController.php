<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\ChecklistItem;
use App\Services\ProjectPermissionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChecklistItemController extends Controller
{
    /**
     * Store a newly created checklist item in storage.
     */
    public function store(Request $request, Task $task)
    {
        // Check if user has permission to manage tasks in this project
        if ($task->project && !ProjectPermissionService::can($task->project, 'can_manage_tasks')) {
            abort(403, 'You do not have permission to manage checklist items in this project.');
        }

        // For inbox tasks, check if user is creator or assignee
        if ($task->is_inbox && $task->created_by !== Auth::id() && !$task->assignees->contains(Auth::id())) {
            abort(403, 'You do not have permission to manage this task.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
        ]);

        // Get the highest position value
        $maxPosition = $task->checklistItems()->max('position') ?? -1;

        $checklistItem = ChecklistItem::create([
            'title' => $validated['title'],
            'task_id' => $task->id,
            'position' => $maxPosition + 1,
        ]);

        return response()->json([
            'success' => true,
            'checklist_item' => $checklistItem->load('task')
        ]);
    }

    /**
     * Update the specified checklist item in storage.
     */
    public function update(Request $request, Task $task, ChecklistItem $checklistItem)
    {
        // Check if the checklist item belongs to the task
        if ($checklistItem->task_id !== $task->id) {
            abort(404, 'Checklist item not found in this task.');
        }

        // Check if user has permission to manage tasks in this project
        if ($task->project && !ProjectPermissionService::can($task->project, 'can_manage_tasks')) {
            abort(403, 'You do not have permission to manage checklist items in this project.');
        }

        // For inbox tasks, check if user is creator or assignee
        if ($task->is_inbox && $task->created_by !== Auth::id() && !$task->assignees->contains(Auth::id())) {
            abort(403, 'You do not have permission to manage this task.');
        }

        $validated = $request->validate([
            'title' => 'string|max:255',
            'is_completed' => 'boolean',
        ]);

        $checklistItem->update($validated);

        return response()->json([
            'success' => true,
            'checklist_item' => $checklistItem->fresh(['task'])
        ]);
    }

    /**
     * Remove the specified checklist item from storage.
     */
    public function destroy(Task $task, ChecklistItem $checklistItem)
    {
        // Check if the checklist item belongs to the task
        if ($checklistItem->task_id !== $task->id) {
            abort(404, 'Checklist item not found in this task.');
        }

        // Check if user has permission to manage tasks in this project
        if ($task->project && !ProjectPermissionService::can($task->project, 'can_manage_tasks')) {
            abort(403, 'You do not have permission to manage checklist items in this project.');
        }

        // For inbox tasks, check if user is creator or assignee
        if ($task->is_inbox && $task->created_by !== Auth::id() && !$task->assignees->contains(Auth::id())) {
            abort(403, 'You do not have permission to manage this task.');
        }

        $checklistItem->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Toggle completion status of a checklist item.
     */
    public function toggleCompletion(Task $task, ChecklistItem $checklistItem)
    {
        // Check if the checklist item belongs to the task
        if ($checklistItem->task_id !== $task->id) {
            abort(404, 'Checklist item not found in this task.');
        }

        // Check if user has permission to manage tasks in this project
        if ($task->project && !ProjectPermissionService::can($task->project, 'can_manage_tasks')) {
            abort(403, 'You do not have permission to manage checklist items in this project.');
        }

        // For inbox tasks, check if user is creator or assignee
        if ($task->is_inbox && $task->created_by !== Auth::id() && !$task->assignees->contains(Auth::id())) {
            abort(403, 'You do not have permission to manage this task.');
        }

        $checklistItem->update([
            'is_completed' => !$checklistItem->is_completed
        ]);

        return response()->json([
            'success' => true,
            'checklist_item' => $checklistItem->fresh(['task'])
        ]);
    }
}
