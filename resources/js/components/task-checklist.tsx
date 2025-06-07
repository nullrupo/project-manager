import React, { useState, useEffect } from 'react';
import { useForm, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Task, ChecklistItem } from '@/types/project-manager';
import { Check } from 'lucide-react';
import { useGlobalTaskInspector } from '@/contexts/GlobalTaskInspectorContext';

interface TaskChecklistProps {
    task: Task;
    checklistItems: ChecklistItem[];
}

export default function TaskChecklist({ task, checklistItems }: TaskChecklistProps) {
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [editingText, setEditingText] = useState('');
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
    });
    const page = usePage();
    const { refreshTaskData } = useGlobalTaskInspector();

    // Listen for page data changes and refresh inspector task data
    useEffect(() => {
        const pageProps = page.props as any;
        let updatedTask = null;

        // Check if we're on inbox page
        if (pageProps.tasks && Array.isArray(pageProps.tasks)) {
            updatedTask = pageProps.tasks.find((t: any) => t.id === task.id);
        }

        // Check if we're on project page
        if (!updatedTask && pageProps.project?.tasks) {
            if (Array.isArray(pageProps.project.tasks.data)) {
                updatedTask = pageProps.project.tasks.data.find((t: any) => t.id === task.id);
            } else if (Array.isArray(pageProps.project.tasks)) {
                updatedTask = pageProps.project.tasks.find((t: any) => t.id === task.id);
            }
        }

        // If we found an updated task, refresh the inspector
        if (updatedTask) {
            refreshTaskData(updatedTask);
        }
    }, [page.props, task.id, refreshTaskData]);

    const handleAddItem = () => {
        if (data.title.trim()) {
            post(route('checklist-items.store', task.id), {
                onSuccess: () => {
                    reset();
                },
                preserveState: false, // Force a full page refresh to update task data
                preserveScroll: true,
            });
        }
    };

    const handleAddKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddItem();
        } else if (e.key === 'Escape') {
            reset();
        }
    };

    const toggleItemCompletion = (item: ChecklistItem) => {
        router.post(route('checklist-items.toggle', { task: task.id, checklistItem: item.id }), {}, {
            preserveState: false, // Force refresh to update task data
            preserveScroll: true,
        });
    };

    const startEditing = (item: ChecklistItem) => {
        setEditingItemId(item.id);
        setEditingText(item.title);
    };

    const handleEditKeyDown = (e: React.KeyboardEvent, item: ChecklistItem) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit(item);
        } else if (e.key === 'Escape') {
            setEditingItemId(null);
            setEditingText('');
        }
    };

    const saveEdit = (item: ChecklistItem) => {
        if (editingText.trim() === '') {
            // Delete item if text is empty
            router.delete(route('checklist-items.destroy', { task: task.id, checklistItem: item.id }), {
                preserveState: false, // Force refresh to update task data
                preserveScroll: true,
            });
        } else {
            // Update item
            router.put(route('checklist-items.update', { task: task.id, checklistItem: item.id }), {
                title: editingText.trim()
            }, {
                preserveState: false, // Force refresh to update task data
                preserveScroll: true,
            });
        }
        setEditingItemId(null);
        setEditingText('');
    };

    const completedCount = checklistItems.filter(item => item.is_completed).length;
    const totalCount = checklistItems.length;
    const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <Card>
            <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        Checklist
                        {totalCount > 0 && (
                            <span className="text-sm font-normal text-muted-foreground">
                                ({completedCount}/{totalCount})
                            </span>
                        )}
                    </CardTitle>
                </div>
                {totalCount > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                )}
            </CardHeader>
            <CardContent className="pt-1">
                <div className="space-y-2">
                    {/* Always show input box for new items */}
                    <div className="p-2 border-2 border-dashed border-gray-200 rounded-md">
                        <Input
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            onKeyDown={handleAddKeyDown}
                            onBlur={() => {
                                if (!data.title.trim()) {
                                    reset();
                                }
                            }}
                            placeholder="Add new checklist item (Press Enter to add, Esc to clear)"
                            className="w-full h-8 border-0 shadow-none focus-visible:ring-0 px-0"
                            disabled={processing}
                        />
                    </div>

                    {errors.title && (
                        <p className="text-sm text-red-600 px-2">{errors.title}</p>
                    )}

                    {/* Existing checklist items */}
                    {checklistItems.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 group"
                        >
                            <Checkbox
                                checked={item.is_completed}
                                onCheckedChange={() => toggleItemCompletion(item)}
                                className="border-2"
                            />
                            {editingItemId === item.id ? (
                                <Input
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    onKeyDown={(e) => handleEditKeyDown(e, item)}
                                    onBlur={() => saveEdit(item)}
                                    className="flex-1 h-8"
                                    autoFocus
                                />
                            ) : (
                                <span
                                    className={`flex-1 text-sm cursor-pointer ${
                                        item.is_completed
                                            ? 'line-through text-muted-foreground'
                                            : ''
                                    }`}
                                    onDoubleClick={() => startEditing(item)}
                                >
                                    {item.title}
                                </span>
                            )}
                        </div>
                    ))}

                    {checklistItems.length === 0 && (
                        <div className="text-center py-2">
                            <p className="text-sm text-muted-foreground">
                                No checklist items yet. Use the input above to add your first item.
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
