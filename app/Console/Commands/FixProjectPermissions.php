<?php

namespace App\Console\Commands;

use App\Models\Project;
use App\Services\ProjectPermissionService;
use Illuminate\Console\Command;

class FixProjectPermissions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'projects:fix-permissions';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix project permissions for existing projects';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Fixing project permissions...');

        $projects = Project::with(['owner', 'members'])->get();

        foreach ($projects as $project) {
            $this->info("Processing project: {$project->name} (ID: {$project->id})");

            // Check if owner is in members table
            $ownerMembership = $project->members()->where('user_id', $project->owner_id)->first();

            if (!$ownerMembership) {
                $this->info("  Adding owner to members table...");
                ProjectPermissionService::addUserToProject($project, $project->owner, 'owner');
            } else {
                // Update existing membership to ensure all permissions are set
                $this->info("  Updating owner permissions...");
                ProjectPermissionService::updateUserPermissions($project, $project->owner, 'owner');
            }

            // Fix any members that have role but no permissions
            foreach ($project->members as $member) {
                $membership = $project->members()->where('user_id', $member->id)->first();
                $role = $membership->pivot->role;

                // Check if any permission is null
                $permissions = [
                    'can_manage_members',
                    'can_manage_boards', 
                    'can_manage_tasks',
                    'can_manage_labels',
                    'can_view_project',
                    'can_comment'
                ];

                $needsUpdate = false;
                foreach ($permissions as $permission) {
                    if (is_null($membership->pivot->{$permission})) {
                        $needsUpdate = true;
                        break;
                    }
                }

                if ($needsUpdate) {
                    $this->info("  Updating permissions for member: {$member->name} (Role: {$role})");
                    ProjectPermissionService::updateUserPermissions($project, $member, $role);
                }
            }
        }

        $this->info('Project permissions fixed successfully!');
    }
}
