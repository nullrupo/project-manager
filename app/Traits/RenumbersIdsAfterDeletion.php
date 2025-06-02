<?php

namespace App\Traits;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\QueryException;

trait RenumbersIdsAfterDeletion
{
    /**
     * Boot the trait.
     *
     * @return void
     */
    public static function bootRenumbersIdsAfterDeletion()
    {
        // After a model is deleted, renumber all IDs
        static::deleted(function ($model) {
            self::renumberAllIds();
        });

        // Before a model is created, ensure it gets the next available ID
        static::creating(function ($model) {
            $tableName = (new static)->getTable();
            $maxId = DB::table($tableName)->max('id') ?? 0;
            $model->id = $maxId + 1;
        });
    }

    /**
     * Renumber all IDs in the table to be sequential.
     *
     * @return void
     */
    public static function renumberAllIds()
    {
        $tableName = (new static)->getTable();

        // Get all records ordered by ID
        $records = DB::table($tableName)->orderBy('id')->get();

        if ($records->isEmpty()) {
            // No records to renumber
            return;
        }

        try {
            // Temporarily disable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=0');

            // Create a temporary table to store the mapping
            $tempTableName = "{$tableName}_id_map";
            DB::statement("DROP TABLE IF EXISTS {$tempTableName}");
            DB::statement("CREATE TABLE {$tempTableName} (old_id BIGINT UNSIGNED, new_id BIGINT UNSIGNED)");

            // Generate the ID mapping
            $newId = 1;
            foreach ($records as $record) {
                DB::table($tempTableName)->insert([
                    'old_id' => $record->id,
                    'new_id' => $newId++
                ]);
            }

            // Get all foreign keys that reference this table
            $foreignKeys = self::getForeignKeysReferencingTable($tableName);

            // Update all related tables to use the new IDs
            foreach ($foreignKeys as $foreignKey) {
                $relatedTable = $foreignKey->TABLE_NAME;
                $relatedColumn = $foreignKey->COLUMN_NAME;

                DB::statement("
                    UPDATE {$relatedTable} r
                    JOIN {$tempTableName} m ON r.{$relatedColumn} = m.old_id
                    SET r.{$relatedColumn} = m.new_id
                ");
            }

            // Update the IDs in the main table
            DB::statement("
                UPDATE {$tableName} t
                JOIN {$tempTableName} m ON t.id = m.old_id
                SET t.id = m.new_id
            ");

            // Drop the temporary table
            DB::statement("DROP TABLE {$tempTableName}");

            // Reset the auto-increment
            DB::statement("ALTER TABLE {$tableName} AUTO_INCREMENT = {$newId}");

            // Re-enable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        } catch (QueryException $e) {
            // If anything goes wrong, re-enable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
            throw $e;
        }
    }

    /**
     * Get all foreign keys that reference the given table.
     *
     * @param string $tableName
     * @return array
     */
    protected static function getForeignKeysReferencingTable($tableName)
    {
        $databaseName = DB::connection()->getDatabaseName();

        return DB::select("
            SELECT
                TABLE_NAME,
                COLUMN_NAME,
                CONSTRAINT_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM
                INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE
                REFERENCED_TABLE_SCHEMA = '{$databaseName}' AND
                REFERENCED_TABLE_NAME = '{$tableName}' AND
                REFERENCED_COLUMN_NAME = 'id'
        ");
    }


}
