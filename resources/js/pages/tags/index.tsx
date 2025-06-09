import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TagBadge } from '@/components/tag/TagBadge';
import { useTags } from '@/hooks/useTags';
import { Plus, Edit, Trash2, Tag as TagIcon } from 'lucide-react';

const DEFAULT_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
    '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
    '#ec4899', '#f43f5e', '#6b7280'
];

export default function TagsIndex() {
    const { tags, loading, error, createTag, updateTag, deleteTag } = useTags();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingTag, setEditingTag] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        color: DEFAULT_COLORS[0],
        description: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTag) {
                await updateTag(editingTag, formData);
                setEditingTag(null);
            } else {
                await createTag(formData.name, formData.color, formData.description);
                setShowCreateForm(false);
            }
            setFormData({ name: '', color: DEFAULT_COLORS[0], description: '' });
        } catch (err) {
            console.error('Failed to save tag:', err);
        }
    };

    const handleEdit = (tag: any) => {
        setEditingTag(tag.id);
        setFormData({
            name: tag.name,
            color: tag.color,
            description: tag.description || ''
        });
        setShowCreateForm(true);
    };

    const handleDelete = async (tagId: number) => {
        if (confirm('Are you sure you want to delete this tag?')) {
            try {
                await deleteTag(tagId);
            } catch (err) {
                console.error('Failed to delete tag:', err);
            }
        }
    };

    const handleCancel = () => {
        setShowCreateForm(false);
        setEditingTag(null);
        setFormData({ name: '', color: DEFAULT_COLORS[0], description: '' });
    };

    return (
        <AppLayout>
            <Head title="Tags" />
            
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Personal Tags</h1>
                        <p className="text-muted-foreground">
                            Manage your personal GTD context tags
                        </p>
                    </div>
                    <Button onClick={() => setShowCreateForm(true)} disabled={showCreateForm}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Tag
                    </Button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                {/* Create/Edit Form */}
                {showCreateForm && (
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {editingTag ? 'Edit Tag' : 'Create New Tag'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Tag name"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <Label htmlFor="description">Description (optional)</Label>
                                    <Input
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Tag description"
                                    />
                                </div>
                                
                                <div>
                                    <Label>Color</Label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {DEFAULT_COLORS.map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                className={`w-8 h-8 rounded-full border-2 ${
                                                    formData.color === color ? 'border-gray-900' : 'border-gray-300'
                                                }`}
                                                style={{ backgroundColor: color }}
                                                onClick={() => setFormData(prev => ({ ...prev, color }))}
                                            />
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="flex gap-2">
                                    <Button type="submit" disabled={loading}>
                                        {editingTag ? 'Update' : 'Create'} Tag
                                    </Button>
                                    <Button type="button" variant="outline" onClick={handleCancel}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Tags List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TagIcon className="h-5 w-5" />
                            Your Tags ({tags.length})
                        </CardTitle>
                        <CardDescription>
                            Personal tags for organizing your tasks using GTD contexts
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">Loading tags...</div>
                        ) : tags.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No tags yet. Create your first tag to get started!
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {tags.map(tag => (
                                    <div key={tag.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <TagBadge tag={tag} size="md" />
                                            {tag.description && (
                                                <span className="text-sm text-muted-foreground">
                                                    {tag.description}
                                                </span>
                                            )}
                                            {tag.is_default && (
                                                <Badge variant="outline" className="text-xs">
                                                    Default
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(tag)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(tag.id)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
