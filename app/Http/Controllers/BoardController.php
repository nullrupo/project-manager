<?php

namespace App\Http\Controllers;

use App\Models\Board;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class BoardController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Project $project)
    {
        // Check if user has permission to view project
        if (!$project->members()->where('user_id', Auth::id())->exists() && $project->owner_id !== Auth::id()) {
            abort(403, 'You do not have permission to access this project.');
        }

        $boards = $project->boards()->with(['lists.tasks'])->orderBy('position')->get();

        return response()->json($boards);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, Project $project)
    {
        // Check if user has permission to manage boards
        if (!$project->members()->where('user_id', Auth::id())->exists() && $project->owner_id !== Auth::id()) {
            abort(403, 'You do not have permission to create boards in this project.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'type' => ['required', Rule::in(['kanban', 'scrum', 'custom'])],
            'background_color' => 'nullable|string|max:7',
            'background_image' => 'nullable|string|max:255',
            'column_outline_style' => ['nullable', Rule::in(['none', 'subtle', 'bold', 'rounded', 'shadow'])],
            'column_spacing' => ['nullable', Rule::in(['compact', 'normal', 'wide'])],
            'card_style' => ['nullable', Rule::in(['minimal', 'detailed', 'compact'])],
            'show_task_count' => 'boolean',
            'show_wip_limits' => 'boolean',
            'enable_swimlanes' => 'boolean',
        ]);

        // Get the next position
        $maxPosition = $project->boards()->max('position') ?? -1;
        $validated['position'] = $maxPosition + 1;
        $validated['project_id'] = $project->id;

        // If this is the first board, make it default
        if ($project->boards()->count() === 0) {
            $validated['is_default'] = true;
        }

        $board = Board::create($validated);

        // Create default lists based on board type
        $this->createDefaultLists($board);

        return redirect()->back()->with('success', 'Board created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Project $project, Board $board)
    {
        // Check if user has permission to view project
        if (!$project->members()->where('user_id', Auth::id())->exists() && $project->owner_id !== Auth::id()) {
            abort(403, 'You do not have permission to access this project.');
        }

        // Ensure board belongs to project
        if ($board->project_id !== $project->id) {
            abort(404, 'Board not found in this project.');
        }

        $board->load(['lists.tasks.assignees', 'lists.tasks.labels']);

        return response()->json($board);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Project $project, Board $board)
    {
        // Check if user has permission to manage boards
        if (!$project->members()->where('user_id', Auth::id())->exists() && $project->owner_id !== Auth::id()) {
            abort(403, 'You do not have permission to edit boards in this project.');
        }

        // Ensure board belongs to project
        if ($board->project_id !== $project->id) {
            abort(404, 'Board not found in this project.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'type' => ['required', Rule::in(['kanban', 'scrum', 'custom'])],
            'background_color' => 'nullable|string|max:7',
            'background_image' => 'nullable|string|max:255',
            'column_outline_style' => ['nullable', Rule::in(['none', 'subtle', 'bold', 'rounded', 'shadow'])],
            'column_spacing' => ['nullable', Rule::in(['compact', 'normal', 'wide'])],
            'card_style' => ['nullable', Rule::in(['minimal', 'detailed', 'compact'])],
            'show_task_count' => 'boolean',
            'show_wip_limits' => 'boolean',
            'enable_swimlanes' => 'boolean',
        ]);

        $board->update($validated);

        return redirect()->back()->with('success', 'Board updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Project $project, Board $board)
    {
        // Check if user has permission to manage boards
        if (!$project->members()->where('user_id', Auth::id())->exists() && $project->owner_id !== Auth::id()) {
            abort(403, 'You do not have permission to delete boards in this project.');
        }

        // Ensure board belongs to project
        if ($board->project_id !== $project->id) {
            abort(404, 'Board not found in this project.');
        }

        // Prevent deletion if it's the only board
        if ($project->boards()->count() <= 1) {
            return redirect()->back()->withErrors(['board' => 'Cannot delete the last board in a project.']);
        }

        // If deleting the default board, make another board default
        if ($board->is_default) {
            $nextBoard = $project->boards()->where('id', '!=', $board->id)->first();
            if ($nextBoard) {
                $nextBoard->update(['is_default' => true]);
            }
        }

        $board->delete();

        return redirect()->back()->with('success', 'Board deleted successfully.');
    }

    /**
     * Update board positions for reordering.
     */
    public function updatePositions(Request $request, Project $project)
    {
        // Check if user has permission to manage boards
        if (!$project->members()->where('user_id', Auth::id())->exists() && $project->owner_id !== Auth::id()) {
            abort(403, 'You do not have permission to reorder boards in this project.');
        }

        $validated = $request->validate([
            'board_ids' => 'required|array',
            'board_ids.*' => 'integer|exists:boards,id',
        ]);

        foreach ($validated['board_ids'] as $position => $boardId) {
            Board::where('id', $boardId)
                ->where('project_id', $project->id)
                ->update(['position' => $position]);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Set a board as the default board for the project.
     */
    public function setDefault(Project $project, Board $board)
    {
        // Check if user has permission to manage boards
        if (!$project->members()->where('user_id', Auth::id())->exists() && $project->owner_id !== Auth::id()) {
            abort(403, 'You do not have permission to manage boards in this project.');
        }

        // Ensure board belongs to project
        if ($board->project_id !== $project->id) {
            abort(404, 'Board not found in this project.');
        }

        // Remove default from all other boards
        $project->boards()->update(['is_default' => false]);

        // Set this board as default
        $board->update(['is_default' => true]);

        return redirect()->back()->with('success', 'Default board updated successfully.');
    }

    /**
     * Create default lists for a new board based on its type.
     */
    private function createDefaultLists(Board $board)
    {
        $lists = [];

        switch ($board->type) {
            case 'kanban':
                $lists = [
                    ['name' => 'To Do', 'color' => '#3498db'],
                    ['name' => 'In Progress', 'color' => '#f39c12'],
                    ['name' => 'Done', 'color' => '#27ae60'],
                ];
                break;

            case 'scrum':
                $lists = [
                    ['name' => 'Backlog', 'color' => '#95a5a6'],
                    ['name' => 'Sprint Backlog', 'color' => '#3498db'],
                    ['name' => 'In Progress', 'color' => '#f39c12'],
                    ['name' => 'Review', 'color' => '#9b59b6'],
                    ['name' => 'Done', 'color' => '#27ae60'],
                ];
                break;

            case 'custom':
                $lists = [
                    ['name' => 'New', 'color' => '#3498db'],
                ];
                break;
        }

        foreach ($lists as $index => $listData) {
            $board->lists()->create([
                'name' => $listData['name'],
                'color' => $listData['color'],
                'position' => $index,
            ]);
        }
    }
}
