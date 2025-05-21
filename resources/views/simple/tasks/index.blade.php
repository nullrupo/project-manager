@extends('layouts.simple')

@section('title', 'My Tasks')

@section('content')
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">My Tasks</h1>
        <a href="{{ route('simple.tasks.create') }}" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            New Task
        </a>
    </div>

    <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="p-4 border-b">
            <form action="{{ route('simple.tasks.index') }}" method="GET" class="flex flex-wrap gap-4">
                <div class="flex flex-1">
                    <input type="text" name="search" value="{{ request('search') }}" placeholder="Search tasks..." 
                        class="flex-1 border rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r">
                        Search
                    </button>
                </div>
                
                <select name="filter" onchange="this.form.submit()"
                    class="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="all" {{ request('filter') == 'all' ? 'selected' : '' }}>All Tasks</option>
                    <option value="todo" {{ request('filter') == 'todo' ? 'selected' : '' }}>To Do</option>
                    <option value="doing" {{ request('filter') == 'doing' ? 'selected' : '' }}>In Progress</option>
                    <option value="review" {{ request('filter') == 'review' ? 'selected' : '' }}>Review</option>
                    <option value="done" {{ request('filter') == 'done' ? 'selected' : '' }}>Done</option>
                </select>
            </form>
        </div>

        @if(count($tasks) > 0)
            <div class="divide-y">
                @foreach($tasks as $task)
                    <div class="p-6 hover:bg-gray-50">
                        <div class="flex justify-between">
                            <div>
                                <div class="flex items-center">
                                    <a href="{{ route('simple.tasks.edit', $task->id) }}" class="text-lg font-semibold text-blue-600 hover:underline">
                                        {{ $task->title }}
                                    </a>
                                    <span class="ml-3 px-2 py-1 text-xs rounded-full 
                                        @if($task->status == 'todo') bg-gray-200
                                        @elseif($task->status == 'doing') bg-blue-200
                                        @elseif($task->status == 'review') bg-yellow-200
                                        @elseif($task->status == 'done') bg-green-200
                                        @endif">
                                        {{ ucfirst($task->status) }}
                                    </span>
                                </div>
                                
                                <p class="text-gray-600 mt-1">{{ Str::limit($task->description, 100) }}</p>
                                
                                <div class="mt-2 text-sm text-gray-600">
                                    Project: <a href="{{ route('simple.projects.show', $task->project_id) }}" class="text-blue-600 hover:underline">
                                        {{ $task->project->name }}
                                    </a>
                                </div>
                                
                                @if(count($task->tags) > 0)
                                    <div class="mt-2 flex flex-wrap gap-1">
                                        @foreach($task->tags as $tag)
                                            <span class="px-2 py-1 text-xs rounded-full bg-gray-100">
                                                {{ $tag->name }}
                                            </span>
                                        @endforeach
                                    </div>
                                @endif
                            </div>
                            
                            <div class="flex flex-col items-end">
                                <span class="text-sm 
                                    @if($task->due_date && $task->due_date->isPast() && $task->status != 'done') text-red-500
                                    @else text-gray-500 @endif">
                                    @if($task->due_date)
                                        Due: {{ $task->due_date->format('M d, Y') }}
                                    @else
                                        No due date
                                    @endif
                                </span>
                                
                                <div class="mt-2 flex space-x-2">
                                    <a href="{{ route('simple.tasks.edit', $task->id) }}" class="text-blue-500 hover:underline">Edit</a>
                                    <form action="{{ route('simple.tasks.destroy', $task->id) }}" method="POST" onsubmit="return confirm('Are you sure you want to delete this task?');">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="text-red-500 hover:underline">Delete</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>
        @else
            <div class="p-6 text-center text-gray-500">
                No tasks found.
            </div>
        @endif
    </div>
@endsection
