<!DOCTYPE html>
<html>
<head>
    <title>Test Form</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
</head>
<body>
    @if(session('success'))
        <div style="background-color: #d4edda; color: #155724; padding: 10px; margin-bottom: 15px; border-radius: 4px;">
            {{ session('success') }}
        </div>
    @endif

    <h1>Create Project</h1>
    <form method="POST" action="/test/create-project">
        @csrf
        <div>
            <label for="name">Project Name:</label>
            <input type="text" id="name" name="name" value="Test Project" required>
        </div>
        <div>
            <label for="description">Description:</label>
            <textarea id="description" name="description">This is a test project</textarea>
        </div>
        <div>
            <label for="auto_calc_complete">Auto Calculate Completion:</label>
            <input type="checkbox" id="auto_calc_complete" name="auto_calc_complete" value="1" checked>
        </div>
        <button type="submit">Create Project</button>
    </form>

    <h1>Create Task</h1>
    <form method="POST" action="/test/create-task">
        @csrf
        <div>
            <label for="project_id">Project ID:</label>
            <input type="number" id="project_id" name="project_id" value="1" required>
        </div>
        <div>
            <label for="title">Task Title:</label>
            <input type="text" id="title" name="title" value="Test Task" required>
        </div>
        <div>
            <label for="description">Description:</label>
            <textarea id="description" name="description">This is a test task</textarea>
        </div>
        <div>
            <label for="status">Status:</label>
            <select id="status" name="status">
                <option value="todo">Todo</option>
                <option value="doing">Doing</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
            </select>
        </div>
        <button type="submit">Create Task</button>
    </form>
</body>
</html>
