<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Project;
use App\Models\Section;
use App\Models\Task;
use App\Models\ChecklistItem;

class ReviewerTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create test users
        $owner = User::firstOrCreate(
            ['email' => 'owner@example.com'],
            [
                'name' => 'Project Owner',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        );

        $reviewer = User::firstOrCreate(
            ['email' => 'reviewer@example.com'],
            [
                'name' => 'Task Reviewer',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        );

        $developer = User::firstOrCreate(
            ['email' => 'developer@example.com'],
            [
                'name' => 'Developer',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        );

        // Create a test project with review workflow
        $project = Project::firstOrCreate(
            ['key' => 'REVIEW'],
            [
                'name' => 'Review Workflow Test',
                'description' => 'A test project to demonstrate the reviewer role system and hierarchical structure.',
                'owner_id' => $owner->id,
                'completion_behavior' => 'review',
                'requires_review' => true,
                'default_reviewer_id' => $reviewer->id,
            ]
        );

        // Add members to the project
        $project->members()->syncWithoutDetaching([
            $reviewer->id => ['role' => 'admin', 'can_manage_tasks' => true, 'can_manage_members' => true, 'can_manage_boards' => true, 'can_manage_labels' => true, 'can_view_project' => true, 'can_comment' => true],
            $developer->id => ['role' => 'editor', 'can_manage_tasks' => true, 'can_manage_members' => false, 'can_manage_boards' => false, 'can_manage_labels' => false, 'can_view_project' => true, 'can_comment' => true],
        ]);

        // Sections will be created manually by users - no default sections

        // Get the project's default board and lists
        $board = $project->boards()->first();
        if (!$board) {
            $board = $project->boards()->create([
                'name' => 'Main Board',
                'type' => 'kanban',
                'is_default' => true,
                'position' => 0,
            ]);

            // Create default lists
            $board->lists()->create(['name' => 'To Do', 'position' => 0]);
            $board->lists()->create(['name' => 'In Progress', 'position' => 1]);
            $board->lists()->create(['name' => 'Review', 'position' => 2]);
            $board->lists()->create(['name' => 'Done', 'position' => 3]);
        }

        $todoList = $board->lists()->where('name', 'To Do')->first();
        $inProgressList = $board->lists()->where('name', 'In Progress')->first();
        $reviewList = $board->lists()->where('name', 'Review')->first();

        // Create test tasks with different reviewer scenarios
        $task1 = Task::firstOrCreate(
            ['title' => 'Implement User Authentication', 'project_id' => $project->id],
            [
                'description' => 'Create login and registration functionality with proper validation.',
                'list_id' => $todoList->id,
                'created_by' => $developer->id,
                'reviewer_id' => null, // Uses project default reviewer
                'priority' => 'high',
                'status' => 'to_do',
                'position' => 0,
            ]
        );

        $task2 = Task::firstOrCreate(
            ['title' => 'Design Dashboard UI', 'project_id' => $project->id],
            [
                'description' => 'Create wireframes and mockups for the main dashboard.',
                'list_id' => $inProgressList->id,
                'created_by' => $developer->id,
                'reviewer_id' => $owner->id, // Override with specific reviewer
                'priority' => 'medium',
                'status' => 'in_progress',
                'review_status' => 'pending',
                'position' => 0,
            ]
        );

        // Create additional tasks (previously subtasks, now regular tasks)
        $task3 = Task::firstOrCreate(
            ['title' => 'Create login form component', 'project_id' => $project->id],
            [
                'description' => 'Build reusable login form with validation.',
                'list_id' => $todoList->id,
                'created_by' => $developer->id,
                'priority' => 'medium',
                'status' => 'to_do',
                'position' => 2,
            ]
        );

        $task4 = Task::firstOrCreate(
            ['title' => 'Implement password reset', 'project_id' => $project->id],
            [
                'description' => 'Add forgot password functionality.',
                'list_id' => $todoList->id,
                'created_by' => $developer->id,
                'priority' => 'low',
                'status' => 'to_do',
                'position' => 3,
            ]
        );

        // Create checklist items
        ChecklistItem::firstOrCreate(
            ['task_id' => $task1->id, 'title' => 'Set up authentication middleware'],
            ['position' => 0, 'is_completed' => false]
        );

        ChecklistItem::firstOrCreate(
            ['task_id' => $task1->id, 'title' => 'Write unit tests'],
            ['position' => 1, 'is_completed' => false]
        );

        ChecklistItem::firstOrCreate(
            ['task_id' => $task1->id, 'title' => 'Update documentation'],
            ['position' => 2, 'is_completed' => true]
        );

        // Assign users to tasks
        $task1->assignees()->syncWithoutDetaching([$developer->id]);
        $task2->assignees()->syncWithoutDetaching([$developer->id]);

        $this->command->info('Reviewer test data seeded successfully!');
        $this->command->info('Test users created:');
        $this->command->info('- Owner: owner@example.com (password: password)');
        $this->command->info('- Reviewer: reviewer@example.com (password: password)');
        $this->command->info('- Developer: developer@example.com (password: password)');
        $this->command->info('Project: ' . $project->name . ' (Key: ' . $project->key . ')');
    }
}
