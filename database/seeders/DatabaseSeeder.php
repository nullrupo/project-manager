<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create a test user
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'xp' => 0,
            'level' => 1,
            'role' => 'employee',
            'job_title' => 'Developer'
        ]);

        // Run the project seeder
        $this->call([
            ProjectSeeder::class,
        ]);
    }
}
