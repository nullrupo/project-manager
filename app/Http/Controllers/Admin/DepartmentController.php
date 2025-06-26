<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\DepartmentRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    /**
     * Display a listing of departments.
     */
    public function index(): Response
    {
        $departments = Department::withCount('users')->orderBy('name')->get();
        
        return Inertia::render('admin/departments/index', [
            'departments' => $departments,
        ]);
    }

    /**
     * Show the form for creating a new department.
     */
    public function create(): Response
    {
        return Inertia::render('admin/departments/create');
    }

    /**
     * Store a newly created department.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:departments',
            'description' => 'nullable|string',
        ]);

        Department::create($validated);

        return redirect()->route('admin.departments.index')
            ->with('success', 'Department created successfully.');
    }

    /**
     * Show the form for editing the specified department.
     */
    public function edit(Department $department): Response
    {
        $department->load('users');
        
        return Inertia::render('admin/departments/edit', [
            'department' => $department,
        ]);
    }

    /**
     * Update the specified department.
     */
    public function update(Request $request, Department $department): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:departments,name,' . $department->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $department->update($validated);

        return redirect()->route('admin.departments.index')
            ->with('success', 'Department updated successfully.');
    }

    /**
     * Remove the specified department.
     */
    public function destroy(Department $department): RedirectResponse
    {
        // Check if department has users
        if ($department->users()->count() > 0) {
            return back()->with('error', 'Cannot delete department with active users.');
        }

        $department->delete();

        return redirect()->route('admin.departments.index')
            ->with('success', 'Department deleted successfully.');
    }

    /**
     * Get all departments as JSON for dropdowns.
     */
    public function list(): JsonResponse
    {
        $departments = Department::active()->orderBy('name')->get(['id', 'name']);
        
        return response()->json($departments);
    }

    /**
     * List all roles for a department (API).
     */
    public function roles(Department $department)
    {
        return response()->json($department->roles()->get(['id', 'name']));
    }

    /**
     * Add a new role to a department (API).
     */
    public function addRole(Request $request, Department $department)
    {
        $validated = $request->validate(['name' => 'required|string|max:255']);
        $role = $department->roles()->create(['name' => $validated['name']]);
        return response()->json($role);
    }

    /**
     * Update a department role (API).
     */
    public function updateRole(Request $request, Department $department, DepartmentRole $role)
    {
        $validated = $request->validate(['name' => 'required|string|max:255']);
        $role->update(['name' => $validated['name']]);
        return response()->json($role);
    }

    /**
     * Delete a department role (API).
     */
    public function deleteRole(Department $department, DepartmentRole $role)
    {
        $role->delete();
        return response()->json(['success' => true]);
    }
}
