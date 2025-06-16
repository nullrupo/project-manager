<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Check if the column exists before trying to drop it
            if (Schema::hasColumn('tasks', 'parent_task_id')) {
                // Drop foreign key constraint if it exists
                try {
                    $table->dropForeign(['parent_task_id']);
                } catch (Exception $e) {
                    // Foreign key might not exist, continue
                }

                // Drop index if it exists
                try {
                    $table->dropIndex(['parent_task_id', 'position']);
                } catch (Exception $e) {
                    // Index might not exist, continue
                }

                // Drop the column
                $table->dropColumn('parent_task_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Add the column back
            $table->foreignId('parent_task_id')->nullable()->constrained('tasks')->onDelete('cascade')->after('section_id');
            
            // Add index back
            $table->index(['parent_task_id', 'position']);
        });
    }
};
