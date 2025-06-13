<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For MySQL, we need to alter the enum column to add new values
        DB::statement("ALTER TABLE boards MODIFY COLUMN column_outline_style ENUM('none', 'subtle', 'bold', 'rounded', 'shadow', 'single', 'spaced', 'double', 'dashed', 'dotted', 'gradient') DEFAULT 'subtle'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original enum values
        DB::statement("ALTER TABLE boards MODIFY COLUMN column_outline_style ENUM('none', 'subtle', 'bold', 'rounded', 'shadow') DEFAULT 'subtle'");
    }
};
