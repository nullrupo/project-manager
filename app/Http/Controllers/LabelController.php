<?php

namespace App\Http\Controllers;

use App\Models\Label;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class LabelController extends Controller
{
    // No constructor needed - middleware is applied in routes file

    /**
     * Display a listing of the labels for a project.
     */
    public function index(Project $project): Response|JsonResponse
    {
        // All authenticated users can view projects

        $labels = $project->labels()->get();

        // Add permission information
        $project->can_edit = Auth::id() === $project->owner_id;

        // Return JSON if requested via AJAX
        if (request()->expectsJson()) {
            return response()->json([
                'labels' => $labels,
                'project' => $project
            ]);
        }

        return Inertia::render('labels/index', [
            'project' => $project,
            'labels' => $labels,
        ]);
    }

    /**
     * Show the form for creating a new label.
     */
    public function create(Project $project): Response
    {
        // Check if user is the project owner
        if (Auth::id() !== $project->owner_id) {
            abort(403, 'You do not have permission to create labels in this project.');
        }

        return Inertia::render('labels/create', [
            'project' => $project,
        ]);
    }

    /**
     * Store a newly created label in storage.
     */
    public function store(Request $request, Project $project): RedirectResponse
    {
        // Check if user has permission to create labels in this project
        if ($project->owner_id !== Auth::id() && !$project->members()->where('user_id', Auth::id())->where('role', '!=', 'member')->exists()) {
            abort(403, 'You do not have permission to create labels in this project.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'required|string|max:50',
            'description' => 'nullable|string',
        ]);

        // Create the label
        $project->labels()->create($validated);

        return redirect()->route('labels.index', $project)
            ->with('success', 'Label created successfully.');
    }

    /**
     * Show the form for editing the specified label.
     */
    public function edit(Project $project, Label $label): Response
    {
        // Check if the label belongs to the project
        if ($label->project_id !== $project->id) {
            abort(404, 'Label not found in this project.');
        }

        return Inertia::render('labels/edit', [
            'project' => $project,
            'label' => $label,
        ]);
    }

    /**
     * Update the specified label in storage.
     */
    public function update(Request $request, Project $project, Label $label): RedirectResponse
    {
        // Check if the label belongs to the project
        if ($label->project_id !== $project->id) {
            abort(404, 'Label not found in this project.');
        }

        // Check if user has permission to update this label
        if ($project->owner_id !== Auth::id() && !$project->members()->where('user_id', Auth::id())->where('role', '!=', 'member')->exists()) {
            abort(403, 'You do not have permission to update this label.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'required|string|max:50',
            'description' => 'nullable|string',
        ]);

        $label->update($validated);

        return redirect()->route('labels.index', $project)
            ->with('success', 'Label updated successfully.');
    }

    /**
     * Remove the specified label from storage.
     */
    public function destroy(Project $project, Label $label): RedirectResponse
    {
        // Check if the label belongs to the project
        if ($label->project_id !== $project->id) {
            abort(404, 'Label not found in this project.');
        }

        // Check if user has permission to delete this label
        if ($project->owner_id !== Auth::id() && !$project->members()->where('user_id', Auth::id())->where('role', '!=', 'member')->exists()) {
            abort(403, 'You do not have permission to delete this label.');
        }

        $label->delete();

        return redirect()->route('labels.index', $project)
            ->with('success', 'Label deleted successfully.');
    }
}
