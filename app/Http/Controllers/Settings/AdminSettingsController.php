<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminSettingsController extends Controller
{
    /**
     * Show the admin settings page.
     */
    public function index(): Response
    {
        $settings = Setting::getAllSettings();
        
        return Inertia::render('settings/admin', [
            'settings' => $settings,
            'shortNameFormats' => $this->getShortNameFormats(),
        ]);
    }

    /**
     * Update admin settings.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'short_name_format' => 'required|string|in:first_last_initial,last_initial_first',
        ]);

        Setting::set(
            'short_name_format',
            $validated['short_name_format'],
            'string',
            'Format for displaying user short names',
            true // is_public
        );

        return back()->with('success', 'Admin settings updated successfully.');
    }

    /**
     * Get all admin settings as JSON.
     */
    public function show(): JsonResponse
    {
        $settings = Setting::getAllSettings();
        
        return response()->json([
            'settings' => $settings,
            'shortNameFormats' => $this->getShortNameFormats(),
        ]);
    }

    /**
     * Get available short name formats with examples.
     */
    private function getShortNameFormats(): array
    {
        return [
            'first_last_initial' => [
                'label' => 'First Name + Other Initials',
                'description' => 'Shows the first name followed by initials of other names',
                'examples' => [
                    'John Smith' => 'John S',
                    'Nguyen Trong Quoc' => 'Nguyen TQ',
                    'Mary Jane Watson' => 'Mary JW',
                    'Le Van Nam' => 'Le VN',
                ],
            ],
            'last_initial_first' => [
                'label' => 'Last Name + Other Initials',
                'description' => 'Shows the last name followed by initials of other names',
                'examples' => [
                    'John Smith' => 'Smith J',
                    'Nguyen Trong Quoc' => 'Quoc NT',
                    'Mary Jane Watson' => 'Watson MJ',
                    'Le Van Nam' => 'Nam LV',
                ],
            ],
        ];
    }
}
