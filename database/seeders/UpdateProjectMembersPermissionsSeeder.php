<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Services\ProjectPermissionService;

class UpdateProjectMembersPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Update existing project members with proper permissions based on their roles
        $members = DB::table('project_user')->get();

        foreach ($members as $member) {
            $permissions = ProjectPermissionService::getDefaultPermissions($member->role);

            DB::table('project_user')
                ->where('id', $member->id)
                ->update($permissions);
        }

        $this->command->info('Updated ' . $members->count() . ' project members with new permissions.');
    }
}
