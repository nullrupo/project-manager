<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TeamController extends Controller
{
    /**
     * Display the team page.
     */
    public function index()
    {
        $user = Auth::user();
        
        // Get team members from projects the user is part of
        $teamMembers = User::whereHas('projects', function($query) use ($user) {
                $query->whereIn('project_id', $user->projects->pluck('id'));
            })
            ->orWhereIn('id', function($query) use ($user) {
                $query->select('owner_id')
                    ->from('projects')
                    ->whereHas('members', function($query) use ($user) {
                        $query->where('user_id', $user->id);
                    });
            })
            ->withCount(['assignedTasks as tasks_completed' => function($query) {
                $query->where('status', 'done');
            }])
            ->withCount(['assignedTasks as tasks_in_progress' => function($query) {
                $query->whereIn('status', ['todo', 'doing', 'review']);
            }])
            ->with(['projects' => function($query) {
                $query->select('id', 'name');
            }])
            ->get()
            ->map(function($member) {
                return [
                    'id' => $member->id,
                    'name' => $member->name,
                    'email' => $member->email,
                    'role' => $member->role ?? 'Team Member',
                    'avatar' => null,
                    'initials' => $this->getInitials($member->name),
                    'xp' => $member->xp,
                    'level' => $member->level,
                    'projects' => $member->projects->pluck('name')->toArray(),
                    'tasksCompleted' => $member->tasks_completed,
                    'tasksInProgress' => $member->tasks_in_progress
                ];
            });
            
        return Inertia::render('team', [
            'teamMembers' => $teamMembers
        ]);
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
