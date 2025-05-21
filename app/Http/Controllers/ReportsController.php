<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportsController extends Controller
{
    /**
     * Display the reports page.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $timeRange = $request->input('timeRange', 'month');
        
        // Get date range based on time range
        $startDate = now();
        switch ($timeRange) {
            case 'week':
                $startDate = $startDate->subDays(7);
                break;
            case 'month':
                $startDate = $startDate->subDays(30);
                break;
            case 'quarter':
                $startDate = $startDate->subDays(90);
                break;
            case 'year':
                $startDate = $startDate->subDays(365);
                break;
        }
        
        // Get project completion data
        $projectCompletionData = Project::whereHas('members', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->orWhere('owner_id', $user->id)
            ->withCount(['tasks', 'tasks as completed_tasks' => function($query) {
                $query->where('status', 'done');
            }])
            ->get()
            ->map(function($project) {
                return [
                    'project' => $project->name,
                    'completed' => $project->completed_tasks,
                    'total' => $project->tasks_count
                ];
            });
            
        // Get team performance data
        $teamPerformanceData = User::whereHas('projects', function($query) use ($user) {
                $query->whereIn('project_id', $user->projects->pluck('id'));
            })
            ->orWhereIn('id', Project::where('owner_id', $user->id)->get()->pluck('members')->flatten()->pluck('id'))
            ->withCount(['assignedTasks as tasks_completed' => function($query) use ($startDate) {
                $query->where('status', 'done')
                    ->where('updated_at', '>=', $startDate);
            }])
            ->with(['xpLogs' => function($query) use ($startDate) {
                $query->where('created_at', '>=', $startDate);
            }])
            ->get()
            ->map(function($user) {
                return [
                    'name' => $user->name,
                    'tasksCompleted' => $user->tasks_completed,
                    'xpEarned' => $user->xpLogs->sum('delta')
                ];
            });
            
        // Get task status distribution
        $taskStatusDistribution = Task::whereHas('project.members', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->orWhereHas('project', function($query) use ($user) {
                $query->where('owner_id', $user->id);
            })
            ->orWhere('assignee_id', $user->id)
            ->orWhere('reviewer_id', $user->id)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();
            
        // Ensure all statuses are present
        $statuses = ['todo', 'doing', 'review', 'done'];
        foreach ($statuses as $status) {
            if (!isset($taskStatusDistribution[$status])) {
                $taskStatusDistribution[$status] = 0;
            }
        }
            
        return Inertia::render('reports', [
            'projectCompletionData' => $projectCompletionData,
            'teamPerformanceData' => $teamPerformanceData,
            'taskStatusDistribution' => $taskStatusDistribution
        ]);
    }
}
