import { useState, useCallback, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { type SidebarPreferences, type SharedData, type NavGroup, type NavItem, type CustomNavGroup } from '@/types';

export function useSidebarPreferences() {
    const { auth } = usePage<SharedData>().props;
    const userPreferences = auth.user?.sidebar_preferences;

    // Default preferences when none exist
    const defaultPreferences = {
        collapsed_groups: [],
        custom_groups: [],
        group_order: [],
        hidden_items: []
    };



    const [collapsedGroups, setCollapsedGroups] = useState<string[]>(() => []);
    const [localCollapsedGroups, setLocalCollapsedGroups] = useState<string[]>(() => []);
    const [customGroups, setCustomGroups] = useState<CustomNavGroup[]>(() =>
        userPreferences?.custom_groups || defaultPreferences.custom_groups
    );
    const [groupOrder, setGroupOrder] = useState<string[]>(() =>
        userPreferences?.group_order || defaultPreferences.group_order
    );
    const [hiddenItems, setHiddenItems] = useState<string[]>(() =>
        userPreferences?.hidden_items || defaultPreferences.hidden_items
    );
    const [isLoading, setIsLoading] = useState(false);

    const toggleGroupCollapse = useCallback(async (groupTitle: string) => {
        const isCurrentlyCollapsed = localCollapsedGroups.includes(groupTitle);
        const newCollapsedGroups = isCurrentlyCollapsed
            ? localCollapsedGroups.filter(title => title !== groupTitle)
            : [...localCollapsedGroups, groupTitle];

        // Update local state immediately
        setLocalCollapsedGroups(newCollapsedGroups);

        // Update server in background
        setIsLoading(true);
        router.patch(route('sidebar-preferences.update'), {
            collapsed_groups: newCollapsedGroups
        }, {
            preserveState: true,
            preserveScroll: true,
            only: ['auth'],
            onSuccess: () => {
                // Update the main state after successful server update
                setCollapsedGroups(newCollapsedGroups);
            },
            onError: () => {
                // Revert local state on error
                setLocalCollapsedGroups(localCollapsedGroups);
            },
            onFinish: () => {
                setIsLoading(false);
            }
        });
    }, [localCollapsedGroups]);

    const isGroupCollapsed = useCallback((groupTitle: string) => {
        return localCollapsedGroups.includes(groupTitle);
    }, [localCollapsedGroups]);

    const resetPreferences = useCallback(async () => {
        setIsLoading(true);
        router.post(route('sidebar-preferences.reset'), {}, {
            preserveState: true,
            preserveScroll: true,
            only: ['auth'],
            onSuccess: () => {
                // Reset all state to defaults
                setCollapsedGroups(defaultPreferences.collapsed_groups);
                setLocalCollapsedGroups(defaultPreferences.collapsed_groups);
                setCustomGroups(defaultPreferences.custom_groups);
                setGroupOrder(defaultPreferences.group_order);
                setHiddenItems(defaultPreferences.hidden_items);
            },
            onFinish: () => {
                setIsLoading(false);
            }
        });
    }, []);

    const savePreferences = useCallback((preferences: Partial<SidebarPreferences>) => {
        setIsLoading(true);
        router.patch(route('sidebar-preferences.update'), preferences, {
            preserveState: true,
            preserveScroll: true,
            only: ['auth'],
            onFinish: () => {
                setIsLoading(false);
            }
        });
    }, []);

    const createCustomGroup = useCallback((title: string) => {
        const newGroup: CustomNavGroup = {
            id: `custom-${Date.now()}`,
            title,
            items: [],
            customizable: true,
            user_created: true,
            position: customGroups.length
        };

        const newCustomGroups = [...customGroups, newGroup];
        setCustomGroups(newCustomGroups);
        savePreferences({ custom_groups: newCustomGroups });
    }, [customGroups, savePreferences]);

    const deleteCustomGroup = useCallback((groupId: string) => {
        const newCustomGroups = customGroups.filter(group => group.id !== groupId);
        setCustomGroups(newCustomGroups);
        savePreferences({ custom_groups: newCustomGroups });
    }, [customGroups, savePreferences]);

    const renameGroup = useCallback((groupId: string, newTitle: string) => {
        const newCustomGroups = customGroups.map(group =>
            group.id === groupId ? { ...group, title: newTitle } : group
        );
        setCustomGroups(newCustomGroups);
        savePreferences({ custom_groups: newCustomGroups });
    }, [customGroups, savePreferences]);

    const moveItemToGroup = useCallback((itemId: string, fromGroupId: string, toGroupId: string, item: NavItem) => {
        // Only handle moving TO custom groups (target must be custom)
        // Remove from source custom group if it exists, add to target custom group
        const updatedCustomGroups = customGroups.map(group => {
            if (group.id === fromGroupId) {
                // Remove from source custom group
                return {
                    ...group,
                    items: group.items.filter(i => (i.id || i.href) !== itemId)
                };
            }
            if (group.id === toGroupId) {
                // Add to target custom group
                return {
                    ...group,
                    items: [...group.items, { ...item, user_created: true }]
                };
            }
            return group;
        });

        setCustomGroups(updatedCustomGroups);
        savePreferences({ custom_groups: updatedCustomGroups });
    }, [customGroups, savePreferences]);

    const reorderGroups = useCallback((newOrder: string[]) => {
        setGroupOrder(newOrder);
        savePreferences({ group_order: newOrder });
    }, [savePreferences]);

    const reorderItemsInGroup = useCallback((groupId: string, newItemOrder: NavItem[]) => {
        // Only handle custom groups for now, as default groups are read-only
        const updatedCustomGroups = customGroups.map(group => {
            if (group.id === groupId) {
                return {
                    ...group,
                    items: newItemOrder
                };
            }
            return group;
        });

        setCustomGroups(updatedCustomGroups);
        savePreferences({ custom_groups: updatedCustomGroups });
    }, [customGroups, savePreferences]);

    const hideItem = useCallback((itemId: string) => {
        const newHiddenItems = [...hiddenItems, itemId];
        setHiddenItems(newHiddenItems);
        savePreferences({ hidden_items: newHiddenItems });
    }, [hiddenItems, savePreferences]);

    const showItem = useCallback((itemId: string) => {
        const newHiddenItems = hiddenItems.filter(id => id !== itemId);
        setHiddenItems(newHiddenItems);
        savePreferences({ hidden_items: newHiddenItems });
    }, [hiddenItems, savePreferences]);

    return {
        collapsedGroups,
        customGroups,
        groupOrder,
        hiddenItems,
        isGroupCollapsed,
        toggleGroupCollapse,
        createCustomGroup,
        deleteCustomGroup,
        renameGroup,
        moveItemToGroup,
        reorderGroups,
        reorderItemsInGroup,
        hideItem,
        showItem,
        resetPreferences,
        isLoading
    };
}
