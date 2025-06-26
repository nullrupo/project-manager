import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import { User, Department } from '@/types';
import { FormEventHandler, useState, useEffect } from 'react';
import axios from 'axios';

interface EditUserProps {
    user: User;
    departments: Department[];
}

export default function EditUser({ user, departments }: EditUserProps) {
    const { data, setData, patch, processing, errors } = useForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'user',
        is_admin: user.role === 'admin',
        department_id: user.department_id?.toString() || '',
        team_role_id: user.team_role_id?.toString() || '',
        discord_id: user.discord_id || '',
        password: '',
        password_confirmation: '',
    });

    const [roles, setRoles] = useState<{id:number,name:string}[]>([]);
    const [roleLoading, setRoleLoading] = useState(false);
    const [newRole, setNewRole] = useState('');

    useEffect(() => {
        if (data.department_id) {
            setRoleLoading(true);
            axios.get(`/admin/departments/${data.department_id}/roles`).then(res => {
                setRoles(res.data);
                setRoleLoading(false);
            });
        } else {
            setRoles([]);
        }
    }, [data.department_id]);

    useEffect(() => {
        setData('is_admin', data.role === 'admin');
    }, [data.role]);

    const handleAddRole = async () => {
        if (!data.department_id || !newRole.trim()) return;
        setRoleLoading(true);
        try {
            const res = await axios.post(`/admin/departments/${data.department_id}/roles`, { name: newRole });
            setRoles([...roles, res.data]);
            setData('team_role_id', res.data.id);
            setNewRole('');
        } finally {
            setRoleLoading(false);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('admin.users.update', user.id));
    };

    return (
        <AppLayout>
            <Head title={`Edit User: ${user.name}`} />
            
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Edit User</h1>
                        <p className="text-muted-foreground">Update user details and permissions.</p>
                    </div>
                </div>

                <form onSubmit={submit}>
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            {/* Form Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} required />
                                    <InputError message={errors.name} />
                                </div>
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={data.email} onChange={e => setData('email', e.target.value)} required />
                                    <InputError message={errors.email} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input id="phone" value={data.phone} onChange={e => setData('phone', e.target.value)} />
                                    <InputError message={errors.phone} />
                                </div>
                                <div>
                                    <Label htmlFor="discord_id">Discord ID</Label>
                                    <Input id="discord_id" value={data.discord_id} onChange={e => setData('discord_id', e.target.value)} />
                                    <InputError message={errors.discord_id} />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="department_id">Department</Label>
                                    <Select onValueChange={value => setData('department_id', value)} value={data.department_id}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.department_id} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="team_role_id">Team Role</Label>
                                    <Select
                                        onValueChange={value => setData('team_role_id', value)}
                                        value={data.team_role_id || ''}
                                        disabled={!data.department_id || roleLoading}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={roleLoading ? 'Loading roles...' : 'Select a role'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                                            <div className="flex items-center gap-2 px-2 py-1">
                                                <Input
                                                    className="flex-1"
                                                    placeholder="Add new role"
                                                    value={newRole}
                                                    onChange={e => setNewRole(e.target.value)}
                                                    disabled={roleLoading}
                                                />
                                                <Button type="button" size="sm" onClick={handleAddRole} disabled={roleLoading || !newRole.trim()}>Add</Button>
                                            </div>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.team_role_id} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="password">New Password (optional)</Label>
                                    <Input id="password" type="password" value={data.password} onChange={e => setData('password', e.target.value)} />
                                    <InputError message={errors.password} />
                                </div>
                                <div>
                                    <Label htmlFor="password_confirmation">Confirm New Password</Label>
                                    <Input id="password_confirmation" type="password" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} />
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <Label htmlFor="role">Role</Label>
                                <Select value={data.role || 'user'} onValueChange={value => setData('role', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="mod">Mod</SelectItem>
                                        <SelectItem value="user">User</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="mt-4 flex justify-end gap-4">
                        <Link href={route('admin.users.index')}><Button variant="outline">Cancel</Button></Link>
                        <Button type="submit" disabled={processing}>Update User</Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
} 