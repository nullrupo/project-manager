<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class InvitationNotification extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'invitation_id',
        'type',
        'channel',
        'status',
        'scheduled_at',
        'sent_at',
        'metadata',
        'content',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'scheduled_at' => 'datetime',
        'sent_at' => 'datetime',
        'metadata' => 'array',
    ];

    /**
     * Get the invitation that this notification belongs to.
     */
    public function invitation(): BelongsTo
    {
        return $this->belongsTo(ProjectInvitation::class, 'invitation_id');
    }

    /**
     * Mark notification as sent.
     */
    public function markAsSent(): void
    {
        $this->update([
            'status' => 'sent',
            'sent_at' => now(),
        ]);
    }

    /**
     * Mark notification as failed.
     */
    public function markAsFailed(string $error = null): void
    {
        $metadata = $this->metadata ?? [];
        $metadata['error'] = $error;
        $metadata['retry_count'] = ($metadata['retry_count'] ?? 0) + 1;

        $this->update([
            'status' => 'failed',
            'metadata' => $metadata,
        ]);
    }

    /**
     * Check if notification should be retried.
     */
    public function shouldRetry(): bool
    {
        $retryCount = $this->metadata['retry_count'] ?? 0;
        return $this->status === 'failed' && $retryCount < 3;
    }

    /**
     * Scope for pending notifications.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for notifications ready to be sent.
     */
    public function scopeReadyToSend($query)
    {
        return $query->where('status', 'pending')
                    ->where(function ($q) {
                        $q->whereNull('scheduled_at')
                          ->orWhere('scheduled_at', '<=', now());
                    });
    }

    /**
     * Scope for failed notifications that can be retried.
     */
    public function scopeRetryable($query)
    {
        return $query->where('status', 'failed')
                    ->whereRaw('JSON_EXTRACT(metadata, "$.retry_count") < 3');
    }

    /**
     * Create reminder notifications for an invitation.
     */
    public static function createReminders(ProjectInvitation $invitation): void
    {
        if ($invitation->status !== 'pending' || !$invitation->expires_at) {
            return;
        }

        $expiresAt = $invitation->expires_at;
        $now = now();

        // Don't create reminders if invitation expires within 24 hours
        if ($expiresAt->diffInHours($now) < 24) {
            return;
        }

        $reminders = [
            // 3 days before expiry
            [
                'type' => 'reminder',
                'scheduled_at' => $expiresAt->copy()->subDays(3),
                'content' => 'Your invitation to join ' . $invitation->project->name . ' expires in 3 days.',
            ],
            // 1 day before expiry
            [
                'type' => 'expiry_warning',
                'scheduled_at' => $expiresAt->copy()->subDay(),
                'content' => 'Your invitation to join ' . $invitation->project->name . ' expires tomorrow.',
            ],
            // 2 hours before expiry
            [
                'type' => 'expiry_warning',
                'scheduled_at' => $expiresAt->copy()->subHours(2),
                'content' => 'Your invitation to join ' . $invitation->project->name . ' expires in 2 hours.',
            ],
        ];

        foreach ($reminders as $reminder) {
            // Only create if scheduled time is in the future
            if ($reminder['scheduled_at']->isFuture()) {
                self::create([
                    'invitation_id' => $invitation->id,
                    'type' => $reminder['type'],
                    'channel' => 'email',
                    'scheduled_at' => $reminder['scheduled_at'],
                    'content' => $reminder['content'],
                ]);
            }
        }
    }

    /**
     * Create status change notification.
     */
    public static function createStatusChange(ProjectInvitation $invitation, string $oldStatus): void
    {
        $messages = [
            'accepted' => 'Your invitation to join ' . $invitation->project->name . ' has been accepted.',
            'declined' => 'Your invitation to join ' . $invitation->project->name . ' has been declined.',
            'expired' => 'Your invitation to join ' . $invitation->project->name . ' has expired.',
            'cancelled' => 'The invitation to join ' . $invitation->project->name . ' has been cancelled.',
        ];

        if (isset($messages[$invitation->status])) {
            self::create([
                'invitation_id' => $invitation->id,
                'type' => 'status_change',
                'channel' => 'email',
                'content' => $messages[$invitation->status],
                'metadata' => [
                    'old_status' => $oldStatus,
                    'new_status' => $invitation->status,
                ],
            ]);
        }
    }

    /**
     * Create follow-up notification for project owner.
     */
    public static function createFollowUp(ProjectInvitation $invitation, int $daysAfter = 7): void
    {
        if ($invitation->status !== 'pending') {
            return;
        }

        self::create([
            'invitation_id' => $invitation->id,
            'type' => 'follow_up',
            'channel' => 'email',
            'scheduled_at' => $invitation->created_at->copy()->addDays($daysAfter),
            'content' => 'Follow up on your invitation to ' . $invitation->email . ' for ' . $invitation->project->name,
            'metadata' => [
                'recipient' => 'inviter',
                'days_after' => $daysAfter,
            ],
        ]);
    }

    /**
     * Cancel all pending notifications for an invitation.
     */
    public static function cancelForInvitation(ProjectInvitation $invitation): void
    {
        self::where('invitation_id', $invitation->id)
            ->where('status', 'pending')
            ->update(['status' => 'cancelled']);
    }
}
