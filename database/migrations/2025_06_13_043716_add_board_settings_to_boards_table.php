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
        Schema::table('boards', function (Blueprint $table) {
            $table->enum('column_outline_style', ['none', 'subtle', 'bold', 'rounded', 'shadow'])->default('subtle')->after('background_image');
            $table->enum('column_spacing', ['compact', 'normal', 'wide'])->default('normal')->after('column_outline_style');
            $table->enum('card_style', ['minimal', 'detailed', 'compact'])->default('detailed')->after('column_spacing');
            $table->boolean('show_task_count')->default(true)->after('card_style');
            $table->boolean('show_wip_limits')->default(false)->after('show_task_count');
            $table->boolean('enable_swimlanes')->default(false)->after('show_wip_limits');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('boards', function (Blueprint $table) {
            $table->dropColumn([
                'column_outline_style',
                'column_spacing',
                'card_style',
                'show_task_count',
                'show_wip_limits',
                'enable_swimlanes'
            ]);
        });
    }
};
