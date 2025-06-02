import { type NavItem, type NavGroup, type CustomNavGroup } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, GripVertical, MoreHorizontal } from 'lucide-react';
import { useSidebarPreferences } from '@/hooks/use-sidebar-preferences';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    CollisionDetection
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface CustomizableNavMainProps {
    groups?: NavGroup[];
    items?: NavItem[];
    collapsed?: boolean;
    customizationMode?: boolean;
}

interface DragItem {
    id: string;
    type: 'group' | 'item';
    data: NavGroup | NavItem;
}

// Sortable Group Component
function SortableGroup({
    group,
    collapsed,
    customizationMode,
    onRename,
    onDelete
}: {
    group: NavGroup;
    collapsed: boolean;
    customizationMode: boolean;
    onRename: (groupId: string, newTitle: string) => void;
    onDelete: (groupId: string) => void;
}) {
    const { isGroupCollapsed, toggleGroupCollapse } = useSidebarPreferences();
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(group.title);
    const [isToggling, setIsToggling] = useState(false);

    const {
        attributes,
        listeners,
        setNodeRef: setSortableNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `group-${group.id}`,
        data: {
            type: 'group',
            group,
        },
        disabled: !customizationMode,
    });

    const {
        setNodeRef: setDroppableNodeRef,
        isOver,
    } = useDroppable({
        id: `group-${group.id}`,
        data: {
            type: 'group',
            group,
        },
    });

    // Combine refs
    const setNodeRef = (node: HTMLElement | null) => {
        setSortableNodeRef(node);
        setDroppableNodeRef(node);
    };

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const isCollapsed = isGroupCollapsed(group.title);
    const customizable = group.customizable !== false;





    const handleRename = () => {
        if (editTitle.trim() && editTitle !== group.title) {
            onRename(group.id!, editTitle.trim());
        }
        setIsEditing(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleRename();
        } else if (e.key === 'Escape') {
            setEditTitle(group.title);
            setIsEditing(false);
        }
    };

    return (
        <div ref={setNodeRef} style={style} className={`${collapsed ? "mb-6" : "mb-4"} hover-isolate ${
            isOver && customizationMode ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50/10 rounded-lg' : ''
        }`}>
            <div className={`${collapsed ? 'sr-only' : 'flex items-center justify-between mb-2 px-2'}`}>
                <div className="flex items-center gap-2 flex-1">
                    {customizationMode && (
                        <div
                            {...attributes}
                            {...listeners}
                            className="cursor-grab active:cursor-grabbing p-1 hover:bg-sidebar-accent/30 rounded"
                            title="Drag to reorder group"
                        >
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
                    )}

                    {isEditing ? (
                        <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={handleKeyPress}
                            className="h-6 text-xs font-medium"
                            autoFocus
                        />
                    ) : (
                        <span className="text-xs font-medium text-sidebar-foreground/60">
                            {group.title}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1" style={{ pointerEvents: 'auto' }}>
                    {!collapsed && customizable && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-1 hover:bg-sidebar-accent/50 flex-shrink-0 z-10 relative"
                            onClick={async (e) => {
                                if (isToggling) {
                                    return;
                                }

                                e.preventDefault();
                                e.stopPropagation();

                                setIsToggling(true);
                                try {
                                    await toggleGroupCollapse(group.title);
                                } finally {
                                    setTimeout(() => setIsToggling(false), 300);
                                }
                            }}
                            style={{ pointerEvents: 'auto' }}
                        >
                            {isCollapsed ? (
                                <ChevronRight className="h-3 w-3" />
                            ) : (
                                <ChevronDown className="h-3 w-3" />
                            )}
                        </Button>
                    )}

                    {customizationMode && group.user_created && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 hover:bg-sidebar-accent/50"
                                >
                                    <MoreHorizontal className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onDelete(group.id!)}
                                    className="text-red-600"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            <div className={`transition-all duration-200 ease-in-out ${
                isCollapsed && !collapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-none opacity-100'
            }`}>
                <nav className="hover-isolate">
                    <ul className={`${collapsed ? "space-y-2" : "space-y-1"} no-hover-inherit`}>
                        {group.items.map((item) => (
                            <SortableItem
                                key={item.id || item.href}
                                item={item}
                                collapsed={collapsed}
                                customizationMode={customizationMode}
                                groupId={group.id}
                                isUserCreatedGroup={group.user_created}
                            />
                        ))}
                    </ul>
                </nav>
            </div>
        </div>
    );
}

// Sortable Item Component
function SortableItem({
    item,
    collapsed,
    customizationMode,
    groupId,
    isUserCreatedGroup = false
}: {
    item: NavItem;
    collapsed: boolean;
    customizationMode: boolean;
    groupId?: string;
    isUserCreatedGroup?: boolean;
}) {
    const page = usePage();

    // Items can be dragged if in customization mode
    // This allows moving items from default groups to custom groups
    const canDrag = customizationMode;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `item-${item.id || item.href}`,
        data: {
            type: 'item',
            item,
            groupId,
        },
        disabled: !canDrag,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Check if the current URL starts with the item's href
    const isActive = (href: string) => {
        const currentUrl = String(page.url);
        const itemHref = String(href);
        return currentUrl === itemHref || (itemHref !== '/' && currentUrl.startsWith(itemHref));
    };

    const active = isActive(item.href);

    const NavLink = (
        <div className={`nav-item flex items-center rounded-lg text-sm font-medium transition-all duration-200 ease-out relative overflow-hidden ${
            active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground hover:shadow-sm hover:scale-[1.02]'
        } ${collapsed ? 'justify-center px-2 py-2 w-12 h-12 mx-auto' : 'px-3 py-2.5'} ${
            canDrag && customizationMode ? 'border border-dashed border-blue-300/30 bg-blue-50/5' : ''
        }`}>
            {canDrag && !collapsed && (
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing mr-2 flex-shrink-0 p-1 hover:bg-sidebar-accent/30 rounded"
                    title="Drag to move item"
                >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
            )}
            <Link
                href={item.href}
                prefetch
                className="flex items-center flex-1 min-w-0"
            >
                {item.icon && (
                    <item.icon className="flex-shrink-0 h-5 w-5 transition-transform duration-200 ease-out" />
                )}
                {!collapsed && (
                    <span className="ml-3 truncate transition-all duration-200 ease-out">{item.title}</span>
                )}
            </Link>
        </div>
    );

    return (
        <li ref={setNodeRef} style={style} className="no-hover-inherit">
            {collapsed ? (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            {NavLink}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                            {item.title}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ) : (
                NavLink
            )}
        </li>
    );
}

export function CustomizableNavMain({ groups = [], items = [], collapsed = false, customizationMode = false }: CustomizableNavMainProps) {
    const {
        customGroups,
        groupOrder,
        createCustomGroup,
        deleteCustomGroup,
        renameGroup,
        reorderGroups,
        reorderItemsInGroup,
        moveItemToGroup
    } = useSidebarPreferences();

    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeItem, setActiveItem] = useState<DragItem | null>(null);
    const [newGroupName, setNewGroupName] = useState('');
    const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Custom collision detection that handles both items and groups
    const customCollisionDetection: CollisionDetection = (args) => {
        const { active, droppableContainers } = args;

        // Use default collision detection for all cases
        // This allows items to be dropped on other items or groups
        return closestCenter(args);
    };

    // Combine default groups with custom groups
    const allGroups = useMemo(() => {
        const defaultGroups = groups.map(group => ({ ...group, user_created: false }));
        const userGroups = customGroups.map(group => ({ ...group, user_created: true }));
        const combined = [...defaultGroups, ...userGroups];

        // Apply custom ordering if it exists
        if (groupOrder.length > 0) {
            return combined.sort((a, b) => {
                const aIndex = groupOrder.indexOf(a.id!);
                const bIndex = groupOrder.indexOf(b.id!);
                if (aIndex === -1 && bIndex === -1) return 0;
                if (aIndex === -1) return 1;
                if (bIndex === -1) return -1;
                return aIndex - bIndex;
            });
        }

        return combined.sort((a, b) => (a.position || 0) - (b.position || 0));
    }, [groups, customGroups, groupOrder]);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;

        setActiveId(active.id as string);

        // Create proper drag item data
        const dragData = active.data.current;
        if (dragData) {
            setActiveItem({
                id: active.id as string,
                type: dragData.type,
                data: dragData.type === 'group' ? dragData.group : dragData.item
            });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            setActiveItem(null);
            return;
        }

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId !== overId) {
            // Handle group reordering
            if (activeId.startsWith('group-') && overId.startsWith('group-')) {
                const activeIndex = allGroups.findIndex(group => `group-${group.id}` === activeId);
                const overIndex = allGroups.findIndex(group => `group-${group.id}` === overId);

                if (activeIndex !== -1 && overIndex !== -1) {
                    const newGroups = arrayMove(allGroups, activeIndex, overIndex);
                    const newOrder = newGroups.map(group => group.id!);
                    reorderGroups(newOrder);
                }
            }
            // Handle item moving between groups or within groups
            else if (activeId.startsWith('item-')) {
                const activeItemId = activeId.replace('item-', '');

                // Get source group from drag data if available
                const dragData = active.data.current;
                let sourceGroupId = dragData?.groupId;

                // Find the active item and its current group if not in drag data
                let activeItem: NavItem | null = null;

                if (!sourceGroupId) {
                    for (const group of allGroups) {
                        const item = group.items.find(i => (i.id || i.href) === activeItemId);
                        if (item) {
                            activeItem = item;
                            sourceGroupId = group.id!;
                            break;
                        }
                    }
                } else {
                    // Find the item in the specified source group
                    const sourceGroup = allGroups.find(g => g.id === sourceGroupId);
                    if (sourceGroup) {
                        activeItem = sourceGroup.items.find(i => (i.id || i.href) === activeItemId) || null;
                    }
                }

                if (!activeItem || !sourceGroupId) return;

                // Determine target group
                let targetGroupId: string | null = null;
                let targetIndex: number = -1;

                if (overId.startsWith('group-')) {
                    // Dropped on a group - add to end of that group
                    targetGroupId = overId.replace('group-', '');
                    const targetGroup = allGroups.find(g => g.id === targetGroupId);
                    targetIndex = targetGroup ? targetGroup.items.length : 0;
                } else if (overId.startsWith('item-')) {
                    // Dropped on another item - find the group and position
                    const overItemId = overId.replace('item-', '');

                    for (const group of allGroups) {
                        const itemIndex = group.items.findIndex(i => (i.id || i.href) === overItemId);
                        if (itemIndex !== -1) {
                            targetGroupId = group.id!;
                            targetIndex = itemIndex;
                            break;
                        }
                    }
                }

                if (targetGroupId && targetIndex !== -1) {
                    const sourceGroup = allGroups.find(g => g.id === sourceGroupId);
                    const targetGroup = allGroups.find(g => g.id === targetGroupId);

                    if (sourceGroupId === targetGroupId) {
                        // Reordering within the same group (only for custom groups)
                        if (sourceGroup && sourceGroup.user_created) {
                            const sourceIndex = sourceGroup.items.findIndex(i => (i.id || i.href) === activeItemId);
                            if (sourceIndex !== -1 && sourceIndex !== targetIndex) {
                                const newItems = arrayMove(sourceGroup.items, sourceIndex, targetIndex);
                                reorderItemsInGroup(sourceGroupId, newItems);
                            }
                        }
                    } else {
                        // Moving between different groups (target must be custom)
                        if (targetGroup && targetGroup.user_created) {
                            moveItemToGroup(activeItemId, sourceGroupId, targetGroupId, activeItem);
                        }
                    }
                }
            }
        }

        setActiveId(null);
        setActiveItem(null);
    };

    const handleCreateGroup = () => {
        if (newGroupName.trim()) {
            createCustomGroup(newGroupName.trim());
            setNewGroupName('');
            setShowNewGroupDialog(false);
        }
    };

    // If using the old items prop (for backward compatibility)
    if (items.length > 0) {
        return (
            <div className={`${collapsed ? "px-1 py-2" : "px-2 py-2"} hover-isolate`}>
                <div className={`${collapsed ? 'sr-only' : 'text-xs font-medium text-sidebar-foreground/60 mb-2 px-2'}`}>
                    Platform
                </div>
                <nav className="hover-isolate">
                    <ul className={`${collapsed ? "space-y-2" : "space-y-1"} no-hover-inherit`}>
                        {items.map((item) => (
                            <SortableItem
                                key={item.id || item.href}
                                item={item}
                                collapsed={collapsed}
                                customizationMode={customizationMode}
                                isUserCreatedGroup={false}
                            />
                        ))}
                    </ul>
                </nav>
            </div>
        );
    }

    // Create combined sortable items (groups + all items)
    const allSortableItems = useMemo(() => {
        const groupIds = allGroups.map(group => `group-${group.id}`);
        const itemIds = allGroups.flatMap(group =>
            group.items.map(item => `item-${item.id || item.href}`)
        );
        return [...groupIds, ...itemIds];
    }, [allGroups]);

    return (
        <div className={`${collapsed ? "px-1 py-2" : "px-2 py-2"} hover-isolate`}>
            <DndContext
                sensors={sensors}
                collisionDetection={customCollisionDetection}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
            >
                <SortableContext
                    items={allSortableItems}
                    strategy={verticalListSortingStrategy}
                >
                    {allGroups.map((group, groupIndex) => (
                        <SortableGroup
                            key={group.id}
                            group={group}
                            collapsed={collapsed}
                            customizationMode={customizationMode}
                            onRename={renameGroup}
                            onDelete={deleteCustomGroup}
                        />
                    ))}
                </SortableContext>

                <DragOverlay>
                    {activeItem && (
                        <div className="bg-sidebar border rounded-lg p-2 shadow-lg opacity-90">
                            {activeItem.type === 'group' ? (
                                <span className="text-xs font-medium">{(activeItem.data as NavGroup).title}</span>
                            ) : (
                                <div className="flex items-center">
                                    {(activeItem.data as NavItem).icon && (() => {
                                        const IconComponent = (activeItem.data as NavItem).icon!;
                                        return <IconComponent className="h-4 w-4 mr-2" />;
                                    })()}
                                    <span className="text-sm font-medium">{(activeItem.data as NavItem).title}</span>
                                </div>
                            )}
                        </div>
                    )}
                </DragOverlay>
            </DndContext>

            {customizationMode && !collapsed && (
                <div className="mt-4 px-2">
                    <Dialog open={showNewGroupDialog} onOpenChange={setShowNewGroupDialog}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Group
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Group</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <Input
                                    placeholder="Group name"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleCreateGroup();
                                        }
                                    }}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setShowNewGroupDialog(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
                                        Create
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </div>
    );
}
