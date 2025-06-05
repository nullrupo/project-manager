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
            $table->foreignId('section_id')->nullable()->constrained()->onDelete('set null')->after('list_id');
            $table->foreignId('parent_task_id')->nullable()->constrained('tasks')->onDelete('cascade')->after('section_id');
            
            // Add indexes for hierarchy queries
            $table->index(['section_id', 'position']);
            $table->index(['parent_task_id', 'position']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['section_id']);
            $table->dropForeign(['parent_task_id']);
            $table->dropIndex(['section_id', 'position']);
            $table->dropIndex(['parent_task_id', 'position']);
            $table->dropColumn(['section_id', 'parent_task_id']);
        });
    }
};
