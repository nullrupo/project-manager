<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Project;
use App\Models\User;
use App\Models\Board;
use App\Models\TaskList;

class ProjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $csvFile = base_path('data/project_import.csv');

        if (!file_exists($csvFile)) {
            $this->command->error('Project CSV file not found: ' . $csvFile);
            return;
        }

        // Get the first user as default owner if no owner specified
        $defaultOwner = User::first();
        if (!$defaultOwner) {
            $this->command->error('No users found. Please run UserSeeder first.');
            return;
        }

        $file = fopen($csvFile, 'r');
        $header = fgetcsv($file); // Skip header row

        // Remove BOM if present
        if (!empty($header) && substr($header[0], 0, 3) === "\xEF\xBB\xBF") {
            $header[0] = substr($header[0], 3);
        }



        while (($row = fgetcsv($file)) !== false) {
            // Skip empty rows
            if (empty(array_filter($row))) {
                continue;
            }

            $projectData = array_combine($header, $row);


            // Skip if project already exists
            if (isset($projectData['name']) && Project::where('name', $projectData['name'])->exists()) {
                $this->command->info('Project already exists: ' . $projectData['name']);
                continue;
            }

            // Generate a unique project key from name
            $key = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $projectData['name']), 0, 4));
            $counter = 1;
            $originalKey = $key;
            while (Project::where('key', $key)->exists()) {
                $key = $originalKey . $counter;
                $counter++;
            }

            $project = Project::create([
                'name' => $projectData['name'],
                'key' => $key,
                'description' => $projectData['description'] ?: null,
                'owner_id' => $defaultOwner->id,
                'is_archived' => ($projectData['status'] === 'archived'),
            ]);

            // Add the owner as a member with 'owner' role
            $project->members()->attach($defaultOwner->id, ['role' => 'owner']);

            // Create a default board for the project
            $board = Board::create([
                'name' => 'Main Board',
                'project_id' => $project->id,
                'type' => 'kanban',
                'is_default' => true,
            ]);

            // Create default lists for the board
            $defaultLists = ['To Do', 'Doing', 'Review', 'Done'];
            foreach ($defaultLists as $index => $listName) {
                TaskList::create([
                    'name' => $listName,
                    'board_id' => $board->id,
                    'position' => $index,
                ]);
            }

            $this->command->info('Created project: ' . $projectData['name'] . ' (' . $key . ')');
        }

        fclose($file);
        $this->command->info('Project seeding completed!');
    }
}
