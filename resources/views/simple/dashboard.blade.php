@extends('layouts.simple')

@section('title', 'Dashboard')

@section('content')
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Dashboard</h1>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Recent Projects -->
        <div class="bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-semibold">Recent Projects</h2>
                <a href="{{ route('simple.projects.create') }}" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm">
                    New Project
                </a>
            </div>
            
            @if(count($recentProjects) > 0)
                <div class="space-y-4">
                    @foreach($recentProjects as $project)
                        <div class="border rounded p-4">
                            <div class="flex justify-between">
                                <a href="{{ route('simple.projects.show', $project->id) }}" class="font-medium text-blue-600 hover:underline">
                                    {{ $project->name }}
                                </a>
                                <span class="text-sm text-gray-500">
                                    @if($project->due_date)
                                        Due: {{ \Carbon\Carbon::parse($project->due_date)->format('M d, Y') }}
                                    @else
                                        No due date
                                    @endif
                                </span>
                            </div>
                            <div class="mt-2">
                                <div class="text-sm text-gray-600">
                                    {{ $project->tasks_count }} tasks, {{ $project->completed_tasks_count }} completed
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                    <div class="bg-blue-600 h-2.5 rounded-full" style="width: {{ $project->percent_complete }}%"></div>
                                </div>
                            </div>
                        </div>
                    @endforeach
                </div>
            @else
                <p class="text-gray-500">No projects yet. Create your first project!</p>
            @endif
        </div>

        <!-- Upcoming Tasks -->
        <div class="bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-semibold">Upcoming Tasks</h2>
                <a href="{{ route('simple.tasks.create') }}" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm">
                    New Task
                </a>
            </div>
            
            @if(count($upcomingTasks) > 0)
                <div class="space-y-3">
                    @foreach($upcomingTasks as $task)
                        <div class="border rounded p-3">
                            <div class="flex justify-between">
                                <a href="{{ route('simple.tasks.edit', $task->id) }}" class="font-medium hover:underline">
                                    {{ $task->title }}
                                </a>
                                <span class="text-sm 
                                    @if($task->due_date && $task->due_date->isPast()) text-red-500
                                    @else text-gray-500 @endif">
                                    @if($task->due_date)
                                        {{ $task->due_date->format('M d') }}
                                    @else
                                        No due date
                                    @endif
                                </span>
                            </div>
                            <div class="text-sm text-gray-600 mt-1">
                                Project: <a href="{{ route('simple.projects.show', $task->project_id) }}" class="text-blue-600 hover:underline">
                                    {{ $task->project->name }}
                                </a>
                            </div>
                            <div class="flex mt-2">
                                <span class="px-2 py-1 text-xs rounded-full 
                                    @if($task->status == 'todo') bg-gray-200
                                    @elseif($task->status == 'doing') bg-blue-200
                                    @elseif($task->status == 'review') bg-yellow-200
                                    @elseif($task->status == 'done') bg-green-200
                                    @endif">
                                    {{ ucfirst($task->status) }}
                                </span>
                            </div>
                        </div>
                    @endforeach
                </div>
            @else
                <p class="text-gray-500">No upcoming tasks.</p>
            @endif
        </div>

        <!-- User Stats -->
        <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">Your Stats</h2>
            
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <span class="text-gray-600">Tasks Completed</span>
                    <span class="font-medium">{{ $completedTasksCount }}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-600">XP Earned</span>
                    <span class="font-medium">{{ $user->xp }}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-600">Current Level</span>
                    <span class="font-medium">{{ $user->level }}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-600">Next Level</span>
                    <div class="flex flex-col items-end">
                        <span class="text-xs text-gray-500">{{ 100 - ($user->xp % 100) }} XP needed</span>
                        <div class="w-24 bg-gray-200 rounded-full h-2 mt-1">
                            <div class="bg-blue-600 h-2 rounded-full" style="width: {{ $user->xp % 100 }}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection
