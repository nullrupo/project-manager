// Custom events for favorites system
export const FAVORITES_EVENTS = {
    TOGGLE: 'favorites:toggle',
    UPDATED: 'favorites:updated'
} as const;

export interface FavoriteToggleEvent {
    type: 'project' | 'task';
    id: number;
    isFavorited: boolean;
}

export interface FavoriteUpdatedEvent {
    type: 'project' | 'task';
    id: number;
    isFavorited: boolean;
}

// Dispatch a favorite toggle event
export function dispatchFavoriteToggle(data: FavoriteToggleEvent) {
    window.dispatchEvent(new CustomEvent(FAVORITES_EVENTS.TOGGLE, { detail: data }));
}

// Dispatch a favorite updated event
export function dispatchFavoriteUpdated(data: FavoriteUpdatedEvent) {
    window.dispatchEvent(new CustomEvent(FAVORITES_EVENTS.UPDATED, { detail: data }));
}

// Listen for favorite events
export function onFavoriteToggle(callback: (data: FavoriteToggleEvent) => void) {
    const handler = (event: CustomEvent<FavoriteToggleEvent>) => {
        callback(event.detail);
    };
    
    window.addEventListener(FAVORITES_EVENTS.TOGGLE, handler as EventListener);
    
    return () => {
        window.removeEventListener(FAVORITES_EVENTS.TOGGLE, handler as EventListener);
    };
}

// Listen for favorite updated events
export function onFavoriteUpdated(callback: (data: FavoriteUpdatedEvent) => void) {
    const handler = (event: CustomEvent<FavoriteUpdatedEvent>) => {
        callback(event.detail);
    };
    
    window.addEventListener(FAVORITES_EVENTS.UPDATED, handler as EventListener);
    
    return () => {
        window.removeEventListener(FAVORITES_EVENTS.UPDATED, handler as EventListener);
    };
}
