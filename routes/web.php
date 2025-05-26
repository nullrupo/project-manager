<?php

use App\Http\Controllers\BoardController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\InboxController;
use App\Http\Controllers\LabelController;
use App\Http\Controllers\MyTasksController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TaskListController;
use App\Http\Controllers\TeamController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Debug route
    Route::get('debug-projects', function () {
        $user = Auth::user();
        $projects = $user->projects()->with('owner')->get();
        $ownedProjects = $user->ownedProjects()->with('owner')->get();
        $allProjects = $projects->merge($ownedProjects)->unique('id');

        return response()->json([
            'user' => $user,
            'projects_count' => $projects->count(),
            'owned_projects_count' => $ownedProjects->count(),
            'all_projects_count' => $allProjects->count(),
            'projects' => $allProjects->values()
        ]);
    });

    // Project routes
    Route::resource('projects', ProjectController::class);

    // Board routes
    Route::get('projects/{project}/boards', [BoardController::class, 'index'])->name('boards.index');
    Route::get('projects/{project}/boards/create', [BoardController::class, 'create'])->name('boards.create');
    Route::post('projects/{project}/boards', [BoardController::class, 'store'])->name('boards.store');
    Route::get('projects/{project}/boards/{board}', [BoardController::class, 'show'])->name('boards.show');
    Route::get('projects/{project}/boards/{board}/edit', [BoardController::class, 'edit'])->name('boards.edit');
    Route::put('projects/{project}/boards/{board}', [BoardController::class, 'update'])->name('boards.update');
    Route::delete('projects/{project}/boards/{board}', [BoardController::class, 'destroy'])->name('boards.destroy');

    // List routes
    Route::post('projects/{project}/boards/{board}/lists', [TaskListController::class, 'store'])->name('lists.store');
    Route::put('projects/{project}/boards/{board}/lists/{list}', [TaskListController::class, 'update'])->name('lists.update');
    Route::delete('projects/{project}/boards/{board}/lists/{list}', [TaskListController::class, 'destroy'])->name('lists.destroy');
    Route::post('projects/{project}/boards/{board}/lists/positions', [TaskListController::class, 'updatePositions'])->name('lists.positions');

    // Task routes
    Route::get('projects/{project}/tasks', [TaskController::class, 'index'])->name('tasks.index');
    Route::get('projects/{project}/boards/{board}/lists/{list}/tasks/create', [TaskController::class, 'create'])->name('tasks.create');
    Route::post('projects/{project}/boards/{board}/lists/{list}/tasks', [TaskController::class, 'store'])->name('tasks.store');
    Route::get('projects/{project}/tasks/{task}', [TaskController::class, 'show'])->name('tasks.show');
    Route::put('projects/{project}/tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
    Route::delete('projects/{project}/tasks/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy');
    Route::post('projects/{project}/tasks/positions', [TaskController::class, 'updatePositions'])->name('tasks.positions');

    // Comment routes
    Route::post('projects/{project}/tasks/{task}/comments', [CommentController::class, 'store'])->name('comments.store');
    Route::put('projects/{project}/tasks/{task}/comments/{comment}', [CommentController::class, 'update'])->name('comments.update');
    Route::delete('projects/{project}/tasks/{task}/comments/{comment}', [CommentController::class, 'destroy'])->name('comments.destroy');

    // Label routes
    Route::get('projects/{project}/labels', [LabelController::class, 'index'])->name('labels.index');
    Route::get('projects/{project}/labels/create', [LabelController::class, 'create'])->name('labels.create');
    Route::post('projects/{project}/labels', [LabelController::class, 'store'])->name('labels.store');
    Route::get('projects/{project}/labels/{label}/edit', [LabelController::class, 'edit'])->name('labels.edit');
    Route::put('projects/{project}/labels/{label}', [LabelController::class, 'update'])->name('labels.update');
    Route::delete('projects/{project}/labels/{label}', [LabelController::class, 'destroy'])->name('labels.destroy');

    // My Tasks routes
    Route::get('my-tasks', [MyTasksController::class, 'index'])->name('my-tasks');

    // Inbox routes - for tasks not associated with any project
    Route::get('inbox', [InboxController::class, 'index'])->name('inbox');
    Route::post('inbox/tasks', [InboxController::class, 'store'])->name('inbox.tasks.store');
    Route::put('inbox/tasks/{task}', [InboxController::class, 'update'])->name('inbox.tasks.update');
    Route::delete('inbox/tasks/{task}', [InboxController::class, 'destroy'])->name('inbox.tasks.destroy');

    // Team routes
    Route::get('team', [TeamController::class, 'index'])->name('team');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
