<?php

namespace App\Console\Commands;

use App\Services\ProjectInvitationService;
use Illuminate\Console\Command;

class CleanupExpiredInvitations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'invitations:cleanup
                            {--dry-run : Show what would be cleaned up without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up expired project invitations';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Cleaning up expired project invitations...');

        if ($this->option('dry-run')) {
            $this->warn('DRY RUN MODE - No changes will be made');
            
            $expiredCount = \App\Models\ProjectInvitation::expired()->count();
            $this->info("Found {$expiredCount} expired invitations that would be marked as expired.");
            
            if ($expiredCount > 0) {
                $this->table(
                    ['Email', 'Project', 'Expired At', 'Days Overdue'],
                    \App\Models\ProjectInvitation::expired()
                        ->with(['project'])
                        ->get()
                        ->map(function ($invitation) {
                            $daysOverdue = now()->diffInDays($invitation->expires_at);
                            return [
                                $invitation->email,
                                $invitation->project->name,
                                $invitation->expires_at->format('Y-m-d H:i:s'),
                                $daysOverdue
                            ];
                        })
                        ->toArray()
                );
            }
            
            return 0;
        }

        $cleanedUp = ProjectInvitationService::cleanupExpiredInvitations();

        if ($cleanedUp > 0) {
            $this->info("Successfully marked {$cleanedUp} expired invitations as expired.");
        } else {
            $this->info('No expired invitations found.');
        }

        return 0;
    }
}
