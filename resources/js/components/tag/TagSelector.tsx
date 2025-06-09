import React, { useState, useEffect } from 'react';
import { Tag } from '@/types/project-manager';
import { TagBadge } from './TagBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, Plus, Tag as TagIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagSelectorProps {
    selectedTags: Tag[];
    availableTags: Tag[];
    onTagsChange: (tags: Tag[]) => void;
    onCreateTag?: (name: string, color: string) => Promise<Tag>;
    placeholder?: string;
    disabled?: boolean;
}

const DEFAULT_COLORS = [
    '#ef4444', // red
    '#f97316', // orange
    '#f59e0b', // amber
    '#eab308', // yellow
    '#84cc16', // lime
    '#22c55e', // green
    '#10b981', // emerald
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#a855f7', // purple
    '#ec4899', // pink
    '#f43f5e', // rose
    '#6b7280', // gray
];

export function TagSelector({
    selectedTags,
    availableTags,
    onTagsChange,
    onCreateTag,
    placeholder = "Select tags...",
    disabled = false
}: TagSelectorProps) {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState(DEFAULT_COLORS[0]);

    const selectedTagIds = selectedTags.map(tag => tag.id);
    const unselectedTags = availableTags.filter(tag => !selectedTagIds.includes(tag.id));

    const handleTagToggle = (tag: Tag) => {
        if (selectedTagIds.includes(tag.id)) {
            onTagsChange(selectedTags.filter(t => t.id !== tag.id));
        } else {
            onTagsChange([...selectedTags, tag]);
        }
    };

    const handleRemoveTag = (tagId: number) => {
        onTagsChange(selectedTags.filter(t => t.id !== tagId));
    };

    const handleCreateTag = async () => {
        if (!newTagName.trim() || !onCreateTag) return;

        try {
            const newTag = await onCreateTag(newTagName.trim(), newTagColor);
            onTagsChange([...selectedTags, newTag]);
            setNewTagName('');
            setNewTagColor(DEFAULT_COLORS[0]);
            setShowCreateForm(false);
            setSearchValue('');
        } catch (error) {
            console.error('Failed to create tag:', error);
        }
    };

    const filteredTags = unselectedTags.filter(tag =>
        tag.name.toLowerCase().includes(searchValue.toLowerCase())
    );

    const canCreateNew = searchValue.trim() && 
        !availableTags.some(tag => tag.name.toLowerCase() === searchValue.toLowerCase()) &&
        onCreateTag;

    return (
        <div className="space-y-2">
            <Label>Tags</Label>
            
            {/* Selected Tags */}
            {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {selectedTags.map(tag => (
                        <TagBadge
                            key={tag.id}
                            tag={tag}
                            removable={!disabled}
                            onRemove={() => handleRemoveTag(tag.id)}
                        />
                    ))}
                </div>
            )}

            {/* Tag Selector */}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-start"
                        disabled={disabled}
                    >
                        <TagIcon className="mr-2 h-4 w-4" />
                        {placeholder}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                    <Command>
                        <CommandInput
                            placeholder="Search tags..."
                            value={searchValue}
                            onValueChange={setSearchValue}
                        />
                        <CommandList>
                            <CommandEmpty>
                                {canCreateNew ? (
                                    <div className="p-2">
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start"
                                            onClick={() => setShowCreateForm(true)}
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create "{searchValue}"
                                        </Button>
                                    </div>
                                ) : (
                                    "No tags found."
                                )}
                            </CommandEmpty>
                            
                            {filteredTags.length > 0 && (
                                <CommandGroup>
                                    {filteredTags.map(tag => (
                                        <CommandItem
                                            key={tag.id}
                                            onSelect={() => handleTagToggle(tag)}
                                            className="flex items-center gap-2"
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedTagIds.includes(tag.id) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <TagBadge tag={tag} />
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* Create Tag Form */}
            {showCreateForm && (
                <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium">Create New Tag</h4>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCreateForm(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                    
                    <div>
                        <Label htmlFor="tag-name">Name</Label>
                        <Input
                            id="tag-name"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            placeholder="Tag name"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleCreateTag();
                                }
                            }}
                        />
                    </div>
                    
                    <div>
                        <Label>Color</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {DEFAULT_COLORS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`w-6 h-6 rounded-full border-2 ${
                                        newTagColor === color ? 'border-gray-900' : 'border-gray-300'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setNewTagColor(color)}
                                />
                            ))}
                        </div>
                    </div>
                    
                    <Button
                        onClick={handleCreateTag}
                        disabled={!newTagName.trim()}
                        className="w-full"
                    >
                        Create Tag
                    </Button>
                </div>
            )}
        </div>
    );
}
