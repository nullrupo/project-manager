<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CalendarController extends Controller
{
    /**
     * Display the calendar.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $month = $request->input('month', date('m'));
        $year = $request->input('year', date('Y'));
        
        // Get tasks with due dates in the specified month
        $tasks = Task::with(['project', 'tags'])
            ->where(function($query) use ($user) {
                $query->where('assignee_id', $user->id)
                    ->orWhere('reviewer_id', $user->id)
                    ->orWhereHas('project', function($query) use ($user) {
                        $query->where('owner_id', $user->id);
                    });
            })
            ->whereNotNull('due_date')
            ->whereRaw('MONTH(due_date) = ? AND YEAR(due_date) = ?', [$month, $year])
            ->get()
            ->map(function ($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'date' => $task->due_date,
                    'project' => $task->project->name,
                    'status' => $task->status
                ];
            });
            
        return Inertia::render('calendar', [
            'events' => $tasks,
            'currentMonth' => (int)$month - 1, // JavaScript months are 0-indexed
            'currentYear' => (int)$year
        ]);
    }
}
