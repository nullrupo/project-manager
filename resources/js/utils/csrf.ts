/**
 * CSRF token management utilities
 */

let currentCsrfToken: string | null = null;

/**
 * Get the current CSRF token from meta tag or cached value
 */
export const getCsrfToken = (): string => {
    if (!currentCsrfToken) {
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        currentCsrfToken = metaTag?.getAttribute('content') || '';
    }
    return currentCsrfToken;
};

/**
 * Refresh CSRF token from server
 */
export const refreshCsrfToken = async (): Promise<string> => {
    try {
        const response = await fetch('/csrf-token', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (response.ok) {
            const data = await response.json();
            currentCsrfToken = data.csrf_token;
            
            // Update meta tag
            const metaTag = document.querySelector('meta[name="csrf-token"]');
            if (metaTag) {
                metaTag.setAttribute('content', currentCsrfToken);
            }
            
            return currentCsrfToken;
        }
    } catch (error) {
        console.error('Failed to refresh CSRF token:', error);
    }
    
    return getCsrfToken(); // Fallback to current token
};

/**
 * Make a fetch request with automatic CSRF token refresh on 419 errors
 */
export const fetchWithCsrf = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const makeRequest = async (csrfToken: string): Promise<Response> => {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
            ...options.headers,
        };

        return fetch(url, {
            ...options,
            headers,
        });
    };

    // First attempt with current token
    let response = await makeRequest(getCsrfToken());

    // If we get a 419 (CSRF token mismatch), refresh token and retry once
    if (response.status === 419) {
        console.log('CSRF token mismatch, refreshing token and retrying...');
        const newToken = await refreshCsrfToken();
        response = await makeRequest(newToken);
    }

    return response;
};
