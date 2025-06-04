<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

class InboxPreferencesController extends Controller
{
    /**
     * Update the user's inbox preferences.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'auto_cleanup_enabled' => 'boolean',
        ]);

        $user = $request->user();
        $currentPreferences = $user->inbox_preferences ?? [];

        // Merge the new preferences with existing ones
        $newPreferences = array_merge($currentPreferences, array_filter($validated, function($value) {
            return $value !== null;
        }));

        $user->update([
            'inbox_preferences' => $newPreferences
        ]);

        return back()->with('success', 'Inbox preferences updated successfully.');
    }

    /**
     * Get the user's inbox preferences.
     */
    public function show(Request $request): JsonResponse
    {
        $preferences = $request->user()->inbox_preferences ?? [
            'auto_cleanup_enabled' => false,
        ];

        return response()->json($preferences);
    }
}
