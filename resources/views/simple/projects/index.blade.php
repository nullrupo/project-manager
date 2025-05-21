@extends('layouts.simple')

@section('title', 'Projects')

@section('content')
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Projects</h1>
        <a href="{{ route('simple.projects.create') }}" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            New Project
        </a>
    </div>

    <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="p-4 border-b">
            <form action="{{ route('simple.projects.index') }}" method="GET" class="flex">
                <input type="text" name="search" value="{{ request('search') }}" placeholder="Search projects..." 
                    class="flex-1 border rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r">
                    Search
                </button>
            </form>
        </div>

        @if(count($projects) > 0)
            <div class="divide-y">
                @foreach($projects as $project)
                    <div class="p-6 hover:bg-gray-50">
                        <div class="flex justify-between">
                            <div>
                                <a href="{{ route('simple.projects.show', $project->id) }}" class="text-xl font-semibold text-blue-600 hover:underline">
                                    {{ $project->name }}
                                </a>
                                <p class="text-gray-600 mt-1">{{ Str::limit($project->description, 100) }}</p>
                                
                                <div class="mt-4 flex items-center">
                                    <div class="flex-1 mr-4">
                                        <div class="flex justify-between text-sm text-gray-600 mb-1">
                                            <span>Progress</span>
                                            <span>{{ $project->percent_complete }}%</span>
                                        </div>
                                        <div class="w-full bg-gray-200 rounded-full h-2.5">
                                            <div class="bg-blue-600 h-2.5 rounded-full" style="width: {{ $project->percent_complete }}%"></div>
                                        </div>
                                    </div>
                                    
                                    <div class="text-sm text-gray-600">
                                        <div>{{ $project->tasks_count }} tasks</div>
                                        <div>{{ $project->completed_tasks_count }} completed</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex flex-col items-end">
                                <span class="text-sm text-gray-500">
                                    @if($project->due_date)
                                        Due: {{ \Carbon\Carbon::parse($project->due_date)->format('M d, Y') }}
                                    @else
                                        No due date
                                    @endif
                                </span>
                                
                                <div class="mt-2 flex space-x-2">
                                    <a href="{{ route('simple.projects.edit', $project->id) }}" class="text-blue-500 hover:underline">Edit</a>
                                    <form action="{{ route('simple.projects.destroy', $project->id) }}" method="POST" onsubmit="return confirm('Are you sure you want to delete this project?');">
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
                No projects found. Create your first project!
            </div>
        @endif
    </div>
@endsection
