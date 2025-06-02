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
            // Index for calendar queries - due_date is the primary filter
            $table->index(['due_date', 'is_inbox'], 'tasks_due_date_inbox_index');

            // Index for project-based task queries
            $table->index(['project_id', 'due_date'], 'tasks_project_due_date_index');

            // Index for user-created inbox tasks
            $table->index(['created_by', 'is_inbox', 'due_date'], 'tasks_creator_inbox_due_date_index');
        });

        Schema::table('projects', function (Blueprint $table) {
            // Index for project ownership queries
            $table->index('owner_id', 'projects_owner_id_index');
        });

        Schema::table('project_user', function (Blueprint $table) {
            // Index for project membership queries
            $table->index(['user_id', 'project_id'], 'project_user_user_project_index');
        });

        Schema::table('task_user', function (Blueprint $table) {
            // Index for task assignment queries
            $table->index(['user_id', 'task_id'], 'task_user_user_task_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex('tasks_due_date_inbox_index');
            $table->dropIndex('tasks_project_due_date_index');
            $table->dropIndex('tasks_creator_inbox_due_date_index');
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->dropIndex('projects_owner_id_index');
        });

        Schema::table('project_user', function (Blueprint $table) {
            $table->dropIndex('project_user_user_project_index');
        });

        Schema::table('task_user', function (Blueprint $table) {
            $table->dropIndex('task_user_user_task_index');
        });
    }
};
