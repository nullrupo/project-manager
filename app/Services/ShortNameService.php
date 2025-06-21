<?php

namespace App\Services;

use App\Models\Setting;

class ShortNameService
{
    /**
     * Generate short name based on global setting.
     */
    public static function generate(string $fullName): string
    {
        if (!$fullName) {
            return '';
        }

        $words = array_filter(explode(' ', trim($fullName)));
        
        if (count($words) === 0) {
            return '';
        }
        
        if (count($words) === 1) {
            return $words[0];
        }

        $format = Setting::get('short_name_format', 'last_initial_first');

        return match ($format) {
            'last_initial_first' => self::generateLastInitialFirst($words),
            'first_last_initial' => self::generateFirstLastInitial($words),
            default => self::generateLastInitialFirst($words),
        };
    }

    /**
     * Generate format: "Quoc NT" for "Nguyen Trong Quoc"
     */
    private static function generateLastInitialFirst(array $words): string
    {
        $lastName = array_pop($words);
        
        if (count($words) === 0) {
            return $lastName;
        }

        $initials = implode('', array_map(fn($word) => mb_strtoupper(mb_substr($word, 0, 1)), $words));
        
        return "{$lastName} {$initials}";
    }

    /**
     * Generate format: "Nguyen TQ" for "Nguyen Trong Quoc"
     */
    private static function generateFirstLastInitial(array $words): string
    {
        $firstName = array_shift($words);
        
        if (count($words) === 0) {
            return $firstName;
        }

        $initials = implode('', array_map(fn($word) => mb_strtoupper(mb_substr($word, 0, 1)), $words));
        
        return "{$firstName} {$initials}";
    }

    /**
     * Generate initials for avatar fallback.
     */
    public static function generateInitials(string $fullName): string
    {
        $words = array_filter(explode(' ', trim($fullName)));
        
        if (count($words) === 0) {
            return '';
        }
        
        if (count($words) === 1) {
            return mb_strtoupper(mb_substr($words[0], 0, 1));
        }

        $firstInitial = mb_strtoupper(mb_substr($words[0], 0, 1));
        $lastInitial = mb_strtoupper(mb_substr($words[count($words) - 1], 0, 1));

        return $firstInitial . $lastInitial;
    }
}
