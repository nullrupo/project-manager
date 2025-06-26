<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Department;
use App\Services\ShortNameService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index(): Response
    {
        $users = User::with(['department', 'teamRole'])
            ->orderBy('name')
            ->get()
            ->map(function ($user) {
                $user->short_name = ShortNameService::generate($user->name);
                $user->teamRole = $user->teamRole ?: null;
                return $user;
            });

        $departments = Department::orderBy('name')->get(['id', 'name']);
        
        return Inertia::render('admin/users/index', [
            'users' => $users,
            'departments' => $departments,
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create(): Response
    {
        $departments = Department::orderBy('name')->get(['id', 'name']);
        
        return Inertia::render('admin/users/create', [
            'departments' => $departments,
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:20',
            'role' => 'required|in:admin,mod,user',
            'department_id' => 'nullable|exists:departments,id',
            'team_role_id' => 'nullable|exists:department_roles,id',
            'discord_id' => 'nullable|string|max:255',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['is_admin'] = $validated['role'] === 'admin';

        User::create($validated);

        return redirect()->route('admin.users.index')
            ->with('success', 'User created successfully.');
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user): Response
    {
        $user->short_name = ShortNameService::generate($user->name);
        $user->teamRole = $user->teamRole ?: null;
        $departments = Department::orderBy('name')->get(['id', 'name']);
        
        return Inertia::render('admin/users/edit', [
            'user' => $user,
            'departments' => $departments,
        ]);
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'role' => 'required|in:admin,mod,user',
            'department_id' => 'nullable|exists:departments,id',
            'team_role_id' => 'nullable|exists:department_roles,id',
            'discord_id' => 'nullable|string|max:255',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $validated['is_admin'] = $validated['role'] === 'admin';

        $user->update($validated);

        return redirect()->route('admin.users.index')
            ->with('success', 'User updated successfully.');
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $user): RedirectResponse
    {
        // Prevent deleting the last admin
        if ($user->is_admin && User::where('is_admin', true)->count() <= 1) {
            return back()->with('error', 'Cannot delete the last administrator.');
        }

        $user->delete();

        return redirect()->route('admin.users.index')
            ->with('success', 'User deleted successfully.');
    }

    /**
     * Get all users as JSON for dropdowns.
     */
    public function list(): JsonResponse
    {
        $users = User::orderBy('name')->get(['id', 'name', 'email'])->map(function ($user) {
            $user->short_name = ShortNameService::generate($user->name);
            return $user;
        });
        
        return response()->json($users);
    }

    /**
     * Reset the password for a user (admin only).
     */
    public function resetPassword(Request $request, User $user)
    {
        $validated = $request->validate([
            'password' => 'required|string|min:8',
        ]);
        $user->password = Hash::make($validated['password']);
        $user->save();
        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['success' => true, 'message' => 'Password reset successfully.']);
        }
        return redirect()->route('admin.users.index')->with('success', 'Password reset successfully.');
    }
}
