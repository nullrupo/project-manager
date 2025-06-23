import { useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

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
    const { settings } = usePage<SharedData>().props;

    return useCallback((fullName: string): string => {
        if (!fullName) return '';

        const words = fullName.trim().split(' ').filter(word => word.length > 0);
        if (words.length === 0) return '';
        if (words.length === 1) return words[0];

        const format = settings?.short_name_format || 'last_initial_first';

        if (format === 'last_initial_first') {
            // "Quoc NT" for "Nguyen Trong Quoc"
            const lastName = words[words.length - 1];
            const otherWords = words.slice(0, -1);

            if (otherWords.length === 0) return lastName;

            const initials = otherWords.map(word => word.charAt(0).toUpperCase()).join('');
            return `${lastName} ${initials}`;
        } else {
            // "Nguyen TQ" for "Nguyen Trong Quoc" (default)
            const firstName = words[0];
            const otherWords = words.slice(1);

            if (otherWords.length === 0) return firstName;

            const initials = otherWords.map(word => word.charAt(0).toUpperCase()).join('');
            return `${firstName} ${initials}`;
        }
    }, [settings?.short_name_format]);
}
