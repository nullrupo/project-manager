<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TeamController extends Controller
{
    /**
     * Display the team members.
     */
    public function index(): Response
    {
        // For now, just get all users as team members
        // In a real app, you would filter by organization or team
        $team = User::all();
            
        return Inertia::render('team', [
            'team' => $team,
        ]);
    }
}
