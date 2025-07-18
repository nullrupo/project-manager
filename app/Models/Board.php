<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\RenumbersIdsAfterDeletion;

class Board extends Model
{
    use HasFactory, RenumbersIdsAfterDeletion;



    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'project_id',
        'type',
        'is_default',
        'position',
        'background_color',
        'background_image',
        'column_outline_style',
        'column_spacing',
        'card_style',
        'show_task_count',
        'show_wip_limits',
        'enable_swimlanes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_default' => 'boolean',
        'position' => 'integer',
        'show_task_count' => 'boolean',
        'show_wip_limits' => 'boolean',
        'enable_swimlanes' => 'boolean',
    ];

    /**
     * Get the project that owns the board.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the lists for the board.
     */
    public function lists(): HasMany
    {
        return $this->hasMany(TaskList::class)->orderBy('position');
    }
}
