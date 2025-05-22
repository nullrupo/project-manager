<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ResetAllIds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:reset-all-ids';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset all IDs in the database to be sequential without gaps';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Resetting all IDs in the database...');

        // Get all model classes
        $models = [
            \App\Models\Project::class,
            \App\Models\Board::class,
            \App\Models\TaskList::class,
            \App\Models\Task::class,
            \App\Models\Label::class,
            \App\Models\Comment::class,
        ];

        foreach ($models as $modelClass) {
            $this->info("Resetting IDs for {$modelClass}...");

            try {
                // Call the renumberAllIds method on the model
                $modelClass::renumberAllIds();
                $this->info("Successfully reset IDs for {$modelClass}");
            } catch (\Exception $e) {
                $this->error("Failed to reset IDs for {$modelClass}: {$e->getMessage()}");
            }
        }

        $this->info('All IDs have been reset successfully!');
    }
}
