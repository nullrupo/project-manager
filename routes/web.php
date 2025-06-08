<?php

use App\Http\Controllers\BoardController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\ChecklistItemController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FavoritesController;
use App\Http\Controllers\InboxController;
use App\Http\Controllers\LabelController;
use App\Http\Controllers\MyTasksController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectMemberController;
use App\Http\Controllers\SectionController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TaskListController;
use App\Http\Controllers\TeamController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Project routes
    Route::resource('projects', ProjectController::class);

    // Project member routes (search route must come before {user} route)
    Route::get('projects/{project}/members/search', [ProjectMemberController::class, 'searchUsers'])->name('projects.members.search');
    Route::post('projects/{project}/members', [ProjectMemberController::class, 'store'])->name('projects.members.store');
    Route::put('projects/{project}/members/{user}', [ProjectMemberController::class, 'update'])->name('projects.members.update');
    Route::delete('projects/{project}/members/{user}', [ProjectMemberController::class, 'destroy'])->name('projects.members.destroy');

    // Board routes (creation disabled - each project has one board)
    Route::get('projects/{project}/boards', [BoardController::class, 'index'])->name('boards.index');
    Route::get('projects/{project}/boards/{board}', [BoardController::class, 'show'])->name('boards.show');
    Route::get('projects/{project}/boards/{board}/edit', [BoardController::class, 'edit'])->name('boards.edit');
    Route::put('projects/{project}/boards/{board}', [BoardController::class, 'update'])->name('boards.update');

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
    Route::get('projects/{project}/tasks/{task}/edit', [TaskController::class, 'edit'])->name('tasks.edit');
    Route::put('projects/{project}/tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
    Route::patch('projects/{project}/tasks/{task}/due-date', [TaskController::class, 'updateDueDate'])->name('tasks.update-due-date');
    Route::put('projects/{project}/tasks/{task}/move', [TaskController::class, 'move'])->name('tasks.move');
    Route::post('projects/{project}/tasks/{task}/toggle-completion', [TaskController::class, 'toggleCompletion'])->name('tasks.toggle-completion');
    Route::delete('projects/{project}/tasks/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy');
    Route::post('projects/{project}/tasks/{task}/restore', [TaskController::class, 'restore'])->name('tasks.restore');
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

    // Section routes
    Route::post('projects/{project}/sections', [SectionController::class, 'store'])->name('sections.store');
    Route::put('projects/{project}/sections/{section}', [SectionController::class, 'update'])->name('sections.update');
    Route::delete('projects/{project}/sections/{section}', [SectionController::class, 'destroy'])->name('sections.destroy');
    Route::post('projects/{project}/sections/reorder', [SectionController::class, 'reorder'])->name('sections.reorder');

    // Checklist item routes
    Route::post('tasks/{task}/checklist-items', [ChecklistItemController::class, 'store'])->name('checklist-items.store');
    Route::put('tasks/{task}/checklist-items/{checklistItem}', [ChecklistItemController::class, 'update'])->name('checklist-items.update');
    Route::delete('tasks/{task}/checklist-items/{checklistItem}', [ChecklistItemController::class, 'destroy'])->name('checklist-items.destroy');
    Route::post('tasks/{task}/checklist-items/{checklistItem}/toggle', [ChecklistItemController::class, 'toggleCompletion'])->name('checklist-items.toggle');

    // My Tasks routes
    Route::get('my-tasks', [MyTasksController::class, 'index'])->name('my-tasks');

    // Inbox routes - for tasks not associated with any project
    Route::get('inbox', [InboxController::class, 'index'])->name('inbox');
    Route::post('inbox/tasks', [InboxController::class, 'store'])->name('inbox.tasks.store');
    Route::put('inbox/tasks/{task}', [InboxController::class, 'update'])->name('inbox.tasks.update');
    Route::delete('inbox/tasks/{task}', [InboxController::class, 'destroy'])->name('inbox.tasks.destroy');
    Route::post('inbox/tasks/{task}/toggle-completion', [InboxController::class, 'toggleCompletion'])->name('inbox.tasks.toggle-completion');
    Route::post('inbox/tasks/{task}/move-to-project', [InboxController::class, 'moveToProject'])->name('inbox.tasks.move-to-project');
    Route::post('inbox/tasks/{task}/restore', [InboxController::class, 'restore'])->name('inbox.tasks.restore');
    Route::post('inbox/cleanup', [InboxController::class, 'cleanup'])->name('inbox.cleanup');

    // Team routes
    Route::get('team', [TeamController::class, 'index'])->name('team');

    // Calendar routes
    Route::get('calendar', [CalendarController::class, 'index'])->name('calendar');

    Route::get('reports', function () {
        return Inertia::render('reports');
    })->name('reports');

    Route::get('time-tracking', function () {
        return Inertia::render('time-tracking');
    })->name('time-tracking');

    Route::get('documents', function () {
        return Inertia::render('documents');
    })->name('documents');

    Route::get('messages', function () {
        return Inertia::render('messages');
    })->name('messages');

    // Favorites routes
    Route::get('favorites', [FavoritesController::class, 'index'])->name('favorites');
    Route::post('favorites/toggle', [FavoritesController::class, 'toggle'])->name('favorites.toggle');

    // Temporary debug route
    Route::get('debug-sidebar', function () {
        $user = auth()->user();
        return response()->json([
            'user_id' => $user->id,
            'sidebar_preferences' => $user->sidebar_preferences,
            'raw_sidebar_preferences' => $user->getAttributes()['sidebar_preferences'] ?? null,
        ]);
    });


});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
