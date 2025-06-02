import { router } from '@inertiajs/react';
import { useState, useCallback } from 'react';
import { dispatchFavoriteToggle, dispatchFavoriteUpdated } from '@/utils/favorites-events';

interface UseFavoritesOptions {
    onToggle?: (isFavorited: boolean) => void;
}

export function useFavorites(options: UseFavoritesOptions = {}) {
    const [isLoading, setIsLoading] = useState(false);

    const toggleFavorite = useCallback(async (
        type: 'project' | 'task',
        id: number,
        currentStatus: boolean
    ) => {
        if (isLoading) return currentStatus;

        setIsLoading(true);

        // Optimistic update
        const newStatus = !currentStatus;
        options.onToggle?.(newStatus);

        // Dispatch toggle event
        dispatchFavoriteToggle({ type, id, isFavorited: newStatus });

        return new Promise<boolean>((resolve, reject) => {
            router.post(route('favorites.toggle'), {
                type,
                id,
            }, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    // Dispatch updated event
                    dispatchFavoriteUpdated({ type, id, isFavorited: newStatus });

                    // If we're on the favorites page, reload to show updated data
                    if (window.location.pathname === '/favorites') {
                        router.reload({ only: ['favorites', 'totalCount'] });
                    }
                    resolve(newStatus);
                },
                onError: () => {
                    // Revert optimistic update
                    options.onToggle?.(!newStatus);
                    // Dispatch revert event
                    dispatchFavoriteUpdated({ type, id, isFavorited: currentStatus });
                    reject(new Error('Failed to toggle favorite'));
                },
                onFinish: () => {
                    setIsLoading(false);
                }
            });
        });
    }, [isLoading, options]);

    return {
        toggleFavorite,
        isLoading
    };
}
