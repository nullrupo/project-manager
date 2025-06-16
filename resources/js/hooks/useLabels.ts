import { useState, useEffect } from 'react';
import { Label } from '@/types/project-manager';

interface UseLabelsReturn {
    labels: Label[];
    loading: boolean;
    error: string | null;
    refreshLabels: () => Promise<void>;
}

export function useLabels(projectId?: number): UseLabelsReturn {
    const [labels, setLabels] = useState<Label[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLabels = async () => {
        if (!projectId) {
            setLabels([]);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(route('labels.index', { project: projectId }), {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch labels');
            }

            const data = await response.json();
            setLabels(data.labels || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch labels');
            console.error('Error fetching labels:', err);
        } finally {
            setLoading(false);
        }
    };

    const refreshLabels = async () => {
        await fetchLabels();
    };

    useEffect(() => {
        fetchLabels();
    }, [projectId]);

    return {
        labels,
        loading,
        error,
        refreshLabels
    };
}
