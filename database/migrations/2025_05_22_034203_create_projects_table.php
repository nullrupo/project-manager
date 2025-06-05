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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('key', 10)->unique(); // Project key (e.g., PROJ, TEST)
            $table->text('description')->nullable();
            $table->foreignId('owner_id')->constrained('users');
            $table->string('icon')->nullable();
            $table->string('background_color')->nullable();
            $table->boolean('is_public')->default(false);
            $table->boolean('is_archived')->default(false);
            $table->enum('completion_behavior', ['simple', 'review', 'custom'])->default('simple');
            $table->boolean('requires_review')->default(false);
            $table->foreignId('default_reviewer_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
