<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\InboxController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\TeamController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Test form routes
Route::get('/test-form', function () {
    return view('test-form');
});

// Test controller routes (no auth required for testing)
Route::post('/test/create-project', [App\Http\Controllers\TestController::class, 'createProject']);
Route::post('/test/create-task', [App\Http\Controllers\TestController::class, 'createTask']);

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Project management routes
    Route::resource('projects', ProjectController::class);

    // Task management routes
    Route::resource('tasks', TaskController::class);

    // Tag management routes
    Route::resource('tags', TagController::class);

    // API routes for tags (used by the frontend)
    Route::get('/tags', [TagController::class, 'index']);

    // My tasks page
    Route::get('my-tasks', [TaskController::class, 'index'])->name('my-tasks');

    // Other pages
    Route::get('inbox', [InboxController::class, 'index'])->name('inbox');

    Route::get('calendar', [CalendarController::class, 'index'])->name('calendar');

    Route::get('reports', [ReportsController::class, 'index'])->name('reports');

    Route::get('team', [TeamController::class, 'index'])->name('team');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
