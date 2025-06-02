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
        Schema::create('favorites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('favoritable_type'); // Project, Task, Document, etc.
            $table->unsignedBigInteger('favoritable_id');
            $table->timestamps();

            // Ensure a user can only favorite an item once
            $table->unique(['user_id', 'favoritable_type', 'favoritable_id']);
            
            // Index for performance
            $table->index(['favoritable_type', 'favoritable_id']);
            $table->index(['user_id', 'favoritable_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('favorites');
    }
};
