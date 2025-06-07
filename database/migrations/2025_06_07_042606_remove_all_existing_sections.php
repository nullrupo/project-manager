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
        // Remove all existing sections from all projects
        // This ensures projects start with no default sections
        DB::table('sections')->delete();

        // Reset the auto-increment counter
        DB::statement('ALTER TABLE sections AUTO_INCREMENT = 1');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration cannot be reversed as we're deleting data
        // If you need to restore sections, you'll need to recreate them manually
        // or run the seeders again
    }
};
