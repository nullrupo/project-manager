<?php

namespace App\Http\Controllers;

use App\Models\Board;
use App\Models\Project;
use App\Models\TaskList;
use App\Services\ProjectPermissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TaskListController extends Controller
{
    // No constructor needed - middleware is applied in routes file

    /**
     * Store a newly created list in storage.
     */
    public function store(Request $request, Project $project, Board $board): RedirectResponse
    {
        // Check if the board belongs to the project
        if ($board->project_id !== $project->id) {
            abort(404, 'Board not found in this project.');
        }

        // Check if user has permission to create lists in this board
        if (!ProjectPermissionService::can($project, 'can_manage_boards')) {
            abort(403, 'You do not have permission to create lists in this board.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'nullable|string|max:50',
            'work_in_progress_limit' => 'nullable|integer|min:1',
        ]);

        // Get the highest position value
        $maxPosition = $board->lists()->max('position') ?? -1;

        // Create the list
        $list = $board->lists()->create([
            'name' => $validated['name'],
            'color' => $validated['color'] ?? '#3498db',
            'position' => $maxPosition + 1,
            'work_in_progress_limit' => $request->input('work_in_progress_limit'),
        ]);

        return redirect()->route('boards.show', [$project, $board])
            ->with('success', 'List created successfully.');
    }

    /**
     * Update the specified list in storage.
     */
    public function update(Request $request, Project $project, Board $board, TaskList $list): RedirectResponse
    {
        // Check if the board belongs to the project and the list belongs to the board
        if ($board->project_id !== $project->id || $list->board_id !== $board->id) {
            abort(404, 'List not found in this board.');
        }

        // Check if user has permission to update this list
        if (!ProjectPermissionService::can($project, 'can_manage_boards')) {
            abort(403, 'You do not have permission to update this list.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'nullable|string|max:50',
            'work_in_progress_limit' => 'nullable|integer|min:1',
            'is_archived' => 'boolean',
        ]);

        $list->update($validated);

        return redirect()->route('boards.show', [$project, $board])
            ->with('success', 'List updated successfully.');
    }

    /**
     * Update the position of lists.
     */
    public function updatePositions(Request $request, Project $project, Board $board): JsonResponse
    {
        // Check if the board belongs to the project
        if ($board->project_id !== $project->id) {
            abort(404, 'Board not found in this project.');
        }

        // Check if user has permission to update lists in this board
        if (!ProjectPermissionService::can($project, 'can_manage_boards')) {
            abort(403, 'You do not have permission to update lists in this board.');
        }

        $validated = $request->validate([
            'lists' => 'required|array',
            'lists.*.id' => 'required|integer|exists:lists,id',
            'lists.*.position' => 'required|integer|min:0',
        ]);

        foreach ($validated['lists'] as $listData) {
            $list = TaskList::find($listData['id']);

            // Make sure the list belongs to the board
            if ($list && $list->board_id === $board->id) {
                $list->update(['position' => $listData['position']]);
            }
        }

        return response()->json(['success' => true]);
    }

    /**
     * Remove the specified list from storage.
     */
    public function destroy(Project $project, Board $board, TaskList $list): RedirectResponse
    {
        // Check if the board belongs to the project and the list belongs to the board
        if ($board->project_id !== $project->id || $list->board_id !== $board->id) {
            abort(404, 'List not found in this board.');
        }

        // Check if user has permission to delete this list
        if (!ProjectPermissionService::can($project, 'can_manage_boards')) {
            abort(403, 'You do not have permission to delete this list.');
        }

        $list->delete();

        return redirect()->route('boards.show', [$project, $board])
            ->with('success', 'List deleted successfully.');
    }
}
