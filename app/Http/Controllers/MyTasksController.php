<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class MyTasksController extends Controller
{
    /**
     * Display the user's tasks.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $filter = $request->get('filter', 'all');

        // Get tasks assigned to the user
        $tasks = $user->assignedTasks()
            ->with(['project', 'list.board', 'labels', 'assignees'])
            ->orderBy('due_date')
            ->get();

        return Inertia::render('my-tasks', [
            'tasks' => $tasks,
            'filter' => $filter,
        ]);
    }
}
