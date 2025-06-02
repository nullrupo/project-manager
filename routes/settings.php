<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SidebarPreferencesController;
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
});
