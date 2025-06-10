<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CommentController extends Controller
{
    // No constructor needed - middleware is applied in routes file

    /**
     * Store a newly created comment in storage.
     */
    public function store(Request $request, Project $project, Task $task): RedirectResponse
    {
        // Check if the task belongs to the project
        if ($task->project_id !== $project->id) {
            abort(404, 'Task not found in this project.');
        }

        // Check if user has access to the project
        if (!$project->is_public && !$project->members->contains(Auth::id()) && $project->owner_id !== Auth::id()) {
            abort(403, 'You do not have permission to comment on this task.');
        }

        $validated = $request->validate([
            'content' => 'required|string',
            'parent_id' => 'nullable|exists:comments,id',
        ]);

        // If parent_id is provided, make sure it belongs to the same task
        if (!empty($validated['parent_id'])) {
            $parentComment = Comment::find($validated['parent_id']);
            if (!$parentComment || $parentComment->task_id !== $task->id) {
                abort(404, 'Parent comment not found for this task.');
            }
        }

        // Create the comment
        $comment = new Comment([
            'content' => $validated['content'],
            'parent_id' => $validated['parent_id'] ?? null,
        ]);

        $comment->task_id = $task->id;
        $comment->user_id = Auth::id();
        $comment->save();

        return redirect()->back()
            ->with('success', 'Comment added successfully.');
    }

    /**
     * Update the specified comment in storage.
     */
    public function update(Request $request, Project $project, Task $task, Comment $comment): RedirectResponse
    {
        // Check if the task belongs to the project and the comment belongs to the task
        if ($task->project_id !== $project->id || $comment->task_id !== $task->id) {
            abort(404, 'Comment not found for this task.');
        }

        // Check if user is the author of the comment
        if ($comment->user_id !== Auth::id()) {
            abort(403, 'You do not have permission to edit this comment.');
        }

        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        $comment->update([
            'content' => $validated['content'],
            'is_edited' => true,
        ]);

        return redirect()->back()
            ->with('success', 'Comment updated successfully.');
    }

    /**
     * Remove the specified comment from storage.
     */
    public function destroy(Project $project, Task $task, Comment $comment): RedirectResponse
    {
        // Check if the task belongs to the project and the comment belongs to the task
        if ($task->project_id !== $project->id || $comment->task_id !== $task->id) {
            abort(404, 'Comment not found for this task.');
        }

        // Check if user is the author of the comment or has admin rights
        if ($comment->user_id !== Auth::id() && $project->owner_id !== Auth::id() &&
            !$project->members()->where('user_id', Auth::id())->where('role', '!=', 'member')->exists()) {
            abort(403, 'You do not have permission to delete this comment.');
        }

        $comment->delete();

        return redirect()->back()
            ->with('success', 'Comment deleted successfully.');
    }
}
