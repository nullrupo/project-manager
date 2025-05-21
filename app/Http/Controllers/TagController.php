<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TagController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();

        // Get both system tags and user-specific tags
        $tags = Tag::where(function ($query) use ($user) {
            $query->whereNull('user_id')  // System tags
                ->orWhere('user_id', $user->id);  // User-specific tags
        })->orderBy('name')->get();

        return response()->json($tags);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'color' => 'required|string|max:20',
        ]);

        $user = Auth::user();

        // Check if a tag with this name already exists for this user
        $existingTag = Tag::where('name', $validated['name'])
            ->where(function ($query) use ($user) {
                $query->whereNull('user_id')
                    ->orWhere('user_id', $user->id);
            })->first();

        if ($existingTag) {
            return response()->json([
                'message' => 'A tag with this name already exists',
                'tag' => $existingTag
            ], 422);
        }

        // Create the tag
        $tag = new Tag();
        $tag->name = $validated['name'];
        $tag->color = $validated['color'];
        $tag->user_id = $user->id;
        $tag->save();

        return response()->json($tag, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $tag = Tag::findOrFail($id);
        $user = Auth::user();

        // Check if user owns this tag
        if ($tag->user_id !== null && $tag->user_id !== $user->id) {
            abort(403, 'Unauthorized to update this tag');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'color' => 'required|string|max:20',
        ]);

        // Check if another tag with this name already exists
        $existingTag = Tag::where('name', $validated['name'])
            ->where('id', '!=', $id)
            ->where(function ($query) use ($user) {
                $query->whereNull('user_id')
                    ->orWhere('user_id', $user->id);
            })->first();

        if ($existingTag) {
            return response()->json([
                'message' => 'Another tag with this name already exists',
                'tag' => $existingTag
            ], 422);
        }

        // Update the tag
        $tag->name = $validated['name'];
        $tag->color = $validated['color'];
        $tag->save();

        return response()->json($tag);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $tag = Tag::findOrFail($id);
        $user = Auth::user();

        // Check if user owns this tag
        if ($tag->user_id !== null && $tag->user_id !== $user->id) {
            abort(403, 'Unauthorized to delete this tag');
        }

        // Check if tag is in use
        $tasksCount = $tag->tasks()->count();
        if ($tasksCount > 0) {
            return response()->json([
                'message' => 'Cannot delete tag that is in use by ' . $tasksCount . ' tasks'
            ], 422);
        }

        // Delete the tag
        $tag->delete();

        return response()->json(['message' => 'Tag deleted successfully']);
    }
}
