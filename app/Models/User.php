<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'role',
        'department',
        'password',
        'is_admin',
        'sidebar_preferences',
        'inbox_preferences',
        'task_display_preferences',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
            'sidebar_preferences' => 'array',
            'inbox_preferences' => 'array',
            'task_display_preferences' => 'array',
        ];
    }

    /**
     * Get the projects owned by the user.
     */
    public function ownedProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'owner_id');
    }

    /**
     * Get the projects the user is a member of.
     */
    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class)
            ->withPivot([
                'role',
                'can_manage_members',
                'can_manage_boards',
                'can_manage_tasks',
                'can_manage_labels',
                'can_view_project',
                'can_comment'
            ])
            ->withTimestamps();
    }

    /**
     * Get the tasks assigned to the user.
     */
    public function assignedTasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class)
            ->withTimestamps();
    }

    /**
     * Get the tasks created by the user.
     */
    public function createdTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'created_by');
    }

    /**
     * Get the comments created by the user.
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * Get invitations sent by this user.
     */
    public function sentInvitations(): HasMany
    {
        return $this->hasMany(ProjectInvitation::class, 'invited_by');
    }

    /**
     * Get invitations received by this user.
     */
    public function receivedInvitations(): HasMany
    {
        return $this->hasMany(ProjectInvitation::class, 'invited_user_id');
    }

    /**
     * Get pending invitations for this user's email.
     */
    public function pendingInvitations(): HasMany
    {
        return $this->hasMany(ProjectInvitation::class, 'invited_user_id')
            ->where('status', 'pending');
    }

    /**
     * Get permission templates created by this user.
     */
    public function permissionTemplates(): HasMany
    {
        return $this->hasMany(PermissionTemplate::class, 'created_by');
    }

    /**
     * Get the tags created by the user.
     */
    public function tags(): HasMany
    {
        return $this->hasMany(Tag::class);
    }

    /**
     * Check if the user is an admin.
     */
    public function isAdmin(): bool
    {
        return $this->is_admin;
    }
}
