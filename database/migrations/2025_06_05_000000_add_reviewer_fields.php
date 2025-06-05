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
        // Add default_reviewer_id to projects table if it doesn't exist
        if (!Schema::hasColumn('projects', 'default_reviewer_id')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->foreignId('default_reviewer_id')->nullable()->constrained('users')->onDelete('set null')->after('requires_review');
            });
        }

        // Add reviewer_id to tasks table
        Schema::table('tasks', function (Blueprint $table) {
            $table->foreignId('reviewer_id')->nullable()->constrained('users')->onDelete('set null')->after('created_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['reviewer_id']);
            $table->dropColumn('reviewer_id');
        });

        if (Schema::hasColumn('projects', 'default_reviewer_id')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->dropForeign(['default_reviewer_id']);
                $table->dropColumn('default_reviewer_id');
            });
        }
    }
};
