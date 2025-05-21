<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Project Manager - @yield('title', 'Home')</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">
    <nav class="bg-blue-600 text-white p-4">
        <div class="container mx-auto flex justify-between items-center">
            <a href="{{ route('simple.dashboard') }}" class="text-xl font-bold">Project Manager</a>
            <div class="space-x-4">
                <a href="{{ route('simple.dashboard') }}" class="hover:underline">Dashboard</a>
                <a href="{{ route('simple.projects.index') }}" class="hover:underline">Projects</a>
                <a href="{{ route('simple.tasks.index') }}" class="hover:underline">Tasks</a>
            </div>
        </div>
    </nav>

    <main class="container mx-auto p-4">
        @if(session('success'))
            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {{ session('success') }}
            </div>
        @endif

        @if(session('error'))
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {{ session('error') }}
            </div>
        @endif

        @yield('content')
    </main>

    <footer class="bg-gray-200 p-4 mt-8">
        <div class="container mx-auto text-center text-gray-600">
            &copy; {{ date('Y') }} Project Manager
        </div>
    </footer>
</body>
</html>
