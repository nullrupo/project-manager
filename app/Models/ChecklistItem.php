<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\RenumbersIdsAfterDeletion;

class ChecklistItem extends Model
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
        'task_id',
        'is_completed',
        'position',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_completed' => 'boolean',
        'position' => 'integer',
    ];

    /**
     * Get the task that owns the checklist item.
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }
}
