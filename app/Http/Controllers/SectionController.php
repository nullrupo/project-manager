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

        return back()->with('success', 'Section created successfully.');
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

        return back()->with('success', 'Section updated successfully.');
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

        return back()->with('success', 'Section deleted successfully.');
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

        return back()->with('success', 'Sections reordered successfully.');
    }

    /**
     * Move a section (and its tasks) to another project.
     */
    public function move(Request $request, Section $section)
    {
        $user = Auth::user();
        $targetProjectId = $request->input('target_project_id');
        $targetProject = Project::findOrFail($targetProjectId);

        // Only allow if user can manage tasks in both source and target projects
        $sourceProject = $section->project;
        if (!ProjectPermissionService::can($sourceProject, 'can_manage_tasks') || !ProjectPermissionService::can($targetProject, 'can_manage_tasks')) {
            abort(403, 'You do not have permission to move sections between these projects.');
        }

        // Get the highest position in the target project
        $maxPosition = $targetProject->sections()->max('position') ?? -1;

        // Move the section
        $section->project_id = $targetProject->id;
        $section->position = $maxPosition + 1;
        $section->save();

        // Move all tasks in the section to the new project and section
        foreach ($section->tasks as $task) {
            $task->project_id = $targetProject->id;
            $task->section_id = $section->id;
            $task->save();
        }

        return response()->json(['success' => true, 'message' => 'Section moved successfully.']);
    }
}
