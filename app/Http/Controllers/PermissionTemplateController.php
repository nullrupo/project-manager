<?php

namespace App\Http\Controllers;

use App\Models\PermissionTemplate;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PermissionTemplateController extends Controller
{
    /**
     * Display a listing of permission templates.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $projectId = $request->get('project_id');
        
        $templates = PermissionTemplate::accessibleBy($user->id, $projectId)
            ->with(['creator:id,name', 'project:id,name'])
            ->orderBy('usage_count', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($templates);
    }

    /**
     * Store a newly created permission template.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'scope' => 'required|in:global,project,personal',
            'base_role' => 'required|in:admin,editor,viewer',
            'project_id' => 'nullable|exists:projects,id',
            'can_manage_members' => 'boolean',
            'can_manage_boards' => 'boolean',
            'can_manage_tasks' => 'boolean',
            'can_manage_labels' => 'boolean',
            'can_view_project' => 'boolean',
            'can_comment' => 'boolean',
        ]);

        // Validate scope-specific rules
        if ($validated['scope'] === 'project' && !$validated['project_id']) {
            return redirect()->back()->withErrors(['project_id' => 'Project is required for project-scoped templates.']);
        }

        if ($validated['scope'] === 'global' && !Auth::user()->is_admin) {
            return redirect()->back()->withErrors(['scope' => 'Only administrators can create global templates.']);
        }

        // Check for duplicate names within the same scope
        $existingTemplate = PermissionTemplate::where('name', $validated['name'])
            ->where('created_by', Auth::id())
            ->where('project_id', $validated['project_id'])
            ->first();

        if ($existingTemplate) {
            return redirect()->back()->withErrors(['name' => 'A template with this name already exists in this scope.']);
        }

        PermissionTemplate::create(array_merge($validated, [
            'created_by' => Auth::id(),
        ]));

        return redirect()->back()->with('success', 'Permission template created successfully.');
    }

    /**
     * Update the specified permission template.
     */
    public function update(Request $request, PermissionTemplate $template): RedirectResponse
    {
        // Check if user can edit this template
        if ($template->created_by !== Auth::id() && !Auth::user()->is_admin) {
            abort(403, 'You do not have permission to edit this template.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'scope' => 'required|in:global,project,personal',
            'base_role' => 'required|in:admin,editor,viewer',
            'project_id' => 'nullable|exists:projects,id',
            'can_manage_members' => 'boolean',
            'can_manage_boards' => 'boolean',
            'can_manage_tasks' => 'boolean',
            'can_manage_labels' => 'boolean',
            'can_view_project' => 'boolean',
            'can_comment' => 'boolean',
        ]);

        // Validate scope-specific rules
        if ($validated['scope'] === 'project' && !$validated['project_id']) {
            return redirect()->back()->withErrors(['project_id' => 'Project is required for project-scoped templates.']);
        }

        if ($validated['scope'] === 'global' && !Auth::user()->is_admin) {
            return redirect()->back()->withErrors(['scope' => 'Only administrators can create global templates.']);
        }

        // Check for duplicate names (excluding current template)
        $existingTemplate = PermissionTemplate::where('name', $validated['name'])
            ->where('created_by', Auth::id())
            ->where('project_id', $validated['project_id'])
            ->where('id', '!=', $template->id)
            ->first();

        if ($existingTemplate) {
            return redirect()->back()->withErrors(['name' => 'A template with this name already exists in this scope.']);
        }

        $template->update($validated);

        return redirect()->back()->with('success', 'Permission template updated successfully.');
    }

    /**
     * Remove the specified permission template.
     */
    public function destroy(PermissionTemplate $template): RedirectResponse
    {
        // Check if user can delete this template
        if ($template->created_by !== Auth::id() && !Auth::user()->is_admin) {
            abort(403, 'You do not have permission to delete this template.');
        }

        $template->delete();

        return redirect()->back()->with('success', 'Permission template deleted successfully.');
    }

    /**
     * Get suggested templates for a specific role and project.
     */
    public function suggested(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'role' => 'required|in:admin,editor,viewer',
            'project_id' => 'nullable|exists:projects,id',
        ]);

        $templates = PermissionTemplate::getSuggested(
            $validated['role'],
            $validated['project_id'],
            Auth::id()
        );

        return response()->json($templates);
    }

    /**
     * Apply a template to get permission settings.
     */
    public function apply(PermissionTemplate $template): JsonResponse
    {
        // Check if user can access this template
        $user = Auth::user();
        $canAccess = $template->scope === 'global' ||
                    ($template->scope === 'personal' && $template->created_by === $user->id) ||
                    ($template->scope === 'project' && $template->project && 
                     $template->project->members()->where('user_id', $user->id)->exists());

        if (!$canAccess) {
            abort(403, 'You do not have access to this template.');
        }

        // Increment usage count
        $template->incrementUsage();

        return response()->json([
            'permissions' => $template->getPermissions(),
            'role' => $template->base_role,
            'template_name' => $template->name,
        ]);
    }

    /**
     * Create a template from an existing invitation.
     */
    public function createFromInvitation(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'invitation_id' => 'required|exists:project_invitations,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'scope' => 'required|in:project,personal',
        ]);

        $invitation = \App\Models\ProjectInvitation::findOrFail($validated['invitation_id']);

        // Check if user can create template from this invitation
        if ($invitation->invited_by !== Auth::id()) {
            abort(403, 'You can only create templates from invitations you sent.');
        }

        // Check for duplicate names
        $existingTemplate = PermissionTemplate::where('name', $validated['name'])
            ->where('created_by', Auth::id())
            ->where('project_id', $validated['scope'] === 'project' ? $invitation->project_id : null)
            ->first();

        if ($existingTemplate) {
            return redirect()->back()->withErrors(['name' => 'A template with this name already exists.']);
        }

        PermissionTemplate::createFromInvitation(
            $invitation,
            $validated['name'],
            $validated['description'],
            $validated['scope']
        );

        return redirect()->back()->with('success', 'Permission template created from invitation successfully.');
    }

    /**
     * Get templates for a specific project.
     */
    public function forProject(Project $project): JsonResponse
    {
        $user = Auth::user();
        
        // Check if user has access to the project
        if ($project->owner_id !== $user->id && !$project->members()->where('user_id', $user->id)->exists()) {
            abort(403, 'You do not have access to this project.');
        }

        $templates = PermissionTemplate::accessibleBy($user->id, $project->id)
            ->with(['creator:id,name'])
            ->orderBy('usage_count', 'desc')
            ->get();

        return response()->json($templates);
    }

    /**
     * Bulk import templates from another project.
     */
    public function bulkImport(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'source_project_id' => 'required|exists:projects,id',
            'target_project_id' => 'required|exists:projects,id',
            'template_ids' => 'required|array',
            'template_ids.*' => 'exists:permission_templates,id',
        ]);

        $user = Auth::user();
        $sourceProject = Project::findOrFail($validated['source_project_id']);
        $targetProject = Project::findOrFail($validated['target_project_id']);

        // Check permissions for both projects
        if (!$this->canManageProject($sourceProject, $user) || !$this->canManageProject($targetProject, $user)) {
            abort(403, 'You do not have permission to manage templates for these projects.');
        }

        $imported = 0;
        foreach ($validated['template_ids'] as $templateId) {
            $template = PermissionTemplate::find($templateId);
            
            if ($template && $template->project_id === $sourceProject->id) {
                // Create a copy in the target project
                PermissionTemplate::create([
                    'name' => $template->name . ' (Imported)',
                    'description' => $template->description,
                    'created_by' => $user->id,
                    'project_id' => $targetProject->id,
                    'scope' => 'project',
                    'base_role' => $template->base_role,
                    'can_manage_members' => $template->can_manage_members,
                    'can_manage_boards' => $template->can_manage_boards,
                    'can_manage_tasks' => $template->can_manage_tasks,
                    'can_manage_labels' => $template->can_manage_labels,
                    'can_view_project' => $template->can_view_project,
                    'can_comment' => $template->can_comment,
                ]);
                $imported++;
            }
        }

        return redirect()->back()->with('success', "Successfully imported {$imported} templates.");
    }

    /**
     * Check if user can manage a project.
     */
    private function canManageProject(Project $project, $user): bool
    {
        return $project->owner_id === $user->id || 
               $project->members()->where('user_id', $user->id)->wherePivot('can_manage_members', true)->exists();
    }
}
