import React, { useState } from 'react';
import { Label as LabelType } from '@/types/project-manager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, Plus, Tag as TagIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LabelSelectorProps {
    selectedLabels: LabelType[];
    availableLabels: LabelType[];
    onLabelsChange: (labels: LabelType[]) => void;
    onCreateLabel?: (name: string, color: string) => Promise<LabelType>;
    placeholder?: string;
    disabled?: boolean;
    canManageLabels?: boolean;
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

export function LabelSelector({
    selectedLabels,
    availableLabels,
    onLabelsChange,
    onCreateLabel,
    placeholder = "Select labels...",
    disabled = false,
    canManageLabels = false
}: LabelSelectorProps) {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState(DEFAULT_COLORS[0]);

    const selectedLabelIds = selectedLabels.map(label => label.id);
    const unselectedLabels = availableLabels.filter(label => !selectedLabelIds.includes(label.id));

    const handleLabelToggle = (label: LabelType) => {
        if (selectedLabelIds.includes(label.id)) {
            onLabelsChange(selectedLabels.filter(l => l.id !== label.id));
        } else {
            onLabelsChange([...selectedLabels, label]);
        }
    };

    const handleRemoveLabel = (labelId: number) => {
        onLabelsChange(selectedLabels.filter(l => l.id !== labelId));
    };

    const handleCreateLabel = async () => {
        if (!newLabelName.trim() || !onCreateLabel) return;

        try {
            const newLabel = await onCreateLabel(newLabelName.trim(), newLabelColor);
            onLabelsChange([...selectedLabels, newLabel]);
            setNewLabelName('');
            setNewLabelColor(DEFAULT_COLORS[0]);
            setShowCreateForm(false);
            setSearchValue('');
        } catch (error) {
            console.error('Failed to create label:', error);
        }
    };

    const filteredLabels = unselectedLabels.filter(label =>
        label.name.toLowerCase().includes(searchValue.toLowerCase())
    );

    const canCreateNew = searchValue.trim() && 
        !availableLabels.some(label => label.name.toLowerCase() === searchValue.toLowerCase()) &&
        onCreateLabel && canManageLabels;

    return (
        <div className="space-y-2">
            <Label>Project Labels</Label>
            
            {/* Selected Labels */}
            {selectedLabels.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {selectedLabels.map(label => (
                        <div
                            key={label.id}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border"
                            style={{
                                backgroundColor: `${label.color}20`,
                                borderColor: label.color,
                                color: label.color
                            }}
                        >
                            <span>{label.name}</span>
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveLabel(label.id)}
                                    className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                                >
                                    <Check className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Label Selector */}
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
                            placeholder="Search labels..."
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
                                    "No labels found."
                                )}
                            </CommandEmpty>
                            
                            {filteredLabels.length > 0 && (
                                <CommandGroup>
                                    {filteredLabels.map(label => (
                                        <CommandItem
                                            key={label.id}
                                            onSelect={() => handleLabelToggle(label)}
                                            className="flex items-center gap-2"
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedLabelIds.includes(label.id) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <div
                                                className="inline-flex items-center gap-2 px-2 py-1 text-xs rounded-md border"
                                                style={{
                                                    backgroundColor: `${label.color}20`,
                                                    borderColor: label.color,
                                                    color: label.color
                                                }}
                                            >
                                                {label.name}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* Create Label Form */}
            {showCreateForm && canManageLabels && (
                <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium">Create New Label</h4>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCreateForm(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                    
                    <div>
                        <Label htmlFor="label-name">Name</Label>
                        <Input
                            id="label-name"
                            value={newLabelName}
                            onChange={(e) => setNewLabelName(e.target.value)}
                            placeholder="Label name"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleCreateLabel();
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
                                        newLabelColor === color ? 'border-gray-900' : 'border-gray-300'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setNewLabelColor(color)}
                                />
                            ))}
                        </div>
                    </div>
                    
                    <Button
                        onClick={handleCreateLabel}
                        disabled={!newLabelName.trim()}
                        className="w-full"
                    >
                        Create Label
                    </Button>
                </div>
            )}
        </div>
    );
}
