<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PermissionTemplate extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'description',
        'created_by',
        'project_id',
        'scope',
        'base_role',
        'can_manage_members',
        'can_manage_boards',
        'can_manage_tasks',
        'can_manage_labels',
        'can_view_project',
        'can_comment',
        'is_active',
        'usage_count',
        'tags',
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
        'is_active' => 'boolean',
        'usage_count' => 'integer',
        'tags' => 'array',
    ];

    /**
     * Get the user who created this template.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the project this template belongs to (if project-scoped).
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the permissions as an array.
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
     * Increment usage count.
     */
    public function incrementUsage(): void
    {
        $this->increment('usage_count');
    }

    /**
     * Scope for active templates.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for global templates.
     */
    public function scopeGlobal($query)
    {
        return $query->where('scope', 'global');
    }

    /**
     * Scope for project-specific templates.
     */
    public function scopeForProject($query, $projectId)
    {
        return $query->where('project_id', $projectId)->where('scope', 'project');
    }

    /**
     * Scope for personal templates.
     */
    public function scopePersonal($query, $userId)
    {
        return $query->where('created_by', $userId)->where('scope', 'personal');
    }

    /**
     * Scope for templates accessible by a user for a specific project.
     */
    public function scopeAccessibleBy($query, $userId, $projectId = null)
    {
        return $query->where(function ($q) use ($userId, $projectId) {
            // Global templates (accessible to all)
            $q->where('scope', 'global')
              // Personal templates created by the user
              ->orWhere(function ($subQ) use ($userId) {
                  $subQ->where('scope', 'personal')
                       ->where('created_by', $userId);
              });
            
            // Project-specific templates if project is specified
            if ($projectId) {
                $q->orWhere(function ($subQ) use ($projectId) {
                    $subQ->where('scope', 'project')
                         ->where('project_id', $projectId);
                });
            }
        })->where('is_active', true);
    }

    /**
     * Create a template from an existing invitation.
     */
    public static function createFromInvitation(ProjectInvitation $invitation, string $name, string $description = null, string $scope = 'personal'): self
    {
        return self::create([
            'name' => $name,
            'description' => $description,
            'created_by' => $invitation->invited_by,
            'project_id' => $scope === 'project' ? $invitation->project_id : null,
            'scope' => $scope,
            'base_role' => $invitation->role,
            'can_manage_members' => $invitation->can_manage_members,
            'can_manage_boards' => $invitation->can_manage_boards,
            'can_manage_tasks' => $invitation->can_manage_tasks,
            'can_manage_labels' => $invitation->can_manage_labels,
            'can_view_project' => $invitation->can_view_project,
            'can_comment' => $invitation->can_comment,
        ]);
    }

    /**
     * Get suggested templates based on role and project type.
     */
    public static function getSuggested($role, $projectId = null, $userId = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = self::active()
            ->where('base_role', $role)
            ->orderBy('usage_count', 'desc')
            ->limit(5);

        if ($userId) {
            $query->accessibleBy($userId, $projectId);
        } else {
            $query->global();
        }

        return $query->get();
    }
}
