<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $csvFile = base_path('data/user_import_template.csv');

        if (!file_exists($csvFile)) {
            $this->command->error('User CSV file not found: ' . $csvFile);
            return;
        }

        $file = fopen($csvFile, 'r');
        $header = fgetcsv($file); // Skip header row

        while (($row = fgetcsv($file)) !== false) {
            $userData = array_combine($header, $row);

            // Skip if user already exists
            if (User::where('email', $userData['email'])->exists()) {
                $this->command->info('User already exists: ' . $userData['email']);
                continue;
            }

            User::create([
                'name' => $userData['full_name'],
                'email' => $userData['email'],
                'password' => Hash::make('novastars'), // Default password
                'email_verified_at' => now(),
            ]);

            $this->command->info('Created user: ' . $userData['full_name']);
        }

        fclose($file);
        $this->command->info('User seeding completed!');
    }
}
