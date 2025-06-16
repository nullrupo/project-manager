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

            // Add indexes for hierarchy queries
            $table->index(['section_id', 'position']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['section_id']);
            $table->dropIndex(['section_id', 'position']);
            $table->dropColumn(['section_id']);
        });
    }
};
