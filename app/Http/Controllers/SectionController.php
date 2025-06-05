<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Section;
use App\Services\ProjectPermissionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SectionController extends Controller
{
    /**
     * Store a newly created section in storage.
     */
    public function store(Request $request, Project $project)
    {
        // Check if user has permission to manage tasks in this project
        if (!ProjectPermissionService::can($project, 'can_manage_tasks')) {
            abort(403, 'You do not have permission to manage sections in this project.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        // Get the highest position value
        $maxPosition = $project->sections()->max('position') ?? -1;

        $section = Section::create([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'project_id' => $project->id,
            'position' => $maxPosition + 1,
        ]);

        return response()->json([
            'success' => true,
            'section' => $section->load('project')
        ]);
    }

    /**
     * Update the specified section in storage.
     */
    public function update(Request $request, Project $project, Section $section)
    {
        // Check if the section belongs to the project
        if ($section->project_id !== $project->id) {
            abort(404, 'Section not found in this project.');
        }

        // Check if user has permission to manage tasks in this project
        if (!ProjectPermissionService::can($project, 'can_manage_tasks')) {
            abort(403, 'You do not have permission to manage sections in this project.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_collapsed' => 'boolean',
        ]);

        $section->update($validated);

        return response()->json([
            'success' => true,
            'section' => $section->fresh(['project'])
        ]);
    }

    /**
     * Remove the specified section from storage.
     */
    public function destroy(Project $project, Section $section)
    {
        // Check if the section belongs to the project
        if ($section->project_id !== $project->id) {
            abort(404, 'Section not found in this project.');
        }

        // Check if user has permission to manage tasks in this project
        if (!ProjectPermissionService::can($project, 'can_manage_tasks')) {
            abort(403, 'You do not have permission to manage sections in this project.');
        }

        // Move tasks to no section before deleting
        $section->tasks()->update(['section_id' => null]);

        $section->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Reorder sections within a project.
     */
    public function reorder(Request $request, Project $project)
    {
        // Check if user has permission to manage tasks in this project
        if (!ProjectPermissionService::can($project, 'can_manage_tasks')) {
            abort(403, 'You do not have permission to manage sections in this project.');
        }

        $validated = $request->validate([
            'section_ids' => 'required|array',
            'section_ids.*' => 'integer|exists:sections,id',
        ]);

        foreach ($validated['section_ids'] as $position => $sectionId) {
            Section::where('id', $sectionId)
                ->where('project_id', $project->id)
                ->update(['position' => $position]);
        }

        return response()->json(['success' => true]);
    }
}
