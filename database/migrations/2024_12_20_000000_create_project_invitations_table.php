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
        Schema::create('project_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->foreignId('invited_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('invited_user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->string('email'); // For inviting users who don't exist yet
            $table->string('token')->unique(); // Unique invitation token
            $table->enum('status', ['pending', 'accepted', 'declined', 'expired', 'cancelled'])->default('pending');
            $table->enum('role', ['admin', 'editor', 'viewer'])->default('viewer');
            
            // Permission overrides (nullable means use role defaults)
            $table->boolean('can_manage_members')->nullable();
            $table->boolean('can_manage_boards')->nullable();
            $table->boolean('can_manage_tasks')->nullable();
            $table->boolean('can_manage_labels')->nullable();
            $table->boolean('can_view_project')->nullable();
            $table->boolean('can_comment')->nullable();
            
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->text('message')->nullable(); // Optional invitation message
            $table->timestamps();

            $table->index(['email', 'status']);
            $table->index(['invited_user_id', 'status']);
            $table->index(['project_id', 'status']);
            $table->unique(['project_id', 'email', 'status'], 'unique_pending_invitation');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_invitations');
    }
};
