<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use App\Models\Tag;
use App\Models\XpLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TaskController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $search = $request->input('search', '');
        $filter = $request->input('filter', 'all');

        $query = Task::with(['project', 'tags'])
            ->where(function ($query) use ($user) {
                $query->where('assignee_id', $user->id)
                    ->orWhere('reviewer_id', $user->id);
            });

        // Apply status filter
        if ($filter !== 'all') {
            $query->where('status', $filter);
        }

        // Apply search
        if ($search) {
            $query->where(function ($query) use ($search) {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('project', function ($query) use ($search) {
                        $query->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('tags', function ($query) use ($search) {
                        $query->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $tasks = $query->orderBy('due_date')
            ->get()
            ->map(function ($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'project' => $task->project->name,
                    'projectId' => $task->project->id,
                    'dueDate' => $task->due_date,
                    'status' => $task->status,
                    'tags' => $task->tags->map(function ($tag) {
                        return $tag->name;
                    }),
                ];
            });

        // Group tasks by status
        $groupedTasks = [
            'today' => $tasks->filter(function ($task) {
                return $task['dueDate'] && $task['dueDate']->isToday();
            })->values(),
            'upcoming' => $tasks->filter(function ($task) {
                return $task['dueDate'] && $task['dueDate']->isFuture() && !$task['dueDate']->isToday();
            })->values(),
            'completed' => $tasks->filter(function ($task) {
                return $task['status'] === 'done';
            })->values(),
        ];

        return Inertia::render('my-tasks', [
            'tasks' => $groupedTasks
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
            'project_id' => 'required|exists:projects,id',
            'parent_task_id' => 'nullable|exists:tasks,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assignee_id' => 'nullable|exists:users,id',
            'reviewer_id' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date',
            'status' => 'required|in:todo,doing,review,done,archived',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:tags,id'
        ]);

        $user = Auth::user();
        $project = Project::findOrFail($validated['project_id']);

        // Check if user has access to this project
        if (!$user->projects->contains($project) && $project->owner_id !== $user->id) {
            abort(403, 'Unauthorized to add tasks to this project');
        }

        // Create the task
        $task = new Task();
        $task->project_id = $validated['project_id'];
        $task->parent_task_id = $validated['parent_task_id'] ?? null;
        $task->title = $validated['title'];
        $task->description = $validated['description'] ?? null;
        $task->assignee_id = $validated['assignee_id'] ?? null;
        $task->reviewer_id = $validated['reviewer_id'] ?? null;
        $task->due_date = $validated['due_date'] ?? null;
        $task->status = $validated['status'];
        $task->save();

        // Attach tags if provided
        if (isset($validated['tags']) && count($validated['tags']) > 0) {
            $task->tags()->attach($validated['tags']);
        }

        // Update project completion percentage if auto-calculated
        if ($project->auto_calc_complete) {
            $this->updateProjectCompletion($project);
        }

        return redirect()->back();
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $task = Task::with(['project', 'assignee', 'reviewer', 'tags', 'subtasks'])
            ->findOrFail($id);

        $user = Auth::user();
        $project = $task->project;

        // Check if user has access to this project
        if (!$user->projects->contains($project) && $project->owner_id !== $user->id) {
            abort(403, 'Unauthorized to view tasks in this project');
        }

        return response()->json([
            'task' => [
                'id' => $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'project' => [
                    'id' => $project->id,
                    'name' => $project->name
                ],
                'assignee' => $task->assignee ? [
                    'id' => $task->assignee->id,
                    'name' => $task->assignee->name,
                    'initials' => $this->getInitials($task->assignee->name),
                    'avatar' => null
                ] : null,
                'reviewer' => $task->reviewer ? [
                    'id' => $task->reviewer->id,
                    'name' => $task->reviewer->name,
                    'initials' => $this->getInitials($task->reviewer->name),
                    'avatar' => null
                ] : null,
                'dueDate' => $task->due_date,
                'status' => $task->status,
                'tags' => $task->tags->map(function ($tag) {
                    return [
                        'id' => $tag->id,
                        'name' => $tag->name
                    ];
                }),
                'subtasks' => $task->subtasks->map(function ($subtask) {
                    return [
                        'id' => $subtask->id,
                        'title' => $subtask->title,
                        'status' => $subtask->status
                    ];
                })
            ]
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
        $task = Task::findOrFail($id);
        $user = Auth::user();
        $project = $task->project;

        // Check if user has access to this project
        if (!$user->projects->contains($project) && $project->owner_id !== $user->id) {
            abort(403, 'Unauthorized to update tasks in this project');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assignee_id' => 'nullable|exists:users,id',
            'reviewer_id' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date',
            'status' => 'required|in:todo,doing,review,done,archived',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:tags,id'
        ]);

        // Check if status is changing to 'done'
        $statusChangedToDone = $task->status !== 'done' && $validated['status'] === 'done';

        // Update the task
        $task->title = $validated['title'];
        $task->description = $validated['description'] ?? $task->description;
        $task->assignee_id = $validated['assignee_id'] ?? $task->assignee_id;
        $task->reviewer_id = $validated['reviewer_id'] ?? $task->reviewer_id;
        $task->due_date = $validated['due_date'] ?? $task->due_date;
        $task->status = $validated['status'];
        $task->save();

        // Update tags if provided
        if (isset($validated['tags'])) {
            $task->tags()->sync($validated['tags']);
        }

        // Award XP if task is completed
        if ($statusChangedToDone && $task->assignee_id) {
            $this->awardXpForTaskCompletion($task);
        }

        // Update project completion percentage if auto-calculated
        if ($project->auto_calc_complete) {
            $this->updateProjectCompletion($project);
        }

        return redirect()->back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $task = Task::findOrFail($id);
        $user = Auth::user();
        $project = $task->project;

        // Check if user has access to this project
        if (!$user->projects->contains($project) && $project->owner_id !== $user->id) {
            abort(403, 'Unauthorized to delete tasks in this project');
        }

        // Delete the task (soft delete)
        $task->delete();

        // Update project completion percentage if auto-calculated
        if ($project->auto_calc_complete) {
            $this->updateProjectCompletion($project);
        }

        return redirect()->back();
    }

    /**
     * Update the completion percentage of a project based on completed tasks.
     */
    private function updateProjectCompletion(Project $project)
    {
        $totalTasks = $project->tasks()->count();

        if ($totalTasks > 0) {
            $completedTasks = $project->tasks()->where('status', 'done')->count();
            $percentComplete = round(($completedTasks / $totalTasks) * 100, 2);

            $project->percent_complete = $percentComplete;
            $project->save();
        }
    }

    /**
     * Award XP to a user for completing a task.
     */
    private function awardXpForTaskCompletion(Task $task)
    {
        if (!$task->assignee_id) {
            return;
        }

        // Base XP for task completion
        $xpAmount = 10;

        // Store the XP earned in the task
        $task->xp_earned = $xpAmount;
        $task->save();

        // Add XP to the user
        $user = $task->assignee;
        $user->xp += $xpAmount;

        // Check if user should level up (simple formula: level = xp / 100)
        $newLevel = floor($user->xp / 100) + 1;
        if ($newLevel > $user->level) {
            $user->level = $newLevel;
        }

        $user->save();

        // Log the XP gain
        XpLog::create([
            'user_id' => $user->id,
            'delta' => $xpAmount,
            'reason' => 'Task completed: ' . $task->title,
            'ref_type' => 'task',
            'ref_id' => $task->id
        ]);
    }

    /**
     * Get tasks for a specific project.
     */
    public function projectTasks(string $id, Request $request)
    {
        $user = Auth::user();
        $project = Project::findOrFail($id);

        // Check if user has access to this project
        if (!$user->projects->contains($project) && $project->owner_id !== $user->id) {
            abort(403, 'Unauthorized to view tasks in this project');
        }

        $view = $request->input('view', 'kanban');
        $from = $request->input('from');
        $to = $request->input('to');

        $query = Task::with(['assignee', 'tags'])
            ->where('project_id', $project->id)
            ->whereNull('parent_task_id'); // Only get top-level tasks

        // Apply date filters for calendar view
        if ($view === 'calendar' && $from && $to) {
            $query->whereBetween('due_date', [$from, $to]);
        }

        $tasks = $query->get();

        // Group tasks by status for kanban view
        if ($view === 'kanban') {
            $groupedTasks = [
                'todo' => [],
                'doing' => [],
                'review' => [],
                'done' => []
            ];

            foreach ($tasks as $task) {
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

                $groupedTasks[$task->status][] = $taskData;
            }

            return response()->json(['tasks' => $groupedTasks]);
        }

        // Return flat list for other views
        $tasksList = $tasks->map(function ($task) {
            return [
                'id' => $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'assignee' => $task->assignee ? [
                    'name' => $task->assignee->name,
                    'initials' => $this->getInitials($task->assignee->name),
                    'avatar' => null
                ] : null,
                'dueDate' => $task->due_date,
                'status' => $task->status,
                'tags' => $task->tags->map(function ($tag) {
                    return $tag->name;
                })
            ];
        });

        return response()->json(['tasks' => $tasksList]);
    }

    /**
     * Review a task (approve or reject).
     */
    public function review(Request $request, string $id)
    {
        $task = Task::findOrFail($id);
        $user = Auth::user();

        // Check if user is the assigned reviewer
        if ($task->reviewer_id !== $user->id) {
            abort(403, 'Unauthorized to review this task');
        }

        $validated = $request->validate([
            'action' => 'required|in:approve,reject',
            'comment' => 'nullable|string'
        ]);

        if ($validated['action'] === 'approve') {
            // Mark task as done
            $task->status = 'done';
            $task->save();

            // Award XP to reviewer
            $user->xp += 5;
            $user->save();

            // Log the XP gain
            XpLog::create([
                'user_id' => $user->id,
                'delta' => 5,
                'reason' => 'Task reviewed and approved: ' . $task->title,
                'ref_type' => 'task_review',
                'ref_id' => $task->id
            ]);

            // Award XP to assignee if exists
            if ($task->assignee_id) {
                $this->awardXpForTaskCompletion($task);
            }

            // Update project completion percentage if auto-calculated
            if ($task->project->auto_calc_complete) {
                $this->updateProjectCompletion($task->project);
            }
        } else {
            // Reject - move back to doing
            $task->status = 'doing';
            $task->save();
        }

        // Add comment if provided
        if (!empty($validated['comment'])) {
            $task->comments()->create([
                'user_id' => $user->id,
                'content' => $validated['comment'],
                'type' => $validated['action'] === 'approve' ? 'approval' : 'rejection'
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Task ' . ($validated['action'] === 'approve' ? 'approved' : 'rejected'),
            'task' => [
                'id' => $task->id,
                'status' => $task->status
            ]
        ]);
    }

    /**
     * Get initials from a name.
     */
    private function getInitials(string $name): string
    {
        $words = explode(' ', $name);
        $initials = '';

        foreach ($words as $word) {
            $initials .= strtoupper(substr($word, 0, 1));
        }

        return substr($initials, 0, 2);
    }
}
