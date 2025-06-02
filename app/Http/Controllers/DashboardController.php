<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Project;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Display the dashboard with recent activity.
     */
    public function index(): Response
    {
        $user = Auth::user();

        // Get recent activities (last 10 activities from the past 30 days)
        $recentActivities = $this->getRecentActivities($user);

        return Inertia::render('dashboard', [
            'recentActivities' => $recentActivities,
        ]);
    }

    /**
     * Get recent activities for the user.
     */
    private function getRecentActivities($user)
    {
        $activities = collect();
        $thirtyDaysAgo = Carbon::now()->subDays(30);

        // Get user's project IDs (owned or member)
        $userProjectIds = collect();
        $userProjectIds = $userProjectIds->merge($user->ownedProjects()->pluck('id'));
        $userProjectIds = $userProjectIds->merge($user->projects()->pluck('projects.id'));
        $userProjectIds = $userProjectIds->unique();

        // Recent projects created in user's network
        $recentProjects = Project::whereIn('id', $userProjectIds)
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->with('owner')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($project) {
                return [
                    'type' => 'project_created',
                    'action' => 'created project',
                    'target' => $project->name,
                    'user' => $project->owner->name,
                    'date' => $project->created_at,
                    'icon' => 'folder-plus',
                    'link' => route('projects.show', $project->id),
                ];
            });

        // Recent tasks created in user's projects or inbox
        $recentTasks = Task::where(function ($query) use ($user, $userProjectIds) {
                // Tasks in user's projects
                $query->whereIn('project_id', $userProjectIds)
                      // Or inbox tasks created by or assigned to user
                      ->orWhere(function ($q) use ($user) {
                          $q->where('is_inbox', true)
                            ->where(function ($subQ) use ($user) {
                                $subQ->where('created_by', $user->id)
                                     ->orWhereHas('assignees', function ($assigneeQ) use ($user) {
                                         $assigneeQ->where('users.id', $user->id);
                                     });
                            });
                      });
            })
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->with(['project', 'creator'])
            ->orderBy('created_at', 'desc')
            ->limit(8)
            ->get()
            ->map(function ($task) {
                return [
                    'type' => 'task_created',
                    'action' => 'created task',
                    'target' => $task->title,
                    'project' => $task->project ? $task->project->name : 'Inbox',
                    'user' => $task->creator->name,
                    'date' => $task->created_at,
                    'icon' => 'plus-circle',
                    'link' => $task->project ? route('projects.show', $task->project->id) : route('inbox'),
                ];
            });

        // Recent tasks completed in user's projects
        $completedTasks = Task::where(function ($query) use ($user, $userProjectIds) {
                // Tasks in user's projects
                $query->whereIn('project_id', $userProjectIds)
                      // Or inbox tasks assigned to user
                      ->orWhere(function ($q) use ($user) {
                          $q->where('is_inbox', true)
                            ->whereHas('assignees', function ($assigneeQ) use ($user) {
                                $assigneeQ->where('users.id', $user->id);
                            });
                      });
            })
            ->where('status', 'done')
            ->where('completed_at', '>=', $thirtyDaysAgo)
            ->with(['project', 'assignees'])
            ->orderBy('completed_at', 'desc')
            ->limit(8)
            ->get()
            ->map(function ($task) {
                // Find who completed it (first assignee for simplicity)
                $completedBy = $task->assignees->first();
                return [
                    'type' => 'task_completed',
                    'action' => 'completed task',
                    'target' => $task->title,
                    'project' => $task->project ? $task->project->name : 'Inbox',
                    'user' => $completedBy ? $completedBy->name : 'Someone',
                    'date' => $task->completed_at,
                    'icon' => 'check-circle',
                    'link' => $task->project ? route('projects.show', $task->project->id) : route('inbox'),
                ];
            });

        // Recent comments in user's projects
        $recentComments = Comment::whereHas('task', function ($query) use ($user, $userProjectIds) {
                $query->where(function ($q) use ($user, $userProjectIds) {
                    // Tasks in user's projects
                    $q->whereIn('project_id', $userProjectIds)
                      // Or inbox tasks related to user
                      ->orWhere(function ($subQ) use ($user) {
                          $subQ->where('is_inbox', true)
                               ->where(function ($inboxQ) use ($user) {
                                   $inboxQ->where('created_by', $user->id)
                                          ->orWhereHas('assignees', function ($assigneeQ) use ($user) {
                                              $assigneeQ->where('users.id', $user->id);
                                          });
                               });
                      });
                });
            })
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->with(['task', 'task.project', 'user'])
            ->orderBy('created_at', 'desc')
            ->limit(8)
            ->get()
            ->map(function ($comment) {
                return [
                    'type' => 'comment_added',
                    'action' => 'commented on',
                    'target' => $comment->task->title,
                    'project' => $comment->task->project ? $comment->task->project->name : 'Inbox',
                    'user' => $comment->user->name,
                    'date' => $comment->created_at,
                    'icon' => 'message-circle',
                    'link' => $comment->task->project ? route('projects.show', $comment->task->project->id) : route('inbox'),
                ];
            });

        // Merge all activities and sort by date
        $activities = $activities
            ->merge($recentProjects)
            ->merge($recentTasks)
            ->merge($completedTasks)
            ->merge($recentComments)
            ->sortByDesc('date')
            ->take(15)
            ->values();

        return $activities;
    }
}
