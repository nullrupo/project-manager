<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class InboxController extends Controller
{
    /**
     * Display the inbox.
     */
    public function index()
    {
        $user = Auth::user();
        
        // Get notifications for the user
        // For now, we'll use tasks assigned to the user as notifications
        $notifications = $user->assignedTasks()
            ->with(['project', 'tags'])
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(function ($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->status === 'todo' ? 'New task assigned: ' . $task->title : 'Task updated: ' . $task->title,
                    'description' => $task->description,
                    'from' => [
                        'name' => $task->project->owner->name,
                        'avatar' => null,
                        'initials' => $this->getInitials($task->project->owner->name)
                    ],
                    'date' => $task->created_at->format('Y-m-d'),
                    'project' => $task->project->name,
                    'tags' => $task->tags->pluck('name')->toArray()
                ];
            });
            
        return Inertia::render('inbox', [
            'inboxItems' => $notifications
        ]);
    }
    
    /**
     * Mark notifications as read.
     */
    public function markAsRead(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer'
        ]);
        
        // In a real app, you would mark notifications as read here
        // For now, we'll just return a success response
        
        return response()->json(['success' => true]);
    }
    
    /**
     * Get initials from a name.
     */
    private function getInitials($name)
    {
        $words = explode(' ', $name);
        $initials = '';
        
        foreach ($words as $word) {
            $initials .= strtoupper(substr($word, 0, 1));
        }
        
        return strlen($initials) > 2 ? substr($initials, 0, 2) : $initials;
    }
}
