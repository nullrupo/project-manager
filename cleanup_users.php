<?php

require_once 'vendor/autoload.php';

use App\Models\User;
use App\Models\Project;
use App\Models\Task;
use App\Models\Board;
use App\Models\Section;
use App\Models\Label;
use Illuminate\Support\Facades\DB;

// Load Laravel application
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// List of all emails that were added/updated in the import
$importedEmails = [
    'quocnt@novastars.vn',
    'hienmn@novastars.vn',
    'huongth@novastars.vn',
    'ducla@novastars.vn',
    'linhpm@novastars.vn',
    'thaunth@novastars.vn',
    'binhpt@novastars.vn',
    'haipvh@novastars.vn',
    'anhtn@novastars.vn',
    'hangvt@novastars.vn',
    'luyennb@novastars.vn',
    'lananhlt@novastars.vn',
    'tientt@novastars.vn',
    'anhnh@novastars.vn',
    'tunm@novastars.vn',
    'linhngp@novastars.vn',
    'congbt@novastars.vn',
    'tuyennht@novastars.vn',
    'giangnm99@novastars.vn',
    'ganhpv@novastars.vn',
    'oandv@novastars.vn',
    'thornmhd@novastars.vn',
    'anhndt@novastars.vn',
    'nhungth@novastars.vn',
    'lamnt@novastars.vn',
    'thaodtm@novastars.vn',
    'huongnt2001@novastars.vn',
    'dientp@novastars.vn',
    'hanhdt@novastars.vn',
    'chaudtm@novastars.vn',
    'thuylt@novastars.vn',
    'thanhdt@novastars.vn',
    'vungdt@novastars.vn',
    'vuilth@novastars.vn',
    'thatlt@novastars.vn',
    'hanglt@novastars.vn',
    'phongnv@novastars.vn',
    'chinhnt@novastars.vn',
    'thaoppt@novastars.vn',
    'anhjnpt@novastars.vn',
    'phuongnm@novastars.vn',
    'yenb@novastars.vn',
    'maingq@novastars.vn',
    'huongnta@novastars.vn',
    'nenhtn@novastars.vn',
    'huongntt@novastars.vn',
    'nguyenqt@novastars.vn',
    'sonnt@novastars.vn',
    'bachnt@novastars.vn',
    'hieult@novastars.vn',
    'luongnt@novastars.vn',
    'longlt@novastars.vn',
    'daicnt@novastars.vn',
    'anhlql@novastars.vn',
    'thaopq@novastars.vn',
    'anhvv@novastars.vn',
    'anhvn@novastars.vn',
    'luongkimdung89@novastars.vn',
    'thucht@novastars.vn'
];

echo "Starting complete cleanup process...\n";
echo "Total users before cleanup: " . User::count() . "\n";
echo "Total projects before cleanup: " . Project::count() . "\n\n";

// First, let's handle users with projects
$usersWithProjects = [];
foreach ($importedEmails as $email) {
    $user = User::where('email', $email)->first();
    if ($user) {
        $projects = Project::where('owner_id', $user->id)->get();
        if ($projects->count() > 0) {
            $usersWithProjects[] = ['user' => $user, 'projects' => $projects];
        }
    }
}

// Delete projects owned by imported users
$projectsDeleted = 0;
foreach ($usersWithProjects as $userData) {
    $user = $userData['user'];
    $projects = $userData['projects'];

    echo "Deleting {$projects->count()} project(s) owned by {$user->name}:\n";
    foreach ($projects as $project) {
        echo "  - Deleting project: {$project->name}\n";

        // Delete related data first
        Task::where('project_id', $project->id)->delete();
        Board::where('project_id', $project->id)->delete();
        Section::where('project_id', $project->id)->delete();
        Label::where('project_id', $project->id)->delete();

        // Delete project members (pivot table)
        DB::table('project_user')->where('project_id', $project->id)->delete();

        $project->delete();
        $projectsDeleted++;
    }
}

// Now delete all imported users
$deleted = 0;
foreach ($importedEmails as $email) {
    $user = User::where('email', $email)->first();
    if ($user) {
        echo "Deleting user: {$user->name} ({$user->email})\n";
        $user->delete();
        $deleted++;
    }
}

echo "\n=== COMPLETE CLEANUP SUMMARY ===\n";
echo "Projects deleted: {$projectsDeleted}\n";
echo "Users deleted: {$deleted}\n";
echo "Total users remaining: " . User::count() . "\n";
echo "Total projects remaining: " . Project::count() . "\n";
echo "Complete cleanup process finished!\n";
echo "\nAll imported users and their associated projects have been removed.\n";
