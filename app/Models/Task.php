<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\Favoritable;
use App\Traits\RenumbersIdsAfterDeletion;

class Task extends Model
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
        'title',
        'description',
        'list_id',
        'project_id',
        'created_by',
        'reviewer_id',
        'section_id',
        'position',
        'priority',
        'status',
        'review_status',
        'estimate',
        'due_date',
        'start_date',
        'duration_days',
        'completed_at',
        'is_archived',
        'is_inbox',
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
        'start_date' => 'datetime',
        'duration_days' => 'integer',
        'completed_at' => 'datetime',
        'is_archived' => 'boolean',
        'is_inbox' => 'boolean',
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
     * This relationship is optional for inbox tasks.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Scope a query to only include inbox tasks.
     */
    public function scopeInbox($query)
    {
        return $query->where('is_inbox', true);
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

    /**
     * Get the reviewer for the task.
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    /**
     * Get the section that owns the task.
     */
    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }



    /**
     * Get the checklist items for the task.
     */
    public function checklistItems(): HasMany
    {
        return $this->hasMany(ChecklistItem::class);
    }

    /**
     * Get the effective reviewer for this task.
     * Falls back to project default reviewer.
     */
    public function getEffectiveReviewer(): ?User
    {
        // If task has a specific reviewer, use it
        if ($this->reviewer_id) {
            return $this->reviewer;
        }

        // Fall back to project's default reviewer
        if ($this->project && $this->project->default_reviewer_id) {
            return $this->project->defaultReviewer;
        }

        return null;
    }

    /**
     * Toggle task completion based on project completion behavior
     */
    public function toggleCompletion(): array
    {
        $project = $this->project;

        // For inbox tasks or projects with simple completion behavior
        if (!$project || $project->completion_behavior === 'simple') {
            $newStatus = $this->status === 'done' ? 'to_do' : 'done';
            $updateData = [
                'status' => $newStatus,
                'review_status' => null,
            ];

            if ($newStatus === 'done') {
                $updateData['completed_at'] = now();
            } else {
                $updateData['completed_at'] = null;
            }

            return $updateData;
        }

        // For projects with review workflow
        if ($project->completion_behavior === 'review') {
            return $this->handleReviewWorkflow();
        }

        // Default fallback to simple behavior
        return $this->toggleCompletion();
    }

    /**
     * Handle review workflow completion logic
     */
    private function handleReviewWorkflow(): array
    {
        $currentUser = auth()->user();
        $effectiveReviewer = $this->getEffectiveReviewer();
        $isReviewer = $effectiveReviewer && $currentUser && $currentUser->id === $effectiveReviewer->id;
        $isProjectOwner = $this->project && $currentUser && $currentUser->id === $this->project->owner_id;

        // If task is done, unchecking moves it back to to_do
        if ($this->status === 'done') {
            return [
                'status' => 'to_do',
                'review_status' => null,
                'completed_at' => null,
            ];
        }

        // If task is in review (in_progress with pending review)
        if ($this->status === 'in_progress' && $this->review_status === 'pending') {
            // Only reviewer or project owner can approve
            if ($isReviewer || $isProjectOwner) {
                return [
                    'status' => 'done',
                    'review_status' => 'approved',
                    'completed_at' => now(),
                ];
            } else {
                // Non-reviewers can't approve, keep in pending state
                return [
                    'status' => $this->status,
                    'review_status' => $this->review_status,
                    'completed_at' => $this->completed_at,
                ];
            }
        }

        // If task is to_do or in_progress without review, submit for review
        return [
            'status' => 'in_progress',
            'review_status' => 'pending',
            'completed_at' => null,
        ];
    }

    /**
     * Get the display status for the task (considering review status)
     */
    public function getDisplayStatus(): string
    {
        if ($this->status === 'in_progress' && $this->review_status === 'pending') {
            return 'review';
        }

        return $this->status;
    }

    /**
     * Check if task is considered completed for UI purposes
     */
    public function isCompleted(): bool
    {
        return $this->status === 'done';
    }
}
