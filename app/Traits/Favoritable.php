<?php

namespace App\Traits;

use App\Models\Favorite;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait Favoritable
{
    /**
     * Get all favorites for this model.
     */
    public function favorites(): MorphMany
    {
        return $this->morphMany(Favorite::class, 'favoritable');
    }

    /**
     * Check if this model is favorited by a specific user.
     */
    public function isFavoritedBy($user): bool
    {
        if (!$user) {
            return false;
        }

        return $this->favorites()
            ->where('user_id', $user->id ?? $user)
            ->exists();
    }

    /**
     * Add this model to a user's favorites.
     */
    public function addToFavorites($user): void
    {
        if (!$this->isFavoritedBy($user)) {
            $this->favorites()->create([
                'user_id' => $user->id ?? $user,
            ]);
        }
    }

    /**
     * Remove this model from a user's favorites.
     */
    public function removeFromFavorites($user): void
    {
        $this->favorites()
            ->where('user_id', $user->id ?? $user)
            ->delete();
    }

    /**
     * Toggle favorite status for a user.
     */
    public function toggleFavorite($user): bool
    {
        if ($this->isFavoritedBy($user)) {
            $this->removeFromFavorites($user);
            return false;
        } else {
            $this->addToFavorites($user);
            return true;
        }
    }

    /**
     * Get the total number of favorites for this model.
     */
    public function getFavoritesCountAttribute(): int
    {
        return $this->favorites()->count();
    }
}
