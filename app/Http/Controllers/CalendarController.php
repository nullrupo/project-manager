<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class CalendarController extends Controller
{
    /**
     * Display the calendar view with tasks.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();

        // Get the current month and year from request or use current
        $month = $request->get('month', now()->month);
        $year = $request->get('year', now()->year);

        // Validate month and year parameters
        $month = is_numeric($month) && $month >= 1 && $month <= 12 ? (int)$month : now()->month;
        $year = is_numeric($year) && $year >= 1900 && $year <= 2100 ? (int)$year : now()->year;

        // Create start and end dates for the calendar view (include surrounding weeks)
        $startOfMonth = Carbon::create($year, $month, 1);
        $endOfMonth = $startOfMonth->copy()->endOfMonth();
        $startDate = $startOfMonth->copy()->startOfWeek();
        $endDate = $endOfMonth->copy()->endOfWeek();

        // Optimized query using joins instead of whereHas for better performance
        $tasks = Task::select([
                'tasks.*',
                'projects.name as project_name',
                'projects.key as project_key'
            ])
            ->leftJoin('projects', 'tasks.project_id', '=', 'projects.id')
            ->leftJoin('project_user', 'projects.id', '=', 'project_user.project_id')
            ->leftJoin('task_user', 'tasks.id', '=', 'task_user.task_id')
            ->where(function ($query) use ($user) {
                $query->where(function ($q) use ($user) {
                    // Project tasks where user is owner or member
                    $q->where('projects.owner_id', $user->id)
                      ->orWhere('project_user.user_id', $user->id);
                })
                ->orWhere(function ($q) use ($user) {
                    // Inbox tasks created by or assigned to user
                    $q->where('tasks.is_inbox', true)
                      ->where(function ($subQ) use ($user) {
                          $subQ->where('tasks.created_by', $user->id)
                               ->orWhere('task_user.user_id', $user->id);
                      });
                });
            })
            ->whereNotNull('tasks.due_date')
            ->whereBetween('tasks.due_date', [$startDate, $endDate])
            ->with(['assignees:id,name,email'])
            ->orderBy('tasks.due_date')
            ->distinct()
            ->get()
            ->map(function ($task) {
                // Add project info to task object
                if ($task->project_name) {
                    $task->project = (object) [
                        'name' => $task->project_name,
                        'key' => $task->project_key
                    ];
                }
                return $task;
            });

        // Only load projects if this is the initial page load (not AJAX navigation)
        $projects = [];
        if (!$request->header('X-Inertia')) {
            $projects = Project::select(['id', 'name', 'key'])
                ->where(function ($query) use ($user) {
                    $query->where('owner_id', $user->id)
                          ->orWhereHas('members', function ($q) use ($user) {
                              $q->where('users.id', $user->id);
                          });
                })
                ->orderBy('name')
                ->get();
        }

        // Group tasks by date
        $tasksByDate = $tasks->groupBy(function ($task) {
            return Carbon::parse($task->due_date)->format('Y-m-d');
        });

        // Generate calendar data
        $calendarData = $this->generateCalendarData($year, $month, $tasksByDate);

        return Inertia::render('calendar', [
            'tasks' => $tasks->values(), // Reset array keys
            'projects' => $projects,
            'calendarData' => $calendarData,
            'currentMonth' => $month,
            'currentYear' => $year,
            'monthName' => Carbon::create($year, $month, 1)->format('F'),
        ]);
    }

    /**
     * Generate calendar grid data
     */
    private function generateCalendarData($year, $month, $tasksByDate)
    {
        $startOfMonth = Carbon::create($year, $month, 1);
        $endOfMonth = $startOfMonth->copy()->endOfMonth();

        // Start from the beginning of the week containing the first day of the month
        $startOfCalendar = $startOfMonth->copy()->startOfWeek();

        // End at the end of the week containing the last day of the month
        $endOfCalendar = $endOfMonth->copy()->endOfWeek();

        $calendar = [];
        $current = $startOfCalendar->copy();

        while ($current <= $endOfCalendar) {
            $dateString = $current->format('Y-m-d');
            $calendar[] = [
                'date' => $dateString,
                'day' => $current->day,
                'isCurrentMonth' => $current->month === $month,
                'isToday' => $current->isToday(),
                'tasks' => $tasksByDate->get($dateString, collect()),
            ];
            $current->addDay();
        }

        return $calendar;
    }
}
