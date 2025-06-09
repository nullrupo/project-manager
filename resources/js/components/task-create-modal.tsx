import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Project, TaskList, User, Label as ProjectLabel } from '@/types/project-manager';
import { LoaderCircle, Calendar, User as UserIcon, Tag, List, Plus } from 'lucide-react';

interface TaskCreateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: Project;
    members: User[];
    labels: ProjectLabel[];
    lists: TaskList[];
    initialListId?: number;
}

interface TaskCreateForm {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: string;
    estimate: number | null;
    due_date: string;
    list_id: number;
    assignee_ids: number[];
    label_ids: number[];
}

export default function TaskCreateModal({ open, onOpenChange, project, members, labels, lists, initialListId }: TaskCreateModalProps) {
    const [initialized, setInitialized] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        priority: 'medium',
        status: 'to_do',
        estimate: '',
        due_date: '',
        list_id: initialListId || lists[0]?.id || 0,
        assignee_ids: [] as number[],
        label_ids: [] as number[],
    });

    // When modal opens, set list_id to initialListId if provided
    // Only set on first open, not on every render
    if (open && initialListId && !initialized) {
        setData('list_id', initialListId);
        setInitialized(true);
    }
    if (!open && initialized) {
        setInitialized(false);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Prepare payload with correct types for backend
        const payload = {
            ...data,
            estimate: data.estimate === '' ? null : Number(data.estimate),
        };
        post(
            route('tasks.store', { project: project.id, board: lists.find(l => l.id === data.list_id)?.board_id, list: data.list_id }),
            {
                ...payload,
                onSuccess: () => {
                    reset();
                    onOpenChange(false);
                },
            }
        );
    };

    const handleClose = () => {
        reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader className="pb-3">
                    <DialogTitle className="text-lg flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create Task
                    </DialogTitle>
                    <DialogDescription>
                        Add a new task to your project
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-4">
                        <Label htmlFor="title" className="text-sm font-medium">Task Title</Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="Enter task title"
                            required
                        />
                        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                    </div>
                    <div className="space-y-4">
                        <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Describe the task..."
                            rows={2}
                        />
                        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Priority</Label>
                            <Select value={data.priority} onValueChange={(value: any) => setData('priority', value)}>
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
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Status</Label>
                            <Select value={data.status} onValueChange={(value: any) => setData('status', value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="to_do">To Do</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="done">Done</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">List/Column</Label>
                            <Select value={data.list_id.toString()} onValueChange={(value) => setData('list_id', parseInt(value))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {lists.map((list) => (
                                        <SelectItem key={list.id} value={list.id.toString()}>
                                            {list.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Due Date</Label>
                            <Input
                                id="due_date"
                                type="date"
                                value={data.due_date}
                                onChange={(e) => setData('due_date', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Estimate (hrs)</Label>
                            <Input
                                id="estimate"
                                type="number"
                                value={data.estimate}
                                onChange={(e) => setData('estimate', e.target.value)}
                                placeholder="0"
                                min="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Assignees</Label>
                            <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
                                <div className="space-y-2">
                                    {members.map((member) => (
                                        <div key={member.id} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id={`assignee-${member.id}`}
                                                checked={Array.isArray(data.assignee_ids) && data.assignee_ids.includes(member.id)}
                                                onChange={(e) => {
                                                    const ids = Array.isArray(data.assignee_ids) ? data.assignee_ids : [];
                                                    if (e.target.checked) {
                                                        setData('assignee_ids', [...ids, member.id] as number[]);
                                                    } else {
                                                        setData('assignee_ids', ids.filter((id: number) => id !== member.id) as number[]);
                                                    }
                                                }}
                                            />
                                            <Label htmlFor={`assignee-${member.id}`} className="text-sm cursor-pointer">
                                                {member.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Labels</Label>
                        <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
                            <div className="space-y-2">
                                {labels.map((label) => (
                                    <div key={label.id} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id={`label-${label.id}`}
                                            checked={Array.isArray(data.label_ids) && data.label_ids.includes(label.id)}
                                            onChange={(e) => {
                                                const ids = Array.isArray(data.label_ids) ? data.label_ids : [];
                                                if (e.target.checked) {
                                                    setData('label_ids', [...ids, label.id] as number[]);
                                                } else {
                                                    setData('label_ids', ids.filter((id: number) => id !== label.id) as number[]);
                                                }
                                            }}
                                        />
                                        <Label htmlFor={`label-${label.id}`} className="text-sm cursor-pointer flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: label.color }}
                                            />
                                            {label.name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Create Task
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
