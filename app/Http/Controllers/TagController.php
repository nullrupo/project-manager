<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use App\Models\Task;
use App\Services\TagPermissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class TagController extends Controller
{
    /**
     * Display a listing of the user's tags.
     */
    public function index(): JsonResponse
    {
        $user = Auth::user();
        $tags = $user->tags()->orderBy('name')->get();

        return response()->json([
            'tags' => $tags
        ]);
    }

    /**
     * Store a newly created tag.
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('tags')->where(function ($query) use ($user) {
                    return $query->where('user_id', $user->id);
                })
            ],
            'color' => 'required|string|max:50',
            'description' => 'nullable|string',
        ]);

        $tag = Tag::create([
            'name' => $validated['name'],
            'color' => $validated['color'],
            'description' => $validated['description'] ?? null,
            'user_id' => $user->id,
            'is_default' => false,
        ]);

        return response()->json([
            'success' => true,
            'tag' => $tag
        ], 201);
    }

    /**
     * Update the specified tag.
     */
    public function update(Request $request, Tag $tag): JsonResponse
    {
        $user = Auth::user();

        // Check permission
        if (!TagPermissionService::canManageTag($tag, $user)) {
            abort(403, 'You do not have permission to update this tag.');
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('tags')->where(function ($query) use ($user) {
                    return $query->where('user_id', $user->id);
                })->ignore($tag->id)
            ],
            'color' => 'required|string|max:50',
            'description' => 'nullable|string',
        ]);

        $tag->update($validated);

        return response()->json([
            'success' => true,
            'tag' => $tag->fresh()
        ]);
    }

    /**
     * Remove the specified tag.
     */
    public function destroy(Tag $tag): JsonResponse
    {
        $user = Auth::user();

        // Check permission
        if (!TagPermissionService::canManageTag($tag, $user)) {
            abort(403, 'You do not have permission to delete this tag.');
        }

        // Detach from all tasks before deleting
        $tag->tasks()->detach();
        $tag->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tag deleted successfully.'
        ]);
    }

    /**
     * Assign tag to task.
     */
    public function assignToTask(Request $request, Tag $tag, Task $task): JsonResponse
    {
        $user = Auth::user();

        // Check permission
        if (!TagPermissionService::canAssignTagToTask($tag, $task, $user)) {
            abort(403, 'You do not have permission to assign this tag to this task.');
        }

        // Check if tag is already assigned
        if ($task->tags()->where('tag_id', $tag->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Tag is already assigned to this task.'
            ], 400);
        }

        $task->tags()->attach($tag->id);

        return response()->json([
            'success' => true,
            'message' => 'Tag assigned to task successfully.',
            'task' => $task->fresh(['tags', 'labels', 'assignees'])
        ]);
    }

    /**
     * Remove tag from task.
     */
    public function removeFromTask(Tag $tag, Task $task): JsonResponse
    {
        $user = Auth::user();

        // Check permission
        if (!TagPermissionService::canAssignTagToTask($tag, $task, $user)) {
            abort(403, 'You do not have permission to remove this tag from this task.');
        }

        $task->tags()->detach($tag->id);

        return response()->json([
            'success' => true,
            'message' => 'Tag removed from task successfully.',
            'task' => $task->fresh(['tags', 'labels', 'assignees'])
        ]);
    }

    /**
     * Get tags that can be assigned to a specific task.
     */
    public function getAvailableForTask(Task $task): JsonResponse
    {
        $user = Auth::user();

        // Check if user can manage tags on this task
        if (!TagPermissionService::canManageTagsOnTask($task, $user)) {
            return response()->json([
                'tags' => []
            ]);
        }

        // Get user's tags
        $tags = $user->tags()->orderBy('name')->get();

        return response()->json([
            'tags' => $tags
        ]);
    }
}
