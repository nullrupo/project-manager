import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Task, ChecklistItem } from '@/types/project-manager';
import { Plus, Trash2, Check } from 'lucide-react';

interface TaskChecklistProps {
    task: Task;
    checklistItems: ChecklistItem[];
}

export default function TaskChecklist({ task, checklistItems }: TaskChecklistProps) {
    const [isAdding, setIsAdding] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
    });

    // Debug logging
    console.log('TaskChecklist rendered with:', {
        taskId: task.id,
        checklistItemsCount: checklistItems.length,
        checklistItems: checklistItems
    });

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('checklist-items.store', task.id), {
            onSuccess: () => {
                reset();
                setIsAdding(false);
            },
        });
    };

    const toggleItemCompletion = (item: ChecklistItem) => {
        router.post(route('checklist-items.toggle', { task: task.id, checklistItem: item.id }), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const deleteItem = (item: ChecklistItem) => {
        if (confirm('Are you sure you want to delete this checklist item?')) {
            router.delete(route('checklist-items.destroy', { task: task.id, checklistItem: item.id }));
        }
    };

    const completedCount = checklistItems.filter(item => item.is_completed).length;
    const totalCount = checklistItems.length;
    const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <Card>
            <CardHeader className="pb-3">
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
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAdding(true)}
                        className="h-8 px-2"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                {totalCount > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                )}
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-2">
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
                            <span
                                className={`flex-1 text-sm ${
                                    item.is_completed
                                        ? 'line-through text-muted-foreground'
                                        : ''
                                }`}
                            >
                                {item.title}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteItem(item)}
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}

                    {isAdding && (
                        <form onSubmit={handleAddItem} className="flex gap-2 p-2">
                            <Input
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                placeholder="Enter checklist item"
                                className="flex-1 h-8"
                                autoFocus
                                required
                            />
                            <Button type="submit" size="sm" disabled={processing}>
                                Add
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setIsAdding(false);
                                    reset();
                                }}
                            >
                                Cancel
                            </Button>
                        </form>
                    )}

                    {errors.title && (
                        <p className="text-sm text-red-600 px-2">{errors.title}</p>
                    )}

                    {!isAdding && checklistItems.length === 0 && (
                        <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">
                                No checklist items yet.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsAdding(true)}
                                className="mt-2"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add first item
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
