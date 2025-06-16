<?php

namespace App\Console\Commands;

use App\Models\InvitationNotification;
use App\Mail\InvitationReminderMail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class ProcessInvitationNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'invitations:process-notifications
                            {--dry-run : Show what would be processed without sending}
                            {--limit=50 : Maximum number of notifications to process}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process pending invitation notifications';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $limit = (int) $this->option('limit');

        $this->info('Processing invitation notifications...');

        if ($dryRun) {
            $this->warn('DRY RUN MODE - No notifications will be sent');
        }

        // Get notifications ready to be sent
        $notifications = InvitationNotification::readyToSend()
            ->with(['invitation.project', 'invitation.invitedBy', 'invitation.invitedUser'])
            ->limit($limit)
            ->get();

        if ($notifications->isEmpty()) {
            $this->info('No notifications ready to be sent.');
            return 0;
        }

        $this->info("Found {$notifications->count()} notifications to process.");

        $sent = 0;
        $failed = 0;

        foreach ($notifications as $notification) {
            try {
                if ($dryRun) {
                    $this->line("Would send: {$notification->type} for invitation #{$notification->invitation_id}");
                    continue;
                }

                $this->processNotification($notification);
                $sent++;
                
                $this->line("✓ Sent {$notification->type} notification for invitation #{$notification->invitation_id}");
                
            } catch (\Exception $e) {
                $failed++;
                $notification->markAsFailed($e->getMessage());
                
                $this->error("✗ Failed to send notification #{$notification->id}: " . $e->getMessage());
                Log::error('Failed to send invitation notification', [
                    'notification_id' => $notification->id,
                    'invitation_id' => $notification->invitation_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if (!$dryRun) {
            $this->info("Processed {$notifications->count()} notifications: {$sent} sent, {$failed} failed.");
        }

        // Process retryable failed notifications
        $this->processRetries($dryRun);

        return 0;
    }

    /**
     * Process a single notification.
     */
    private function processNotification(InvitationNotification $notification): void
    {
        $invitation = $notification->invitation;

        // Skip if invitation is no longer pending (except for status change notifications)
        if ($invitation->status !== 'pending' && $notification->type !== 'status_change') {
            $notification->update(['status' => 'cancelled']);
            return;
        }

        switch ($notification->channel) {
            case 'email':
                $this->sendEmailNotification($notification);
                break;
            case 'in_app':
                $this->sendInAppNotification($notification);
                break;
            case 'slack':
                $this->sendSlackNotification($notification);
                break;
            case 'teams':
                $this->sendTeamsNotification($notification);
                break;
            default:
                throw new \Exception("Unsupported notification channel: {$notification->channel}");
        }

        $notification->markAsSent();
    }

    /**
     * Send email notification.
     */
    private function sendEmailNotification(InvitationNotification $notification): void
    {
        $invitation = $notification->invitation;
        $recipient = $this->getNotificationRecipient($notification);

        if (!$recipient) {
            throw new \Exception('No valid recipient found for notification');
        }

        Mail::to($recipient)->send(new InvitationReminderMail($notification));
    }

    /**
     * Send in-app notification.
     */
    private function sendInAppNotification(InvitationNotification $notification): void
    {
        // Implement in-app notification logic
        // This could integrate with your existing notification system
        $this->line("In-app notification would be sent here");
    }

    /**
     * Send Slack notification.
     */
    private function sendSlackNotification(InvitationNotification $notification): void
    {
        // Implement Slack integration
        $this->line("Slack notification would be sent here");
    }

    /**
     * Send Teams notification.
     */
    private function sendTeamsNotification(InvitationNotification $notification): void
    {
        // Implement Microsoft Teams integration
        $this->line("Teams notification would be sent here");
    }

    /**
     * Get the recipient for the notification.
     */
    private function getNotificationRecipient(InvitationNotification $notification): ?string
    {
        $invitation = $notification->invitation;
        $metadata = $notification->metadata ?? [];

        // For follow-up notifications to the inviter
        if (($metadata['recipient'] ?? null) === 'inviter') {
            return $invitation->invitedBy->email;
        }

        // For status change notifications to the inviter
        if ($notification->type === 'status_change') {
            return $invitation->invitedBy->email;
        }

        // Default to the invited user
        return $invitation->email;
    }

    /**
     * Process retryable failed notifications.
     */
    private function processRetries(bool $dryRun): void
    {
        $retryableNotifications = InvitationNotification::retryable()
            ->where('updated_at', '<', now()->subHours(1)) // Wait at least 1 hour before retry
            ->limit(10)
            ->get();

        if ($retryableNotifications->isEmpty()) {
            return;
        }

        $this->info("Found {$retryableNotifications->count()} notifications to retry.");

        foreach ($retryableNotifications as $notification) {
            try {
                if ($dryRun) {
                    $this->line("Would retry: {$notification->type} for invitation #{$notification->invitation_id}");
                    continue;
                }

                // Reset status to pending for retry
                $notification->update(['status' => 'pending']);
                $this->processNotification($notification);
                
                $this->line("✓ Retried notification #{$notification->id}");
                
            } catch (\Exception $e) {
                $notification->markAsFailed($e->getMessage());
                $this->error("✗ Retry failed for notification #{$notification->id}: " . $e->getMessage());
            }
        }
    }
}
