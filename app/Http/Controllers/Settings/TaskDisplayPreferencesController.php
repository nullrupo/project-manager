<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskDisplayPreferencesController extends Controller
{
    /**
     * Update the user's task display preferences.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'show_urgency' => 'sometimes|boolean',
            'show_notes' => 'sometimes|boolean',
            'show_deadline' => 'sometimes|boolean',
            'show_checklist_progress' => 'sometimes|boolean',
            'show_assignee' => 'sometimes|boolean',
            'show_status' => 'sometimes|boolean',
        ]);

        $user = $request->user();
        $currentPreferences = $user->task_display_preferences ?? [];

        // Merge the new preferences with existing ones
        $newPreferences = array_merge($currentPreferences, array_filter($validated, function($value) {
            return $value !== null;
        }));

        $user->update([
            'task_display_preferences' => $newPreferences
        ]);

        return back();
    }

    /**
     * Get the user's task display preferences.
     */
    public function show(Request $request): JsonResponse
    {
        $preferences = $request->user()->task_display_preferences ?? [
            'show_urgency' => true,
            'show_notes' => true,
            'show_deadline' => true,
            'show_checklist_progress' => true,
            'show_assignee' => true,
            'show_status' => true,
        ];

        return response()->json($preferences);
    }
}
