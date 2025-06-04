import { useCallback } from 'react';

export function useInitials() {
    return useCallback((fullName: string): string => {
        const names = fullName.trim().split(' ');

        if (names.length === 0) return '';
        if (names.length === 1) return names[0].charAt(0).toUpperCase();

        const firstInitial = names[0].charAt(0);
        const lastInitial = names[names.length - 1].charAt(0);

        return `${firstInitial}${lastInitial}`.toUpperCase();
    }, []);
}

export function useShortName() {
    return useCallback((fullName: string): string => {
        if (!fullName) return '';

        const words = fullName.trim().split(' ');
        if (words.length === 1) {
            return words[0];
        }

        // For names like "Nguyen Trong Quoc", return "Quoc NT"
        // For names like "John Smith", return "John S"
        const firstName = words[0];
        const lastWord = words[words.length - 1];

        if (words.length === 2) {
            return `${firstName} ${lastWord.charAt(0).toUpperCase()}`;
        }

        // For 3+ words, use first name + initials of other words
        const initials = words.slice(1).map(word => word.charAt(0).toUpperCase()).join('');
        return `${firstName} ${initials}`;
    }, []);
}
