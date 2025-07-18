<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\Favoritable;
use App\Traits\RenumbersIdsAfterDeletion;

class Project extends Model
{
    use HasFactory, RenumbersIdsAfterDeletion, Favoritable;

    /**
     * Indicates if the model's ID is auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'key',
        'description',
        'owner_id',
        'icon',
        'background_color',
        'is_archived',
        'completion_behavior',
        'requires_review',
        'default_reviewer_id',
        'enable_multiple_boards',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_archived' => 'boolean',
        'requires_review' => 'boolean',
        'enable_multiple_boards' => 'boolean',
    ];

    /**
     * Get the owner of the project.
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get the members of the project.
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
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
     * Get the boards for the project.
     */
    public function boards(): HasMany
    {
        return $this->hasMany(Board::class);
    }

    /**
     * Get the tasks for the project.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Get the labels for the project.
     */
    public function labels(): HasMany
    {
        return $this->hasMany(Label::class);
    }

    /**
     * Get the invitations for the project.
     */
    public function invitations(): HasMany
    {
        return $this->hasMany(ProjectInvitation::class);
    }

    /**
     * Get pending invitations for the project.
     */
    public function pendingInvitations(): HasMany
    {
        return $this->hasMany(ProjectInvitation::class)->where('status', 'pending');
    }

    /**
     * Get permission templates for the project.
     */
    public function permissionTemplates(): HasMany
    {
        return $this->hasMany(PermissionTemplate::class);
    }

    /**
     * Get the default reviewer for the project.
     */
    public function defaultReviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'default_reviewer_id');
    }

    /**
     * Get the sections for the project.
     */
    public function sections(): HasMany
    {
        return $this->hasMany(Section::class);
    }

    /**
     * Check if this project is a team project.
     * A project is considered a team project if:
     * 1. It has members other than the owner, OR
     * 2. It has pending invitations
     */
    public function isTeamProject(): bool
    {
        // Check if there are members other than the owner
        $hasOtherMembers = $this->members()->where('user_id', '!=', $this->owner_id)->exists();

        // Check if there are pending invitations
        $hasPendingInvitations = $this->pendingInvitations()->exists();

        return $hasOtherMembers || $hasPendingInvitations;
    }

    /**
     * Check if this project is a personal project.
     * A project is personal if it's not a team project.
     */
    public function isPersonalProject(): bool
    {
        return !$this->isTeamProject();
    }
}
