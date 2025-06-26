import { useState, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Department } from '@/types';
import AppLayout from '@/layouts/app-layout';
import InputError from '@/components/input-error';
import axios from 'axios';

interface DepartmentsIndexProps {
    departments: Department[];
}

export default function DepartmentsIndex({ departments }: DepartmentsIndexProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
    const [roleModalOpen, setRoleModalOpen] = useState(false);
    const [roleDepartment, setRoleDepartment] = useState<Department | null>(null);
    const [roles, setRoles] = useState<{id:number,name:string}[]>([]);
    const [newRole, setNewRole] = useState('');
    const [roleLoading, setRoleLoading] = useState(false);
    const [roleError, setRoleError] = useState('');

    const { data, setData, post, patch, reset, errors, processing } = useForm({
        name: '',
        description: '',
    });

    const openModal = async (department: Department | null = null) => {
        if (department) {
            setEditingDepartment(department);
            setData({ name: department.name, description: department.description || '' });
            setRoleLoading(true);
            setRoleError('');
            setNewRole('');
            try {
                const res = await axios.get(`/admin/departments/${department.id}/roles`);
                setRoles(res.data);
            } catch (e) {
                setRoleError('Failed to load roles');
            }
            setRoleLoading(false);
        } else {
            setEditingDepartment(null);
            reset();
            setRoles([]);
            setRoleError('');
            setNewRole('');
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingDepartment) {
            patch(route('admin.departments.update', editingDepartment.id), {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            post(route('admin.departments.store'), {
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };
    
    const handleDelete = () => {
        if (departmentToDelete) {
            router.delete(route('admin.departments.destroy', departmentToDelete.id), {
                onSuccess: () => setDepartmentToDelete(null),
            });
        }
    };

    const openRoleModal = async (department: Department) => {
        setRoleDepartment(department);
        setRoleModalOpen(true);
        setRoleLoading(true);
        setRoleError('');
        setNewRole('');
        try {
            const res = await axios.get(`/admin/departments/${department.id}/roles`);
            setRoles(res.data);
        } catch (e) {
            setRoleError('Failed to load roles');
        }
        setRoleLoading(false);
    };

    const handleAddRole = async () => {
        const department = editingDepartment || roleDepartment;
        if (!department || !newRole.trim()) return;
        setRoleLoading(true);
        try {
            const res = await axios.post(`/admin/departments/${department.id}/roles`, { name: newRole });
            setRoles([...roles, res.data]);
            setNewRole('');
        } catch (e) {
            setRoleError('Failed to add role');
        }
        setRoleLoading(false);
    };

    const handleDeleteRole = async (roleId: number) => {
        if (!roleDepartment) return;
        setRoleLoading(true);
        try {
            await axios.delete(`/admin/departments/${roleDepartment.id}/roles/${roleId}`);
            setRoles(roles.filter(r => r.id !== roleId));
        } catch (e) {
            setRoleError('Failed to delete role');
        }
        setRoleLoading(false);
    };

    const handleEditRole = async (roleId: number, name: string) => {
        if (!roleDepartment) return;
        setRoleLoading(true);
        try {
            await axios.put(`/admin/departments/${roleDepartment.id}/roles/${roleId}`, { name });
            setRoles(roles.map(r => r.id === roleId ? { ...r, name } : r));
        } catch (e) {
            setRoleError('Failed to update role');
        }
        setRoleLoading(false);
    };

    return (
        <AppLayout>
            <Head title="Department Management" />
            
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Department Management</h1>
                        <p className="text-muted-foreground">A list of all company departments.</p>
                    </div>
                    <Button onClick={() => openModal()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Department
                    </Button>
                </div>

                <Card>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Users</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {departments.map((department) => (
                                    <TableRow key={department.id}>
                                        <TableCell className="font-medium">{department.name}</TableCell>
                                        <TableCell>{department.description}</TableCell>
                                        <TableCell>{department.users_count}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => openModal(department)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => setDepartmentToDelete(department)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Add/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingDepartment ? 'Edit' : 'Add'} Department</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} required />
                            <InputError message={errors.name} />
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={data.description || ''} onChange={e => setData('description', e.target.value)} />
                            <InputError message={errors.description} />
                        </div>
                        {editingDepartment && (
                            <div>
                                <Label>Department Roles</Label>
                                {roleLoading ? (
                                    <div>Loading roles...</div>
                                ) : (
                                    <>
                                        <ul className="mb-4">
                                            {roles.map(role => (
                                                <li key={role.id} className="flex items-center gap-2 mb-2">
                                                    <input
                                                        className="border rounded px-2 py-1 flex-1"
                                                        value={role.name}
                                                        onChange={e => handleEditRole(role.id, e.target.value)}
                                                        disabled={roleLoading}
                                                    />
                                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteRole(role.id)} disabled={roleLoading}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="flex gap-2">
                                            <input
                                                className="border rounded px-2 py-1 flex-1"
                                                placeholder="New role name"
                                                value={newRole}
                                                onChange={e => setNewRole(e.target.value)}
                                                disabled={roleLoading}
                                            />
                                            <Button type="button" onClick={handleAddRole} disabled={roleLoading || !newRole.trim()}>Add</Button>
                                        </div>
                                        {roleError && <div className="text-red-500 text-xs mt-2">Unable to load roles. Please check your connection or try again later.</div>}
                                    </>
                                )}
                            </div>
                        )}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={processing}>{processing ? 'Saving...' : 'Save'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={!!departmentToDelete}
                onOpenChange={(isOpen) => !isOpen && setDepartmentToDelete(null)}
                title="Are you sure?"
                description={`This will permanently delete the department: ${departmentToDelete?.name}. This action cannot be undone.`}
                onConfirm={handleDelete}
                confirmText="Delete"
                variant="destructive"
            />

            {/* Department Roles Modal */}
            <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Manage Roles for {roleDepartment?.name}</DialogTitle>
                    </DialogHeader>
                    {roleLoading ? (
                        <div>Loading...</div>
                    ) : (
                        <>
                            <ul className="mb-4">
                                {roles.map(role => (
                                    <li key={role.id} className="flex items-center gap-2 mb-2">
                                        <input
                                            className="border rounded px-2 py-1 flex-1"
                                            value={role.name}
                                            onChange={e => handleEditRole(role.id, e.target.value)}
                                            disabled={roleLoading}
                                        />
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteRole(role.id)} disabled={roleLoading}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                            <div className="flex gap-2">
                                <input
                                    className="border rounded px-2 py-1 flex-1"
                                    placeholder="New role name"
                                    value={newRole}
                                    onChange={e => setNewRole(e.target.value)}
                                    disabled={roleLoading}
                                />
                                <Button onClick={handleAddRole} disabled={roleLoading || !newRole.trim()}>Add</Button>
                            </div>
                            {roleError && <div className="text-red-500 text-xs mt-2">Unable to load roles. Please check your connection or try again later.</div>}
                        </>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRoleModalOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
} 