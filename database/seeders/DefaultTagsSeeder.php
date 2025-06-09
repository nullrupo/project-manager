<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tag;
use App\Models\User;

class DefaultTagsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $defaultTags = [
            [
                'name' => 'Waiting for',
                'color' => '#f59e0b', // amber
                'description' => 'Tasks waiting for someone else or external dependencies'
            ],
            [
                'name' => 'Errands',
                'color' => '#10b981', // emerald
                'description' => 'Tasks to be done while out and about'
            ],
            [
                'name' => 'Home',
                'color' => '#3b82f6', // blue
                'description' => 'Tasks to be done at home'
            ],
            [
                'name' => 'Office',
                'color' => '#8b5cf6', // violet
                'description' => 'Tasks to be done at the office'
            ],
        ];

        // Create default tags for all existing users
        $users = User::all();
        
        foreach ($users as $user) {
            foreach ($defaultTags as $tagData) {
                // Check if tag already exists for this user
                $existingTag = Tag::where('user_id', $user->id)
                    ->where('name', $tagData['name'])
                    ->first();
                
                if (!$existingTag) {
                    Tag::create([
                        'name' => $tagData['name'],
                        'color' => $tagData['color'],
                        'description' => $tagData['description'],
                        'user_id' => $user->id,
                        'is_default' => true,
                    ]);
                }
            }
        }
    }
}
