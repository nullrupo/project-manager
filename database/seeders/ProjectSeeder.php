<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\Task;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create some default tags
        $tags = [
            ['name' => 'Design', 'color' => '#3b82f6'],
            ['name' => 'Development', 'color' => '#10b981'],
            ['name' => 'Research', 'color' => '#8b5cf6'],
            ['name' => 'Content', 'color' => '#f59e0b'],
            ['name' => 'Planning', 'color' => '#6366f1'],
            ['name' => 'QA', 'color' => '#ef4444'],
            ['name' => 'SEO', 'color' => '#14b8a6'],
            ['name' => 'Mobile', 'color' => '#f97316'],
            ['name' => 'API', 'color' => '#8b5cf6'],
        ];

        foreach ($tags as $tagData) {
            Tag::create([
                'name' => $tagData['name'],
                'color' => $tagData['color'],
                'user_id' => null // System tag
            ]);
        }

        // Get the first user (admin)
        $user = User::first();

        if (!$user) {
            // Create a user if none exists
            $user = User::create([
                'name' => 'Admin User',
                'email' => 'admin@example.com',
                'password' => bcrypt('password'),
                'xp' => 1000,
                'level' => 10,
                'role' => 'admin',
                'job_title' => 'Administrator'
            ]);
        }

        // Create a sample project
        $project = Project::create([
            'name' => 'Marketing Website Redesign',
            'description' => 'Redesign the company marketing website with new branding',
            'owner_id' => $user->id,
            'start_date' => now(),
            'due_date' => now()->addMonths(2),
            'auto_calc_complete' => true,
            'percent_complete' => 0,
            'status' => 'active'
        ]);

        // Add the owner as a member
        $project->members()->attach($user->id, ['role' => 'owner']);

        // Create some sample tasks
        $tasks = [
            [
                'title' => 'Create wireframes',
                'description' => 'Design initial wireframes for homepage',
                'status' => 'todo',
                'due_date' => now()->addDays(7),
                'tags' => ['Design']
            ],
            [
                'title' => 'Content audit',
                'description' => 'Review existing content and identify gaps',
                'status' => 'todo',
                'due_date' => now()->addDays(10),
                'tags' => ['Content']
            ],
            [
                'title' => 'Homepage redesign',
                'description' => 'Implement new homepage design',
                'status' => 'doing',
                'due_date' => now()->addDays(14),
                'tags' => ['Development']
            ],
            [
                'title' => 'SEO optimization',
                'description' => 'Optimize meta tags and content for SEO',
                'status' => 'doing',
                'due_date' => now()->addDays(21),
                'tags' => ['SEO']
            ],
            [
                'title' => 'Mobile responsiveness',
                'description' => 'Test and fix mobile layout issues',
                'status' => 'review',
                'due_date' => now()->addDays(28),
                'tags' => ['QA', 'Mobile']
            ],
            [
                'title' => 'Project kickoff',
                'description' => 'Initial team meeting and project planning',
                'status' => 'done',
                'due_date' => now()->subDays(7),
                'tags' => ['Planning']
            ]
        ];

        foreach ($tasks as $taskData) {
            $task = new Task();
            $task->project_id = $project->id;
            $task->title = $taskData['title'];
            $task->description = $taskData['description'];
            $task->assignee_id = $user->id;
            $task->due_date = $taskData['due_date'];
            $task->status = $taskData['status'];
            $task->save();

            // Attach tags
            foreach ($taskData['tags'] as $tagName) {
                $tag = Tag::where('name', $tagName)->first();
                if ($tag) {
                    $task->tags()->attach($tag->id);
                }
            }

            // Award XP for completed tasks
            if ($taskData['status'] === 'done') {
                $task->xp_earned = 10;
                $task->save();
            }
        }
    }
}
