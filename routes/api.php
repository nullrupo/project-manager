<?php

use App\Http\Controllers\TaskController;
use App\Http\Controllers\InboxController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Task routes
    Route::apiResource('tasks', TaskController::class);
    Route::post('/tasks/{id}/review', [TaskController::class, 'review']);
    Route::get('/projects/{id}/tasks', [TaskController::class, 'projectTasks']);

    // Inbox routes
    Route::post('/inbox/mark-as-read', [InboxController::class, 'markAsRead']);
});
