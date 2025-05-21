@extends('layouts.simple')

@section('title', $project->name)

@section('content')
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">{{ $project->name }}</h1>
        <div class="flex space-x-3">
            <a href="{{ route('simple.projects.edit', $project->id) }}" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                Edit Project
            </a>
            <a href="{{ route('simple.tasks.create', ['project_id' => $project->id]) }}" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
                Add Task
            </a>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Project Info -->
        <div class="lg:col-span-1">
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-xl font-semibold mb-4">Project Details</h2>
                
                <div class="space-y-4">
                    <div>
                        <h3 class="text-sm font-medium text-gray-500">Description</h3>
                        <p class="mt-1">{{ $project->description ?: 'No description' }}</p>
                    </div>
                    
                    <div>
                        <h3 class="text-sm font-medium text-gray-500">Progress</h3>
                        <div class="mt-1">
                            <div class="flex justify-between text-sm mb-1">
                                <span>{{ $project->percent_complete }}% complete</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2.5">
                                <div class="bg-blue-600 h-2.5 rounded-full" style="width: {{ $project->percent_complete }}%"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <h3 class="text-sm font-medium text-gray-500">Start Date</h3>
                            <p class="mt-1">
                                @if($project->start_date)
                                    {{ \Carbon\Carbon::parse($project->start_date)->format('M d, Y') }}
                                @else
                                    Not set
                                @endif
                            </p>
                        </div>
                        
                        <div>
                            <h3 class="text-sm font-medium text-gray-500">Due Date</h3>
                            <p class="mt-1">
                                @if($project->due_date)
                                    {{ \Carbon\Carbon::parse($project->due_date)->format('M d, Y') }}
                                @else
                                    Not set
                                @endif
                            </p>
                        </div>
                    </div>
                    
                    <div>
                        <h3 class="text-sm font-medium text-gray-500">Owner</h3>
                        <p class="mt-1">{{ $project->owner->name }}</p>
                    </div>
                    
                    <div>
                        <h3 class="text-sm font-medium text-gray-500">Status</h3>
                        <p class="mt-1 capitalize">{{ $project->status }}</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Tasks -->
        <div class="lg:col-span-3">
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-semibold">Tasks</h2>
                    <a href="{{ route('simple.tasks.create', ['project_id' => $project->id]) }}" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                        Add Task
                    </a>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <!-- To Do -->
                    <div>
                        <h3 class="font-medium text-gray-700 mb-2">To Do</h3>
                        <div class="space-y-2">
                            @forelse($tasks->where('status', 'todo') as $task)
                                <div class="bg-gray-50 border rounded p-3">
                                    <a href="{{ route('simple.tasks.edit', $task->id) }}" class="font-medium hover:underline">
                                        {{ $task->title }}
                                    </a>
                                    <p class="text-sm text-gray-600 mt-1">{{ Str::limit($task->description, 50) }}</p>
                                    @if($task->due_date)
                                        <div class="text-xs text-gray-500 mt-2">
                                            Due: {{ \Carbon\Carbon::parse($task->due_date)->format('M d') }}
                                        </div>
                                    @endif
                                </div>
                            @empty
                                <p class="text-sm text-gray-500">No tasks</p>
                            @endforelse
                        </div>
                    </div>
                    
                    <!-- In Progress -->
                    <div>
                        <h3 class="font-medium text-gray-700 mb-2">In Progress</h3>
                        <div class="space-y-2">
                            @forelse($tasks->where('status', 'doing') as $task)
                                <div class="bg-blue-50 border rounded p-3">
                                    <a href="{{ route('simple.tasks.edit', $task->id) }}" class="font-medium hover:underline">
                                        {{ $task->title }}
                                    </a>
                                    <p class="text-sm text-gray-600 mt-1">{{ Str::limit($task->description, 50) }}</p>
                                    @if($task->due_date)
                                        <div class="text-xs text-gray-500 mt-2">
                                            Due: {{ \Carbon\Carbon::parse($task->due_date)->format('M d') }}
                                        </div>
                                    @endif
                                </div>
                            @empty
                                <p class="text-sm text-gray-500">No tasks</p>
                            @endforelse
                        </div>
                    </div>
                    
                    <!-- Review -->
                    <div>
                        <h3 class="font-medium text-gray-700 mb-2">Review</h3>
                        <div class="space-y-2">
                            @forelse($tasks->where('status', 'review') as $task)
                                <div class="bg-yellow-50 border rounded p-3">
                                    <a href="{{ route('simple.tasks.edit', $task->id) }}" class="font-medium hover:underline">
                                        {{ $task->title }}
                                    </a>
                                    <p class="text-sm text-gray-600 mt-1">{{ Str::limit($task->description, 50) }}</p>
                                    @if($task->due_date)
                                        <div class="text-xs text-gray-500 mt-2">
                                            Due: {{ \Carbon\Carbon::parse($task->due_date)->format('M d') }}
                                        </div>
                                    @endif
                                </div>
                            @empty
                                <p class="text-sm text-gray-500">No tasks</p>
                            @endforelse
                        </div>
                    </div>
                    
                    <!-- Done -->
                    <div>
                        <h3 class="font-medium text-gray-700 mb-2">Done</h3>
                        <div class="space-y-2">
                            @forelse($tasks->where('status', 'done') as $task)
                                <div class="bg-green-50 border rounded p-3">
                                    <a href="{{ route('simple.tasks.edit', $task->id) }}" class="font-medium hover:underline">
                                        {{ $task->title }}
                                    </a>
                                    <p class="text-sm text-gray-600 mt-1">{{ Str::limit($task->description, 50) }}</p>
                                    @if($task->due_date)
                                        <div class="text-xs text-gray-500 mt-2">
                                            Due: {{ \Carbon\Carbon::parse($task->due_date)->format('M d') }}
                                        </div>
                                    @endif
                                </div>
                            @empty
                                <p class="text-sm text-gray-500">No tasks</p>
                            @endforelse
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection
