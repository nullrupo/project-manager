<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    // No constructor needed - middleware is applied in routes file

    /**
     * Display a listing of the projects.
     */
    public function index(): Response
    {
        // Get all projects for all users to view
        $projects = Project::with('owner')
            ->orderBy('created_at', 'desc')
            ->get();

        // Add permission information for each project
        $projects->each(function ($project) {
            $project->can_edit = Auth::id() === $project->owner_id;
        });

        return Inertia::render('projects/index', [
            'projects' => $projects,
        ]);
    }

    /**
     * Show the form for creating a new project.
     */
    public function create(): Response
    {
        return Inertia::render('projects/create');
    }

    /**
     * Store a newly created project in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'key' => 'required|string|max:10|unique:projects,key',
            'description' => 'nullable|string',
            'is_public' => 'boolean',
            'background_color' => 'nullable|string|max:50',
            'icon' => 'nullable|string|max:50',
        ]);

        // Create the project
        $project = new Project($validated);
        $project->owner_id = Auth::id();
        $project->save();

        // Add the creator as a member with 'owner' role
        $project->members()->attach(Auth::id(), ['role' => 'owner']);

        // Create a default board
        $board = $project->boards()->create([
            'name' => 'Default Board',
            'is_default' => true,
            'type' => 'kanban',
        ]);

        // Create default lists for the board
        $board->lists()->create([
            'name' => 'To Do',
            'position' => 0,
            'color' => '#3498db',
        ]);

        $board->lists()->create([
            'name' => 'In Progress',
            'position' => 1,
            'color' => '#f39c12',
        ]);

        $board->lists()->create([
            'name' => 'Done',
            'position' => 2,
            'color' => '#2ecc71',
        ]);

        return redirect()->route('projects.show', $project)
            ->with('success', 'Project created successfully.');
    }

    /**
     * Display the specified project.
     */
    public function show(Project $project): Response
    {
        // Load the project with its relationships
        $project->load([
            'owner',
            'members',
            'boards' => function ($query) {
                $query->orderBy('position');
            },
            'boards.lists' => function ($query) {
                $query->orderBy('position');
            },
        ]);

        // Add permission information
        $project->can_edit = Auth::id() === $project->owner_id;

        return Inertia::render('projects/show', [
            'project' => $project,
        ]);
    }

    /**
     * Show the form for editing the specified project.
     */
    public function edit(Project $project): Response
    {
        // Check if the user is the owner
        if (Auth::id() !== $project->owner_id) {
            abort(403, 'You do not have permission to edit this project.');
        }

        return Inertia::render('projects/edit', [
            'project' => $project,
        ]);
    }

    /**
     * Update the specified project in storage.
     */
    public function update(Request $request, Project $project): RedirectResponse
    {
        // Check if the user is the owner
        if (Auth::id() !== $project->owner_id) {
            abort(403, 'You do not have permission to edit this project.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'key' => 'required|string|max:10|unique:projects,key,' . $project->id,
            'description' => 'nullable|string',
            'is_public' => 'boolean',
            'background_color' => 'nullable|string|max:50',
            'icon' => 'nullable|string|max:50',
        ]);

        $project->update($validated);

        return redirect()->route('projects.show', $project)
            ->with('success', 'Project updated successfully.');
    }

    /**
     * Remove the specified project from storage.
     */
    public function destroy(Project $project): RedirectResponse
    {
        // Check if the user is the owner
        if (Auth::id() !== $project->owner_id) {
            return back()->with('error', 'You do not have permission to delete this project.');
        }

        $project->delete();

        return redirect()->route('projects.index')
            ->with('success', 'Project deleted successfully.');
    }
}
