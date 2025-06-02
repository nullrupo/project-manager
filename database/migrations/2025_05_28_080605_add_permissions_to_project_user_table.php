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
        Schema::table('project_user', function (Blueprint $table) {
            // Update role column to use enum for better validation
            $table->enum('role', ['owner', 'admin', 'editor', 'viewer'])->default('viewer')->change();

            // Add granular permissions
            $table->boolean('can_manage_members')->default(false);
            $table->boolean('can_manage_boards')->default(false);
            $table->boolean('can_manage_tasks')->default(false);
            $table->boolean('can_manage_labels')->default(false);
            $table->boolean('can_view_project')->default(true);
            $table->boolean('can_comment')->default(true);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_user', function (Blueprint $table) {
            $table->string('role')->default('member')->change();
            $table->dropColumn([
                'can_manage_members',
                'can_manage_boards',
                'can_manage_tasks',
                'can_manage_labels',
                'can_view_project',
                'can_comment'
            ]);
        });
    }
};
