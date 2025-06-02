import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';

interface StarButtonProps {
    type: 'project' | 'task';
    id: number;
    isFavorited: boolean;
    className?: string;
    size?: 'sm' | 'default' | 'lg';
    variant?: 'default' | 'ghost' | 'outline';
}

export default function StarButton({
    type,
    id,
    isFavorited: initialIsFavorited,
    className,
    size = 'sm',
    variant = 'ghost'
}: StarButtonProps) {
    const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();

        if (isLoading) return;

        setIsLoading(true);

        // Optimistically update the UI
        const newFavoriteStatus = !isFavorited;
        setIsFavorited(newFavoriteStatus);

        router.post(route('favorites.toggle'), {
            type,
            id,
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                // If we're on the favorites page, reload to show updated data
                if (window.location.pathname === '/favorites') {
                    router.reload({ only: ['favorites', 'totalCount'] });
                }
            },
            onError: () => {
                // Revert on error
                setIsFavorited(isFavorited);
            },
            onFinish: () => {
                setIsLoading(false);
            }
        });
    };

    return (
        <div className="star-button-wrapper">
            <Button
                variant={variant}
                size={size}
                onClick={handleToggle}
                disabled={isLoading}
                className={cn(
                    "transition-colors",
                    isFavorited && "text-yellow-500 hover:text-yellow-600",
                    !isFavorited && "text-muted-foreground hover:text-foreground",
                    className
                )}
                title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
                <Star
                    className={cn(
                        "h-4 w-4",
                        size === 'sm' && "h-3 w-3",
                        size === 'lg' && "h-5 w-5",
                        isFavorited && "fill-current"
                    )}
                />
            </Button>
        </div>
    );
}
