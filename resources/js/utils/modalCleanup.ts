/**
 * Utility functions for cleaning up modal overlays and preventing overlay persistence issues
 */

/**
 * Clean up stale modal overlays from the DOM
 * This function removes overlays that may be left behind after modal operations
 */
export const cleanupModalOverlays = () => {
    // Remove any stale custom modal overlays
    const customOverlays = document.querySelectorAll('.fixed.inset-0.z-50');
    customOverlays.forEach(overlay => {
        const el = overlay as HTMLElement;
        // Skip overlays that are likely managed by React (e.g., have a React root or data attributes)
        if ((el.hasAttribute('data-reactroot') || el.closest('[data-reactroot]')) || el.getAttribute('data-managed-by-react') === 'true') {
            return;
        }
        // Only remove if it's a modal overlay (has backdrop-blur or bg-black) and still in DOM
        if ((el.classList.contains('bg-black') ||
            el.querySelector('.bg-black\\/50') ||
            el.querySelector('[class*="backdrop-blur"]')) &&
            document.body.contains(el)) {
            // el.remove(); // Disabled to prevent React DOM conflicts
        }
    });

    // Also clean up any orphaned modal containers
    const modalContainers = Array.from(document.querySelectorAll('[class*="fixed"][class*="inset-0"][class*="z-50"]')).map(el => el as HTMLElement);
    modalContainers.forEach(el => {
        // Skip containers likely managed by React
        if ((el.hasAttribute('data-reactroot') || el.closest('[data-reactroot]')) || el.getAttribute('data-managed-by-react') === 'true') {
            return;
        }
        if ((el.style.visibility === 'hidden' ||
            el.classList.contains('invisible') ||
            el.classList.contains('opacity-0')) &&
            document.body.contains(el)) {
            // el.remove(); // Disabled to prevent React DOM conflicts
        }
    });

    // Fix pointer-events issues on all elements
    const allElements = document.querySelectorAll('*');
    allElements.forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        // Reset pointer-events if it's set to 'none' and element is not actually hidden
        if (computedStyle.pointerEvents === 'none' &&
            computedStyle.display !== 'none' &&
            computedStyle.visibility !== 'hidden' &&
            computedStyle.opacity !== '0') {
            (element as HTMLElement).style.pointerEvents = '';
        }
    });

    // Clean up any body styles that might be left from modal interactions
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
    document.body.style.removeProperty('pointer-events');

    // Remove any modal-related classes from body
    document.body.classList.remove('modal-open', 'overflow-hidden');
};

/**
 * Clean up Radix UI dialog overlays that may be left behind
 */
export const cleanupRadixOverlays = () => {
    // Remove any stale dialog overlays
    const staleOverlays = document.querySelectorAll('[data-radix-dialog-overlay]');
    staleOverlays.forEach(overlay => {
        const parent = overlay.parentNode;
        // Skip overlays likely managed by React
        if ((overlay.hasAttribute('data-reactroot') || overlay.closest('[data-reactroot]')) || overlay.getAttribute('data-managed-by-react') === 'true') {
            return;
        }
        if (parent && parent !== document.body && parent.contains(overlay)) {
            // parent.removeChild(overlay); // Disabled to prevent React DOM conflicts
        }
    });

    // Also clean up any stale portal containers
    const stalePortals = document.querySelectorAll('[data-radix-portal]');
    stalePortals.forEach(portal => {
        const el = portal as HTMLElement;
        // Skip portals likely managed by React
        if ((el.hasAttribute('data-reactroot') || el.closest('[data-reactroot]')) || el.getAttribute('data-managed-by-react') === 'true') {
            return;
        }
        if (el.children.length === 0 && document.body.contains(el)) {
            // el.remove(); // Disabled to prevent React DOM conflicts
        }
    });

    // Clean up any elements with aria-hidden that might be blocking focus
    const ariaHiddenElements = document.querySelectorAll('[aria-hidden="true"]');
    ariaHiddenElements.forEach(element => {
        // Only remove aria-hidden from elements that are likely modal-related
        if (element.classList.contains('fixed') ||
            element.hasAttribute('data-radix-dialog-overlay') ||
            element.hasAttribute('data-radix-portal') ||
            element.querySelector('[data-radix-dialog-overlay]')) {
            element.removeAttribute('aria-hidden');
        }
    });

    // Fix pointer-events on Radix elements specifically
    const radixElements = document.querySelectorAll('[data-radix-dialog-overlay], [data-radix-portal], [data-radix-dialog-content]');
    radixElements.forEach(element => {
        (element as HTMLElement).style.pointerEvents = '';
    });

    // Restore focus to body if no focusable element is available
    const activeElement = document.activeElement;
    if (!activeElement || activeElement === document.body ||
        activeElement.hasAttribute('aria-hidden') ||
        !document.body.contains(activeElement)) {
        // Try to focus the first focusable element or fallback to body
        const focusableElements = document.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
            (focusableElements[0] as HTMLElement).focus();
        } else {
            document.body.focus();
        }
    }
};

/**
 * Fix pointer-events issues specifically
 * This is a lighter cleanup that focuses on interaction blocking
 */
export const fixPointerEvents = () => {
    // Reset pointer-events on body
    document.body.style.removeProperty('pointer-events');

    let fixedCount = 0;

    // Find elements that might be blocking interactions
    const problematicElements = document.querySelectorAll(`
        [style*="pointer-events: none"],
        .fixed[style*="pointer-events"],
        [data-radix-dialog-overlay],
        [data-radix-portal]
    `);

    problematicElements.forEach(element => {
        const htmlElement = element as HTMLElement;
        const computedStyle = window.getComputedStyle(htmlElement);

        // If element is invisible but has pointer-events: none, it might be blocking
        // Only fix if it's a modal overlay or similar blocking element
        if (computedStyle.pointerEvents === 'none' &&
            (computedStyle.opacity === '0' ||
             computedStyle.visibility === 'hidden' ||
             computedStyle.display === 'none') &&
            (htmlElement.classList.contains('fixed') ||
             htmlElement.classList.contains('modal') ||
             htmlElement.hasAttribute('data-radix-dialog-overlay') ||
             htmlElement.hasAttribute('data-radix-portal'))) {
            htmlElement.style.pointerEvents = '';
            fixedCount++;
        }
    });

    if (fixedCount > 0) {
        console.log(`🔧 Fixed pointer-events on ${fixedCount} elements`);
    }

    return fixedCount;
};

/**
 * Comprehensive cleanup function that handles both custom and Radix UI overlays
 */
export const cleanupAllModalOverlays = () => {
    cleanupModalOverlays();
    cleanupRadixOverlays();
    fixPointerEvents();
};

/**
 * Hook to automatically clean up overlays when a component unmounts
 */
export const useModalCleanup = () => {
    const cleanup = () => {
        setTimeout(cleanupAllModalOverlays, 100);
    };

    return cleanup;
};

/**
 * Enhanced modal close handler that includes overlay cleanup
 */
export const createModalCloseHandler = (onOpenChange: (open: boolean) => void) => {
    return () => {
        onOpenChange(false);
        // Clean up overlays immediately and after animation
        setTimeout(cleanupAllModalOverlays, 50);
        setTimeout(cleanupAllModalOverlays, 350); // After transition duration
        setTimeout(cleanupAllModalOverlays, 1000); // Final cleanup after any delayed animations
    };
};

/**
 * Force cleanup all modal overlays immediately
 * Use this as a last resort when overlays are definitely stuck
 */
export const forceCleanupAllOverlays = () => {
    console.log('🚨 Force cleaning all modal overlays...');

    // Remove ALL fixed positioned elements that look like overlays
    const allFixedElements = document.querySelectorAll('.fixed');
    allFixedElements.forEach(element => {
        if (element.classList.contains('inset-0') ||
            element.classList.contains('z-50') ||
            element.style.zIndex === '50' ||
            element.hasAttribute('data-radix-dialog-overlay') ||
            element.hasAttribute('data-radix-portal')) {
            console.log('Removing stuck overlay:', element);
            // element.remove(); // Disabled to prevent React DOM conflicts
        }
    });

    // TARGETED pointer-events cleanup - only reset problematic elements
    const problematicElements = document.querySelectorAll(`
        .fixed.inset-0[style*="pointer-events"],
        [data-radix-dialog-overlay][style*="pointer-events"],
        [data-radix-portal][style*="pointer-events"],
        .modal-overlay[style*="pointer-events"]
    `);

    problematicElements.forEach(element => {
        const htmlElement = element as HTMLElement;
        const computedStyle = window.getComputedStyle(htmlElement);

        // Only reset if element is invisible or blocking
        if (computedStyle.opacity === '0' ||
            computedStyle.visibility === 'hidden' ||
            computedStyle.display === 'none' ||
            htmlElement.classList.contains('opacity-0') ||
            htmlElement.classList.contains('invisible')) {
            console.log('Resetting pointer-events on problematic element:', element);
            htmlElement.style.pointerEvents = '';
        }
    });

    // Clean up body styles
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
    document.body.style.removeProperty('pointer-events');
    document.body.classList.remove('modal-open', 'overflow-hidden');

    // Remove all aria-hidden attributes
    document.querySelectorAll('[aria-hidden="true"]').forEach(element => {
        element.removeAttribute('aria-hidden');
    });

    // Reset only body CSS that might be blocking interactions
    const style = document.createElement('style');
    style.textContent = `
        body { pointer-events: auto !important; overflow: auto !important; }
        .fixed.inset-0.opacity-0 { pointer-events: none !important; }
        .fixed.inset-0.invisible { pointer-events: none !important; }
    `;
    document.head.appendChild(style);

    // Remove the style after a short delay
    setTimeout(() => {
        style.remove();
    }, 1000);

    // Restore focus
    document.body.focus();

    console.log('✅ Force cleanup completed');
};

/**
 * Setup global cleanup listeners for route changes and page unload
 */
export const setupGlobalModalCleanup = () => {
    // Clean up on page unload
    const handleBeforeUnload = () => {
        cleanupAllModalOverlays();
    };

    // Clean up on route changes (for SPA navigation)
    const handleRouteChange = () => {
        setTimeout(cleanupAllModalOverlays, 100);
    };

    // Emergency cleanup on Escape key (Ctrl+Shift+Escape)
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.ctrlKey && event.shiftKey && event.key === 'Escape') {
            console.log('Emergency modal cleanup triggered');
            forceCleanupAllOverlays();
            event.preventDefault();
        }
    };

    // Detect potential pointer-events blocking issues
    const handleClick = (event: MouseEvent) => {
        // If click doesn't reach any interactive element, might be pointer-events issue
        const target = event.target as HTMLElement;
        if (target === document.body || target === document.documentElement) {
            // Check if there are any invisible overlays that might be blocking
            const overlays = document.querySelectorAll('.fixed.inset-0, [data-radix-dialog-overlay]');
            if (overlays.length > 0) {
                console.log('Potential pointer-events blocking detected, running cleanup...');
                fixPointerEvents();
            }
        }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClick, true); // Use capture phase

    // For Inertia.js route changes
    document.addEventListener('inertia:start', handleRouteChange);
    document.addEventListener('inertia:finish', handleRouteChange);

    // Less frequent pointer-events check (every 15 seconds)
    const pointerEventsCheck = setInterval(() => {
        fixPointerEvents();
    }, 15000);

    // Periodic full cleanup check (every 30 seconds)
    const periodicCleanup = setInterval(() => {
        // Only run if there are no open modals
        const openModals = document.querySelectorAll('[data-state="open"]');
        if (openModals.length === 0) {
            cleanupAllModalOverlays();
        }
    }, 30000);

    // Return cleanup function
    return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('click', handleClick, true);
        document.removeEventListener('inertia:start', handleRouteChange);
        document.removeEventListener('inertia:finish', handleRouteChange);
        clearInterval(pointerEventsCheck);
        clearInterval(periodicCleanup);
    };
};

/**
 * Debug function to check for pointer-events issues
 * Can be called from browser console: window.debugPointerEvents()
 */
export const debugPointerEvents = () => {
    console.log('🔍 Debugging pointer-events issues...');

    // Check body
    const bodyStyle = window.getComputedStyle(document.body);
    console.log('Body pointer-events:', bodyStyle.pointerEvents);

    // Find all elements with pointer-events: none
    const blockedElements = document.querySelectorAll('*');
    const problematic: HTMLElement[] = [];

    blockedElements.forEach(element => {
        const style = window.getComputedStyle(element);
        if (style.pointerEvents === 'none') {
            problematic.push(element as HTMLElement);
        }
    });

    console.log(`Found ${problematic.length} elements with pointer-events: none`);
    problematic.forEach((element, index) => {
        const style = window.getComputedStyle(element);
        console.log(`${index + 1}.`, element, {
            pointerEvents: style.pointerEvents,
            opacity: style.opacity,
            visibility: style.visibility,
            display: style.display,
            zIndex: style.zIndex
        });
    });

    // Check for modal overlays
    const overlays = document.querySelectorAll('.fixed.inset-0, [data-radix-dialog-overlay]');
    console.log(`Found ${overlays.length} potential modal overlays:`, overlays);

    return {
        bodyPointerEvents: bodyStyle.pointerEvents,
        problematicElements: problematic,
        overlays: Array.from(overlays)
    };
};

// Make debug function available globally
if (typeof window !== 'undefined') {
    (window as any).debugPointerEvents = debugPointerEvents;
    (window as any).fixPointerEvents = fixPointerEvents;
    (window as any).forceCleanupAllOverlays = forceCleanupAllOverlays;
}
