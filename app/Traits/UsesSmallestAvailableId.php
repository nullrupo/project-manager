<?php

namespace App\Traits;

use Illuminate\Support\Facades\DB;

trait UsesSmallestAvailableId
{
    /**
     * Boot the trait.
     * 
     * @return void
     */
    public static function bootUsesSmallestAvailableId()
    {
        static::creating(function ($model) {
            // Find the smallest available ID
            $model->id = self::getSmallestAvailableId();
        });
    }

    /**
     * Get the smallest available ID for the model.
     * 
     * @return int
     */
    public static function getSmallestAvailableId()
    {
        $tableName = (new static)->getTable();
        
        // Get all existing IDs
        $existingIds = DB::table($tableName)->pluck('id')->toArray();
        
        // If no records exist, start with 1
        if (empty($existingIds)) {
            return 1;
        }
        
        // Sort the IDs
        sort($existingIds);
        
        // Find the first gap in the sequence
        $previousId = 0;
        foreach ($existingIds as $id) {
            if ($id > $previousId + 1) {
                // Found a gap
                return $previousId + 1;
            }
            $previousId = $id;
        }
        
        // No gaps found, use the next ID
        return $previousId + 1;
    }
}
