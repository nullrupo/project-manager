<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $search = $request->input('search', '');

        $projects = $user->projects()
            ->with('owner')
            ->withCount(['tasks as completed_tasks' => function ($query) {
                $query->where('status', 'done');
            }])
            ->withCount('tasks')
            ->when($search, function ($query, $search) {
                return $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($project) {
                $percentComplete = $project->auto_calc_complete && $project->tasks_count > 0
                    ? round(($project->completed_tasks / $project->tasks_count) * 100, 2)
                    : $project->percent_complete;

                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'description' => $project->description,
                    'percentComplete' => $percentComplete,
                    'dueDate' => $project->due_date,
                    'status' => $project->status,
                    'owner' => [
                        'name' => $project->owner->name,
                        'avatar' => null,
                        'initials' => $this->getInitials($project->owner->name)
                    ],
                    'tasks' => [
                        'total' => $project->tasks_count,
                        'completed' => $project->completed_tasks
                    ],
                    'members' => $project->members()
                        ->take(3)
                        ->get()
                        ->map(function ($member) {
                            return [
                                'name' => $member->name,
                                'avatar' => null,
                                'initials' => $this->getInitials($member->name)
                            ];
                        })
                ];
            });

        return Inertia::render('projects/index', [
            'projects' => $projects
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date|after_or_equal:start_date',
            'auto_calc_complete' => 'boolean',
            'percent_complete' => 'nullable|numeric|min:0|max:100',
            'members' => 'nullable|array',
            'members.*' => 'exists:users,id'
        ]);

        $user = Auth::user();

        // Create the project
        $project = new Project();
        $project->name = $validated['name'];
        $project->description = $validated['description'] ?? null;
        $project->owner_id = $user->id;
        $project->start_date = $validated['start_date'] ?? null;
        $project->due_date = $validated['due_date'] ?? null;
        $project->auto_calc_complete = $validated['auto_calc_complete'] ?? true;
        $project->percent_complete = $validated['percent_complete'] ?? 0;
        $project->status = 'active';
        $project->save();

        // Add the owner as a member with 'owner' role
        $project->members()->attach($user->id, ['role' => 'owner']);

        // Add other members if provided
        if (isset($validated['members'])) {
            foreach ($validated['members'] as $memberId) {
                if ($memberId != $user->id) { // Skip the owner as they're already added
                    $project->members()->attach($memberId, ['role' => 'member']);
                }
            }
        }

        return redirect()->route('projects.show', $project->id);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = Auth::user();
        $project = Project::with(['owner', 'members'])
            ->withCount(['tasks as completed_tasks' => function ($query) {
                $query->where('status', 'done');
            }])
            ->withCount('tasks')
            ->findOrFail($id);

        // Check if user has access to this project
        if (!$user->projects->contains($project) && $project->owner_id !== $user->id) {
            abort(403, 'Unauthorized access to this project');
        }

        $percentComplete = $project->auto_calc_complete && $project->tasks_count > 0
            ? round(($project->completed_tasks / $project->tasks_count) * 100, 2)
            : $project->percent_complete;

        $tasks = [
            'todo' => [],
            'doing' => [],
            'review' => [],
            'done' => []
        ];

        // Get tasks grouped by status
        $projectTasks = Task::with(['assignee', 'tags'])
            ->where('project_id', $project->id)
            ->whereNull('parent_task_id') // Only get top-level tasks
            ->get();

        foreach ($projectTasks as $task) {
            $taskData = [
                'id' => $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'assignee' => $task->assignee ? [
                    'name' => $task->assignee->name,
                    'initials' => $this->getInitials($task->assignee->name),
                    'avatar' => null
                ] : null,
                'dueDate' => $task->due_date,
                'tags' => $task->tags->map(function ($tag) {
                    return $tag->name;
                })
            ];

            $tasks[$task->status][] = $taskData;
        }

        $projectData = [
            'id' => $project->id,
            'name' => $project->name,
            'description' => $project->description,
            'percentComplete' => $percentComplete,
            'dueDate' => $project->due_date,
            'status' => $project->status,
            'owner' => [
                'name' => $project->owner->name,
                'avatar' => null,
                'initials' => $this->getInitials($project->owner->name)
            ],
            'tasks' => [
                'total' => $project->tasks_count,
                'completed' => $project->completed_tasks
            ],
            'members' => $project->members->map(function ($member) {
                return [
                    'name' => $member->name,
                    'avatar' => null,
                    'initials' => $this->getInitials($member->name)
                ];
            })
        ];

        return Inertia::render('projects/show', [
            'project' => $projectData,
            'tasks' => $tasks
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = Auth::user();
        $project = Project::findOrFail($id);

        // Check if user has permission to update this project
        if ($project->owner_id !== $user->id) {
            abort(403, 'Unauthorized to update this project');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date|after_or_equal:start_date',
            'auto_calc_complete' => 'boolean',
            'percent_complete' => 'nullable|numeric|min:0|max:100',
            'status' => 'in:active,archived',
            'members' => 'nullable|array',
            'members.*' => 'exists:users,id'
        ]);

        // Update the project
        $project->name = $validated['name'];
        $project->description = $validated['description'] ?? $project->description;
        $project->start_date = $validated['start_date'] ?? $project->start_date;
        $project->due_date = $validated['due_date'] ?? $project->due_date;
        $project->auto_calc_complete = $validated['auto_calc_complete'] ?? $project->auto_calc_complete;
        $project->percent_complete = $validated['percent_complete'] ?? $project->percent_complete;
        $project->status = $validated['status'] ?? $project->status;
        $project->save();

        // Update members if provided
        if (isset($validated['members'])) {
            // Get current members
            $currentMembers = $project->members()->pluck('users.id')->toArray();

            // Add new members
            foreach ($validated['members'] as $memberId) {
                if (!in_array($memberId, $currentMembers)) {
                    $project->members()->attach($memberId, ['role' => 'member']);
                }
            }

            // Remove members that are not in the new list
            foreach ($currentMembers as $memberId) {
                if ($memberId != $user->id && !in_array($memberId, $validated['members'])) {
                    $project->members()->detach($memberId);
                }
            }
        }

        return redirect()->route('projects.show', $project->id);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = Auth::user();
        $project = Project::findOrFail($id);

        // Check if user has permission to delete this project
        if ($project->owner_id !== $user->id) {
            abort(403, 'Unauthorized to delete this project');
        }

        // Delete the project (soft delete)
        $project->delete();

        return redirect()->route('projects.index');
    }

    /**
     * Get initials from a name.
     */
    private function getInitials($name)
    {
        $words = explode(' ', $name);
        $initials = '';

        foreach ($words as $word) {
            $initials .= strtoupper(substr($word, 0, 1));
        }

        return strlen($initials) > 2 ? substr($initials, 0, 2) : $initials;
    }
}
