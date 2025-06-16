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
        Schema::create('permission_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('project_id')->nullable()->constrained()->onDelete('cascade'); // null = global template
            $table->enum('scope', ['global', 'project', 'personal'])->default('personal');
            $table->enum('base_role', ['admin', 'editor', 'viewer'])->default('viewer');
            
            // Permission settings
            $table->boolean('can_manage_members')->default(false);
            $table->boolean('can_manage_boards')->default(false);
            $table->boolean('can_manage_tasks')->default(false);
            $table->boolean('can_manage_labels')->default(false);
            $table->boolean('can_view_project')->default(true);
            $table->boolean('can_comment')->default(true);
            
            // Template metadata
            $table->boolean('is_active')->default(true);
            $table->integer('usage_count')->default(0);
            $table->json('tags')->nullable(); // For categorization
            $table->timestamps();

            $table->index(['created_by', 'scope']);
            $table->index(['project_id', 'is_active']);
            $table->unique(['name', 'created_by', 'project_id'], 'unique_template_per_scope');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permission_templates');
    }
};
