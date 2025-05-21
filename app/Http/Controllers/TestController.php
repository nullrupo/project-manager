<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TestController extends Controller
{
    public function createProject(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'auto_calc_complete' => 'nullable|boolean',
        ]);
        
        $project = new Project();
        $project->name = $validated['name'];
        $project->description = $validated['description'] ?? null;
        $project->owner_id = Auth::id() ?? 1; // Use authenticated user or default to ID 1
        $project->auto_calc_complete = isset($validated['auto_calc_complete']) ? true : false;
        $project->percent_complete = 0;
        $project->status = 'active';
        $project->save();
        
        // Add the owner as a member
        $project->members()->attach($project->owner_id, ['role' => 'owner']);
        
        return redirect('/test-form')->with('success', 'Project created successfully! ID: ' . $project->id);
    }
    
    public function createTask(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:todo,doing,review,done',
        ]);
        
        $task = new Task();
        $task->project_id = $validated['project_id'];
        $task->title = $validated['title'];
        $task->description = $validated['description'] ?? null;
        $task->assignee_id = Auth::id() ?? 1; // Use authenticated user or default to ID 1
        $task->status = $validated['status'];
        $task->save();
        
        return redirect('/test-form')->with('success', 'Task created successfully! ID: ' . $task->id);
    }
}
