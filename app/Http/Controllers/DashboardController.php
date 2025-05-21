<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Display the dashboard.
     */
    public function index()
    {
        $user = Auth::user();

        // Get recent projects
        $recentProjects = $user->projects()
            ->with('owner')
            ->withCount(['tasks as completed_tasks' => function ($query) {
                $query->where('status', 'done');
            }])
            ->withCount('tasks')
            ->orderBy('updated_at', 'desc')
            ->take(3)
            ->get()
            ->map(function ($project) {
                $percentComplete = $project->auto_calc_complete && $project->tasks_count > 0
                    ? round(($project->completed_tasks / $project->tasks_count) * 100, 2)
                    : $project->percent_complete;

                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'percentComplete' => $percentComplete,
                    'dueDate' => $project->due_date,
                ];
            });

        // Get upcoming tasks
        $upcomingTasks = $user->assignedTasks()
            ->with(['project', 'tags'])
            ->where('due_date', '>=', now())
            ->where('due_date', '<=', now()->addDays(7))
            ->orderBy('due_date')
            ->take(4)
            ->get()
            ->map(function ($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'project' => $task->project->name,
                    'dueDate' => $task->due_date,
                    'status' => $task->status,
                ];
            });

        // Get team members
        $teamMembers = User::orderBy('xp', 'desc')
            ->take(4)
            ->get()
            ->map(function ($member) {
                return [
                    'name' => $member->name,
                    'avatar' => null,
                    'initials' => $this->getInitials($member->name),
                    'xp' => $member->xp,
                    'level' => $member->level,
                ];
            });

        return Inertia::render('dashboard', [
            'recentProjects' => $recentProjects,
            'upcomingTasks' => $upcomingTasks,
            'teamMembers' => $teamMembers,
            'userStats' => [
                'tasksCompleted' => $user->assignedTasks()->where('status', 'done')->count(),
                'xpEarned' => $user->xp,
                'currentLevel' => $user->level,
                'nextLevelProgress' => 80, // This would be calculated based on XP requirements
            ],
        ]);
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
