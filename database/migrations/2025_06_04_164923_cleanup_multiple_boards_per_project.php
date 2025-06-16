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
        // Clean up projects to have only one board each
        // Keep the default board if it exists, otherwise keep the first board

        $projects = DB::table('projects')->get();

        foreach ($projects as $project) {
            $boards = DB::table('boards')
                ->where('project_id', $project->id)
                ->orderBy('is_default', 'desc')
                ->orderBy('created_at', 'asc')
                ->get();

            if ($boards->count() > 1) {
                // Keep the first board (default if exists, otherwise oldest)
                $boardToKeep = $boards->first();
                $boardsToDelete = $boards->skip(1);

                foreach ($boardsToDelete as $board) {
                    // Delete tasks associated with boards being deleted
                    DB::table('tasks')
                        ->join('lists', 'tasks.list_id', '=', 'lists.id')
                        ->where('lists.board_id', $board->id)
                        ->delete();

                    // Delete lists associated with boards being deleted
                    DB::table('lists')
                        ->where('board_id', $board->id)
                        ->delete();

                    // Delete the board
                    DB::table('boards')
                        ->where('id', $board->id)
                        ->delete();
                }

                // Ensure the remaining board is marked as default
                DB::table('boards')
                    ->where('id', $boardToKeep->id)
                    ->update(['is_default' => true]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration cannot be reversed as it deletes data
        // The down method is intentionally left empty
    }
};
