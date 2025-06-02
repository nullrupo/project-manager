<?php

namespace App\Http\Controllers;

use App\Models\Favorite;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class FavoritesController extends Controller
{
    /**
     * Display the user's favorites.
     */
    public function index()
    {
        $user = Auth::user();

        // Get all favorites for the current user with their related models
        $favorites = Favorite::where('user_id', $user->id)
            ->with('favoritable')
            ->orderBy('created_at', 'desc')
            ->get();

        // Group favorites by type
        $groupedFavorites = [
            'projects' => [],
            'tasks' => [],
            'documents' => [],
        ];

        foreach ($favorites as $favorite) {
            $item = $favorite->favoritable;
            if (!$item) continue; // Skip if the favorited item was deleted

            $favoriteData = [
                'id' => $item->id,
                'title' => $item->name ?? $item->title ?? 'Untitled',
                'description' => $item->description ?? null,
                'created_at' => $favorite->created_at,
                'type' => class_basename($item),
                'url' => $this->getItemUrl($item),
            ];

            // Add type-specific data
            if ($item instanceof Project) {
                $favoriteData['key'] = $item->key;
                $favoriteData['owner'] = $item->owner->name ?? 'Unknown';
                $favoriteData['background_color'] = $item->background_color;
                $groupedFavorites['projects'][] = $favoriteData;
            } elseif ($item instanceof Task) {
                $favoriteData['priority'] = $item->priority;
                $favoriteData['status'] = $item->status;
                $favoriteData['due_date'] = $item->due_date;
                $favoriteData['project'] = $item->project->name ?? 'Inbox';
                $groupedFavorites['tasks'][] = $favoriteData;
            }
            // Add more types as needed (documents, etc.)
        }

        return Inertia::render('favorites', [
            'favorites' => $groupedFavorites,
            'totalCount' => $favorites->count(),
        ]);
    }

    /**
     * Toggle favorite status for an item.
     */
    public function toggle(Request $request)
    {
        $request->validate([
            'type' => 'required|string',
            'id' => 'required|integer',
        ]);

        $user = Auth::user();
        $type = $request->type;
        $id = $request->id;

        // Map type to model class
        $modelClass = match ($type) {
            'project' => Project::class,
            'task' => Task::class,
            default => null,
        };

        if (!$modelClass) {
            return back()->with('error', 'Invalid type');
        }

        $item = $modelClass::find($id);
        if (!$item) {
            return back()->with('error', 'Item not found');
        }

        $isFavorited = $item->toggleFavorite($user);

        return back()->with('success', $isFavorited ? 'Added to favorites' : 'Removed from favorites');
    }

    /**
     * Get the URL for a favorited item.
     */
    private function getItemUrl($item): string
    {
        if ($item instanceof Project) {
            return route('projects.show', $item->id);
        } elseif ($item instanceof Task) {
            if ($item->project_id) {
                return route('projects.show', $item->project_id) . '#task-' . $item->id;
            } else {
                return route('inbox') . '#task-' . $item->id;
            }
        }

        return '#';
    }
}
