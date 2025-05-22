<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\RenumbersIdsAfterDeletion;

class Task extends Model
{
    use HasFactory, RenumbersIdsAfterDeletion;

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
        'title',
        'description',
        'list_id',
        'project_id',
        'created_by',
        'position',
        'priority',
        'status',
        'estimate',
        'due_date',
        'completed_at',
        'is_archived',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'position' => 'integer',
        'estimate' => 'integer',
        'due_date' => 'datetime',
        'completed_at' => 'datetime',
        'is_archived' => 'boolean',
    ];

    /**
     * Get the list that owns the task.
     */
    public function list(): BelongsTo
    {
        return $this->belongsTo(TaskList::class, 'list_id');
    }

    /**
     * Get the project that owns the task.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the user that created the task.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the users assigned to the task.
     */
    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withTimestamps();
    }

    /**
     * Get the labels for the task.
     */
    public function labels(): BelongsToMany
    {
        return $this->belongsToMany(Label::class)
            ->withTimestamps();
    }

    /**
     * Get the comments for the task.
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }
}
