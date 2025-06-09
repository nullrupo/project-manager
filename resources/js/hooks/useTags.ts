import { useState, useEffect } from 'react';
import { Tag } from '@/types/project-manager';
import { router } from '@inertiajs/react';

interface UseTagsReturn {
    tags: Tag[];
    loading: boolean;
    error: string | null;
    createTag: (name: string, color: string, description?: string) => Promise<Tag>;
    updateTag: (id: number, data: Partial<Tag>) => Promise<Tag>;
    deleteTag: (id: number) => Promise<void>;
    refreshTags: () => Promise<void>;
}

export function useTags(): UseTagsReturn {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTags = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(route('tags.index'), {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch tags');
            }

            const data = await response.json();
            setTags(data.tags || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch tags');
            console.error('Error fetching tags:', err);
        } finally {
            setLoading(false);
        }
    };

    const createTag = async (name: string, color: string, description?: string): Promise<Tag> => {
        try {
            setError(null);
            
            const response = await fetch(route('tags.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ name, color, description })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create tag');
            }

            const data = await response.json();
            const newTag = data.tag;
            
            setTags(prev => [...prev, newTag]);
            return newTag;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create tag';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const updateTag = async (id: number, data: Partial<Tag>): Promise<Tag> => {
        try {
            setError(null);
            
            const response = await fetch(route('tags.update', { tag: id }), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update tag');
            }

            const responseData = await response.json();
            const updatedTag = responseData.tag;
            
            setTags(prev => prev.map(tag => tag.id === id ? updatedTag : tag));
            return updatedTag;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update tag';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const deleteTag = async (id: number): Promise<void> => {
        try {
            setError(null);
            
            const response = await fetch(route('tags.destroy', { tag: id }), {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete tag');
            }

            setTags(prev => prev.filter(tag => tag.id !== id));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete tag';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const refreshTags = async () => {
        await fetchTags();
    };

    useEffect(() => {
        fetchTags();
    }, []);

    return {
        tags,
        loading,
        error,
        createTag,
        updateTag,
        deleteTag,
        refreshTags
    };
}
