<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Task;
use App\Models\Project;
use App\Models\User;
use App\Models\TaskList;

class TaskSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $csvFile = base_path('data/task_import.csv');

        if (!file_exists($csvFile)) {
            $this->command->error('Task CSV file not found: ' . $csvFile);
            return;
        }

        // Get the first user as default creator
        $defaultCreator = User::first();
        if (!$defaultCreator) {
            $this->command->error('No users found. Please run UserSeeder first.');
            return;
        }

        $file = fopen($csvFile, 'r');
        $header = fgetcsv($file); // Skip header row

        while (($row = fgetcsv($file)) !== false) {
            $taskData = array_combine($header, $row);

            // Skip if task already exists
            if (Task::where('title', $taskData['title'])->exists()) {
                $this->command->info('Task already exists: ' . $taskData['title']);
                continue;
            }

            // Find project by name
            $project = null;
            if (!empty($taskData['projectId'])) {
                $project = Project::where('name', $taskData['projectId'])->first();
            }

            // Get the first list from the project's default board
            $list = null;
            if ($project) {
                $defaultBoard = $project->boards()->where('is_default', true)->first();
                if ($defaultBoard) {
                    // Map status to appropriate list
                    $listName = match($taskData['status']) {
                        'todo' => 'To Do',
                        'review' => 'Review',
                        'done' => 'Done',
                        'archived' => 'Done',
                        default => 'To Do'
                    };

                    $list = $defaultBoard->lists()->where('name', $listName)->first();
                    if (!$list) {
                        // Fallback to first list
                        $list = $defaultBoard->lists()->first();
                    }
                }
            }

            $task = Task::create([
                'title' => $taskData['title'],
                'description' => $taskData['description'] ?: null,
                'project_id' => $project?->id,
                'list_id' => $list?->id,
                'created_by' => $defaultCreator->id,
                'status' => match($taskData['status']) {
                    'todo' => 'to_do',
                    'review' => 'review',
                    'done' => 'done',
                    'archived' => 'done',
                    default => 'to_do'
                },
                'is_archived' => ($taskData['status'] === 'archived'),
                'is_inbox' => empty($project), // If no project, it's an inbox task
            ]);

            $this->command->info('Created task: ' . $taskData['title']);
        }

        fclose($file);
        $this->command->info('Task seeding completed!');
    }
}
