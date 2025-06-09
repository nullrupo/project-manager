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
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_archived' => 'boolean',
        'requires_review' => 'boolean',
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
}
