import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Project, User, Label as LabelType, Tag, Section } from '@/types/project-manager';
import { TagSelector } from '@/components/tag/TagSelector';
import { LabelSelector } from '@/components/label/LabelSelector';
import { useTags } from '@/hooks/useTags';
import { Clock, Calendar, AlertCircle, User as UserIcon, Tag as TagIcon } from 'lucide-react';

interface TaskCreateData {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_date: string | null;
    assignee_ids: number[];
    label_ids: number[];
    tag_ids: number[];
}

interface TaskCreateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: Project;
    members: User[];
    labels: LabelType[];
    tags: Tag[];
    sections: Section[];
    defaultSectionId?: string | null;
    defaultStatus?: string;
    onSuccess?: () => void;
}

export default function TaskCreateModal({
    open,
    onOpenChange,
    project,
    members,
    labels,
    tags,
    sections,
    defaultSectionId = null,
    defaultStatus = 'to_do',
    onSuccess
}: TaskCreateModalProps) {
    const { createTag } = useTags();
    const [isCreating, setIsCreating] = useState(false);
    const [createTaskData, setCreateTaskData] = useState<TaskCreateData>({
        title: '',
        description: '',
        priority: 'medium',
        due_date: null,
        assignee_ids: [],
        label_ids: [],
        tag_ids: []
    });

    const closeDialog = () => {
        setCreateTaskData({
            title: '',
            description: '',
            priority: 'medium',
            due_date: null,
            assignee_ids: [],
            label_ids: [],
            tag_ids: []
        });
        onOpenChange(false);
    };

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!createTaskData.title.trim()) return;

        setIsCreating(true);
        const taskData = {
            ...createTaskData,
            status: defaultStatus,
            section_id: defaultSectionId === 'no-section' ? null : defaultSectionId,
        };

        console.log('Creating task with data:', taskData);
        console.log('Using route:', route('project.tasks.store', {
            project: project.id
        }));

        router.post(route('project.tasks.store', {
            project: project.id
        }), taskData, {
            onSuccess: () => {
                console.log('✅ Task created successfully!');
                setIsCreating(false);
                closeDialog();
                if (onSuccess) {
                    onSuccess();
                }
            },
            onError: (errors) => {
                console.error('Failed to create task:', errors);
                console.error('Task data sent:', taskData);
                setIsCreating(false);
            }
        });
    };

    // Tag handling functions
    const handleTagsChange = (selectedTags: Tag[]) => {
        setCreateTaskData(prev => ({
            ...prev,
            tag_ids: selectedTags.map(tag => tag.id)
        }));
    };

    const handleCreateTagCallback = async (name: string, color: string): Promise<Tag> => {
        return await createTag(name, color);
    };

    // Label handling functions
    const handleLabelsChange = (selectedLabels: LabelType[]) => {
        setCreateTaskData(prev => ({
            ...prev,
            label_ids: selectedLabels.map(label => label.id)
        }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateTask} className="space-y-4">
                    <div className="space-y-4">
                        {/* 1. Title */}
                        <div className="space-y-2">
                            <Label htmlFor="create-title" className="text-sm font-medium">Title</Label>
                            <Input
                                id="create-title"
                                placeholder="Task title"
                                value={createTaskData.title}
                                onChange={(e) => setCreateTaskData(prev => ({ ...prev, title: e.target.value }))}
                                required
                            />
                        </div>

                        {/* 2. Description */}
                        <div className="space-y-2">
                            <Label htmlFor="create-description" className="text-sm font-medium">Description</Label>
                            <Textarea
                                id="create-description"
                                placeholder="Task description (optional)"
                                value={createTaskData.description}
                                onChange={(e) => setCreateTaskData(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                            />
                        </div>

                        {/* 3. Priority */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Priority
                            </Label>
                            <Select
                                value={createTaskData.priority}
                                onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                                    setCreateTaskData(prev => ({ ...prev, priority: value }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 4. Due Date */}
                        <div className="space-y-2">
                            <Label htmlFor="create-due-date" className="text-sm font-medium flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Due Date
                            </Label>
                            <Input
                                id="create-due-date"
                                type="date"
                                value={createTaskData.due_date || ''}
                                onChange={(e) => setCreateTaskData(prev => ({ 
                                    ...prev, 
                                    due_date: e.target.value || null 
                                }))}
                            />
                        </div>

                        {/* 5. Assignees */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                <UserIcon className="h-4 w-4" />
                                Assignees
                            </Label>
                            <Select
                                value=""
                                onValueChange={(value) => {
                                    const userId = parseInt(value);
                                    if (!createTaskData.assignee_ids.includes(userId)) {
                                        setCreateTaskData(prev => ({
                                            ...prev,
                                            assignee_ids: [...prev.assignee_ids, userId]
                                        }));
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Add assignee..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {members.map(member => (
                                        <SelectItem 
                                            key={member.id} 
                                            value={member.id.toString()}
                                            disabled={createTaskData.assignee_ids.includes(member.id)}
                                        >
                                            {member.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            
                            {/* Selected Assignees */}
                            {createTaskData.assignee_ids.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {createTaskData.assignee_ids.map(userId => {
                                        const user = members.find(m => m.id === userId);
                                        return user ? (
                                            <span
                                                key={userId}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                                            >
                                                {user.name}
                                                <button
                                                    type="button"
                                                    onClick={() => setCreateTaskData(prev => ({
                                                        ...prev,
                                                        assignee_ids: prev.assignee_ids.filter(id => id !== userId)
                                                    }))}
                                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ) : null;
                                    })}
                                </div>
                            )}
                        </div>

                        {/* 6. Labels */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Project Labels</Label>
                            <LabelSelector
                                selectedLabels={labels.filter(label => createTaskData.label_ids.includes(label.id))}
                                availableLabels={labels}
                                onLabelsChange={handleLabelsChange}
                                placeholder="Select project labels..."
                            />
                        </div>

                        {/* 7. Tags */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                <TagIcon className="h-4 w-4" />
                                Personal Tags
                            </Label>
                            <TagSelector
                                selectedTags={tags.filter(tag => createTaskData.tag_ids.includes(tag.id))}
                                availableTags={tags}
                                onTagsChange={handleTagsChange}
                                onCreateTag={handleCreateTagCallback}
                                placeholder="Select personal tags..."
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={closeDialog}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isCreating || !createTaskData.title.trim()}>
                            {isCreating ? (
                                <>
                                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Task'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
