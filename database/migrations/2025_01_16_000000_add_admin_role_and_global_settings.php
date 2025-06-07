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
        // Add is_admin column to users table if it doesn't exist
        if (!Schema::hasColumn('users', 'is_admin')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('is_admin')->default(false)->after('password');
            });
        }

        // Create global settings table
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('string'); // string, boolean, integer, json
            $table->text('description')->nullable();
            $table->boolean('is_public')->default(false); // Whether setting can be accessed by non-admin users
            $table->timestamps();
        });

        // Insert default short name format setting
        DB::table('settings')->insert([
            'key' => 'short_name_format',
            'value' => 'first_last_initial',
            'type' => 'string',
            'description' => 'Format for displaying user short names. Options: first_last_initial, last_initial_first',
            'is_public' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove is_admin column from users table
        if (Schema::hasColumn('users', 'is_admin')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('is_admin');
            });
        }

        // Drop settings table
        Schema::dropIfExists('settings');
    }
};
