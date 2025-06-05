<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\RenumbersIdsAfterDeletion;

class Section extends Model
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
        'name',
        'description',
        'project_id',
        'position',
        'is_collapsed',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'position' => 'integer',
        'is_collapsed' => 'boolean',
    ];

    /**
     * Get the project that owns the section.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the tasks for the section.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class)->whereNull('parent_task_id')->orderBy('position');
    }

    /**
     * Get all tasks (including subtasks) for the section.
     */
    public function allTasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }
}
