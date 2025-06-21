<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Department;
use App\Models\User;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default departments
        $departments = [
            [
                'name' => 'Engineering',
                'description' => 'Software development and technical operations',
            ],
            [
                'name' => 'Design',
                'description' => 'UI/UX design and creative services',
            ],
            [
                'name' => 'Marketing',
                'description' => 'Marketing and communications',
            ],
            [
                'name' => 'Sales',
                'description' => 'Sales and business development',
            ],
            [
                'name' => 'Human Resources',
                'description' => 'HR and people operations',
            ],
            [
                'name' => 'Finance',
                'description' => 'Finance and accounting',
            ],
            [
                'name' => 'Operations',
                'description' => 'General operations and administration',
            ],
        ];

        foreach ($departments as $dept) {
            Department::firstOrCreate(
                ['name' => $dept['name']],
                $dept
            );
        }

        // Set up admin user
        $adminUser = User::where('email', 'quocnt@novastars.vn')->first();
        if ($adminUser) {
            $adminUser->update([
                'is_admin' => true,
                'role' => 'System Administrator',
                'department_id' => Department::where('name', 'Engineering')->first()?->id,
            ]);
        }
    }
}
