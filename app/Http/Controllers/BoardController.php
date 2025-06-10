<?php

namespace App\Http\Controllers;

use App\Models\Board;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\ProjectPermissionService;

class BoardController extends Controller
{
    // No constructor needed - middleware is applied in routes file

    /**
     * Display a listing of the boards for a project.
     */
    public function index(Project $project): Response
    {
        // All authenticated users can view projects

        $boards = $project->boards()
            ->with('lists')
            ->orderBy('position')
            ->get();

        // Add permission information using the new permission system
        $project->can_edit = ProjectPermissionService::can($project, 'can_manage_boards');

        return Inertia::render('boards/index', [
            'project' => $project,
            'boards' => $boards,
        ]);
    }

    /**
     * Show the form for creating a new board.
     */
    public function create(Project $project): Response
    {
        // Prevent creation of additional boards - each project should have only one board
        abort(403, 'Creating additional boards is not allowed. Each project is limited to one board.');
    }

    /**
     * Store a newly created board in storage.
     */
    public function store(Request $request, Project $project): RedirectResponse
    {
        // Prevent creation of additional boards - each project should have only one board
        abort(403, 'Creating additional boards is not allowed. Each project is limited to one board.');
    }

    /**
     * Display the specified board.
     */
    public function show(Project $project, Board $board): Response
    {
        // All authenticated users can view projects

        // Check if the board belongs to the project
        if ($board->project_id !== $project->id) {
            abort(404, 'Board not found in this project.');
        }

        // Load the board with its relationships
        $board->load([
            'lists' => function ($query) {
                $query->orderBy('position');
            },
            'lists.tasks' => function ($query) {
                $query->orderBy('position');
            },
            'lists.tasks.assignees',
            'lists.tasks.labels',
            'lists.tasks.tags',
            'lists.tasks.creator',
            'lists.tasks.checklistItems',
            'lists.tasks.project',
            'lists.tasks.comments.user',
            'lists.tasks.list.board',
        ]);

        // Load project members and labels for task modals
        $project->load([
            'members',
            'owner',
            'labels'
        ]);

        // Get unique members (including owner)
        $members = $project->members->toBase();
        if ($project->owner && !$members->contains('id', $project->owner->id)) {
            $members->push($project->owner);
        }

        // Add permission information using the new permission system
        $project->can_edit = ProjectPermissionService::can($project, 'can_manage_boards');
        $board->can_edit = ProjectPermissionService::can($project, 'can_manage_boards');
        $board->can_manage_tasks = ProjectPermissionService::can($project, 'can_manage_tasks');

        return Inertia::render('boards/show', [
            'project' => $project,
            'board' => $board,
            'members' => $members,
            'labels' => $project->labels,
        ]);
    }

    /**
     * Show the form for editing the specified board.
     */
    public function edit(Project $project, Board $board): Response
    {
        // Check if the board belongs to the project
        if ($board->project_id !== $project->id) {
            abort(404, 'Board not found in this project.');
        }

        // Check if user has permission to edit this board
        if (!ProjectPermissionService::can($project, 'can_manage_boards')) {
            abort(403, 'You do not have permission to edit this board.');
        }

        return Inertia::render('boards/edit', [
            'project' => $project,
            'board' => $board,
        ]);
    }

    /**
     * Update the specified board in storage.
     */
    public function update(Request $request, Project $project, Board $board): RedirectResponse
    {
        // Check if the board belongs to the project
        if ($board->project_id !== $project->id) {
            abort(404, 'Board not found in this project.');
        }

        // Check if user has permission to update this board
        if (!ProjectPermissionService::can($project, 'can_manage_boards')) {
            abort(403, 'You do not have permission to update this board.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|string|in:kanban,scrum,custom',
            'background_color' => 'nullable|string|max:50',
            'background_image' => 'nullable|string|max:255',
        ]);

        $board->update($validated);

        return redirect()->route('boards.show', [$project, $board])
            ->with('success', 'Board updated successfully.');
    }

    /**
     * Remove the specified board from storage.
     */
    public function destroy(Project $project, Board $board): RedirectResponse
    {
        // Check if the board belongs to the project
        if ($board->project_id !== $project->id) {
            abort(404, 'Board not found in this project.');
        }

        // Check if user has permission to delete this board
        if (!ProjectPermissionService::can($project, 'can_manage_boards')) {
            abort(403, 'You do not have permission to delete this board.');
        }

        $board->delete();

        return redirect()->route('projects.show', $project)
            ->with('success', 'Board deleted successfully.');
    }
}
