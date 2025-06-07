<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Make the first user an admin
        $firstUser = User::first();
        if ($firstUser) {
            $firstUser->update(['is_admin' => true]);
            $this->command->info("Made user '{$firstUser->name}' ({$firstUser->email}) an admin.");
        } else {
            $this->command->warn('No users found. Please create a user first.');
        }
    }
}
