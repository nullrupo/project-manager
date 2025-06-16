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
        Schema::create('invitation_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invitation_id')->constrained('project_invitations')->onDelete('cascade');
            $table->enum('type', ['reminder', 'expiry_warning', 'status_change', 'follow_up']);
            $table->enum('channel', ['email', 'in_app', 'slack', 'teams'])->default('email');
            $table->enum('status', ['pending', 'sent', 'failed', 'cancelled'])->default('pending');
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->json('metadata')->nullable(); // Store additional data like retry count, error messages
            $table->text('content')->nullable(); // Store notification content
            $table->timestamps();

            $table->index(['invitation_id', 'type']);
            $table->index(['scheduled_at', 'status']);
            $table->index(['type', 'channel', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invitation_notifications');
    }
};
