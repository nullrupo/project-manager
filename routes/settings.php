<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SidebarPreferencesController;
use App\Http\Controllers\Settings\InboxPreferencesController;
use App\Http\Controllers\Settings\TaskDisplayPreferencesController;
use App\Http\Controllers\Settings\AdminSettingsController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::redirect('settings', 'settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('password.edit');
    Route::put('settings/password', [PasswordController::class, 'update'])->name('password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance');

    Route::get('settings/sidebar', function () {
        return Inertia::render('settings/sidebar');
    })->name('sidebar.settings');

    // Sidebar preferences routes
    Route::get('settings/sidebar-preferences', [SidebarPreferencesController::class, 'show'])->name('sidebar-preferences.show');
    Route::patch('settings/sidebar-preferences', [SidebarPreferencesController::class, 'update'])->name('sidebar-preferences.update');
    Route::post('settings/sidebar-preferences/reset', [SidebarPreferencesController::class, 'reset'])->name('sidebar-preferences.reset');

    // Inbox preferences routes
    Route::get('settings/inbox', function () {
        return Inertia::render('settings/inbox');
    })->name('inbox.settings');
    Route::get('settings/inbox-preferences', [InboxPreferencesController::class, 'show'])->name('inbox-preferences.show');
    Route::patch('settings/inbox-preferences', [InboxPreferencesController::class, 'update'])->name('inbox-preferences.update');

    // Task display preferences routes
    Route::get('settings/task-display', function () {
        return Inertia::render('settings/task-display');
    })->name('task-display.settings');

    // Alternative route name for task-display
    Route::get('task-display', function () {
        return redirect()->route('task-display.settings');
    })->name('task-display');
    Route::get('settings/task-display-preferences', [TaskDisplayPreferencesController::class, 'show'])->name('task-display-preferences.show');
    Route::patch('settings/task-display-preferences', [TaskDisplayPreferencesController::class, 'update'])->name('task-display-preferences.update');

    // Admin settings routes (admin only)
    Route::middleware('admin')->group(function () {
        Route::get('settings/admin', [AdminSettingsController::class, 'index'])->name('admin.settings');
        Route::get('settings/admin-settings', [AdminSettingsController::class, 'show'])->name('admin-settings.show');
        Route::patch('settings/admin-settings', [AdminSettingsController::class, 'update'])->name('admin-settings.update');
    });
});
