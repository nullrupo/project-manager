import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Clock } from 'lucide-react';
import { Project } from '@/types/project-manager';

interface QuickAddTaskProps {
    project: Project;
    sectionId?: string | null;
    status?: string;
    onSuccess?: () => void;
    placeholder?: string;
    className?: string;
}

export default function QuickAddTask({
    project,
    sectionId = null,
    status = 'to_do',
    onSuccess,
    placeholder = "Quick add a task...",
    className = ""
}: QuickAddTaskProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [title, setTitle] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus on mount
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsAdding(true);

        // Prepare task data similar to inbox implementation
        const taskData = {
            title: title.trim(),
            description: '',
            priority: 'medium',
            status: status,
            section_id: sectionId === 'no-section' ? null : sectionId,
            assignee_ids: [],
            label_ids: [],
            tag_ids: [],
        };

        console.log('Creating task with data:', taskData);
        console.log('Using route:', route('project.tasks.store', {
            project: project.id
        }));

        // Use router.post directly like in inbox
        router.post(route('project.tasks.store', {
            project: project.id
        }), taskData, {
            onSuccess: () => {
                console.log('✅ Task created successfully!');
                setTitle('');
                setIsAdding(false);

                // Refocus the input for continuous task entry
                setTimeout(() => {
                    if (inputRef.current) {
                        inputRef.current.focus();
                    }
                }, 100);

                // Call success callback if provided
                if (onSuccess) {
                    onSuccess();
                }
            },
            onError: (errors) => {
                console.error('Failed to create task:', errors);
                console.error('Task data sent:', taskData);
                console.error('Route used:', route('project.tasks.store', {
                    project: project.id
                }));
                setIsAdding(false);
            }
        });
    };

    // Handle Escape key to clear input
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setTitle('');
            if (inputRef.current) {
                inputRef.current.blur();
            }
        }
    };

    return (
        <Card className={className}>
            <CardContent className="pt-3 pb-3">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <div className="flex-1">
                        <Input
                            ref={inputRef}
                            placeholder={placeholder}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isAdding}
                            className="border-dashed"
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={!title.trim() || isAdding}
                        size="sm"
                    >
                        {isAdding ? (
                            <>
                                <Clock className="h-4 w-4 mr-2 animate-spin" />
                                Adding...
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
