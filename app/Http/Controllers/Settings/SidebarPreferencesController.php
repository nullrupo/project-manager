<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

class SidebarPreferencesController extends Controller
{
    /**
     * Update the user's sidebar preferences.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'collapsed_groups' => 'sometimes|array',
            'collapsed_groups.*' => 'string',
            'custom_groups' => 'sometimes|array',
            'custom_groups.*.id' => 'required|string',
            'custom_groups.*.title' => 'required|string|max:255',
            'custom_groups.*.items' => 'array',
            'custom_groups.*.items.*.id' => 'sometimes|string',
            'custom_groups.*.items.*.title' => 'required|string|max:255',
            'custom_groups.*.items.*.href' => 'required|string',
            'custom_groups.*.items.*.user_created' => 'sometimes|boolean',
            'custom_groups.*.customizable' => 'boolean',
            'custom_groups.*.user_created' => 'boolean',
            'custom_groups.*.position' => 'integer',
            'group_order' => 'sometimes|array',
            'group_order.*' => 'string',
            'hidden_items' => 'sometimes|array',
            'hidden_items.*' => 'string',
        ]);

        $user = $request->user();
        $currentPreferences = $user->sidebar_preferences ?? [];

        // Merge the new preferences with existing ones
        $newPreferences = array_merge($currentPreferences, array_filter($validated));

        $user->update([
            'sidebar_preferences' => $newPreferences
        ]);

        return back();
    }

    /**
     * Get the user's sidebar preferences.
     */
    public function show(Request $request): JsonResponse
    {
        $preferences = $request->user()->sidebar_preferences ?? [
            'collapsed_groups' => [],
            'custom_groups' => [],
            'group_order' => [],
            'hidden_items' => []
        ];

        return response()->json($preferences);
    }

    /**
     * Reset sidebar preferences to default.
     */
    public function reset(Request $request): RedirectResponse
    {
        $defaultPreferences = [
            'collapsed_groups' => [],
            'custom_groups' => [],
            'group_order' => [],
            'hidden_items' => []
        ];

        $request->user()->update([
            'sidebar_preferences' => $defaultPreferences
        ]);

        return back();
    }
}
