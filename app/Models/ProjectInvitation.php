<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ProjectInvitation extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'project_id',
        'invited_by',
        'invited_user_id',
        'email',
        'token',
        'status',
        'role',
        'can_manage_members',
        'can_manage_boards',
        'can_manage_tasks',
        'can_manage_labels',
        'can_view_project',
        'can_comment',
        'expires_at',
        'responded_at',
        'message',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'can_manage_members' => 'boolean',
        'can_manage_boards' => 'boolean',
        'can_manage_tasks' => 'boolean',
        'can_manage_labels' => 'boolean',
        'can_view_project' => 'boolean',
        'can_comment' => 'boolean',
        'expires_at' => 'datetime',
        'responded_at' => 'datetime',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($invitation) {
            if (empty($invitation->token)) {
                $invitation->token = Str::random(64);
            }
            
            if (empty($invitation->expires_at)) {
                $invitation->expires_at = Carbon::now()->addDays(7); // Default 7 days expiry
            }
        });
    }

    /**
     * Get the project that the invitation belongs to.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the user who sent the invitation.
     */
    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    /**
     * Get the user who was invited (if they exist).
     */
    public function invitedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_user_id');
    }

    /**
     * Check if the invitation is expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    /**
     * Check if the invitation is pending.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending' && !$this->isExpired();
    }

    /**
     * Mark invitation as expired if past expiry date.
     */
    public function checkAndMarkExpired(): bool
    {
        if ($this->status === 'pending' && $this->isExpired()) {
            $this->update(['status' => 'expired']);
            return true;
        }
        return false;
    }

    /**
     * Get the permissions array for this invitation.
     */
    public function getPermissions(): array
    {
        return [
            'can_manage_members' => $this->can_manage_members,
            'can_manage_boards' => $this->can_manage_boards,
            'can_manage_tasks' => $this->can_manage_tasks,
            'can_manage_labels' => $this->can_manage_labels,
            'can_view_project' => $this->can_view_project,
            'can_comment' => $this->can_comment,
        ];
    }

    /**
     * Scope for pending invitations.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending')
                    ->where(function ($q) {
                        $q->whereNull('expires_at')
                          ->orWhere('expires_at', '>', now());
                    });
    }

    /**
     * Scope for expired invitations.
     */
    public function scopeExpired($query)
    {
        return $query->where('status', 'pending')
                    ->where('expires_at', '<=', now());
    }
}
