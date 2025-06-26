import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import { Department } from '@/types';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { DialogFooter } from '@/components/ui/dialog';

interface CreateUserProps {
    departments: Department[];
}

export default function CreateUser({ departments }: CreateUserProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        role: 'user',
        department_id: '',
        team_role_id: '',
        discord_id: '',
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

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.users.store'));
    };

    return (
        <AppLayout>
            <Head title="Add New User" />
            
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Add New User</h1>
                        <p className="text-muted-foreground">Create a new user account and assign their role.</p>
                    </div>
                </div>

                <form onSubmit={submit}>
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            {/* Form Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" value={data.name || ''} onChange={e => setData('name', e.target.value)} required />
                                    <InputError message={errors.name} />
                                </div>
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={data.email || ''} onChange={e => setData('email', e.target.value)} required />
                                    <InputError message={errors.email} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input id="phone" value={data.phone || ''} onChange={e => setData('phone', e.target.value)} />
                                    <InputError message={errors.phone} />
                                </div>
                                <div>
                                    <Label htmlFor="discord_id">Discord ID</Label>
                                    <Input id="discord_id" value={data.discord_id || ''} onChange={e => setData('discord_id', e.target.value)} />
                                    <InputError message={errors.discord_id} />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="role">Company Role</Label>
                                    <Input id="role" value={data.role || ''} onChange={e => setData('role', e.target.value)} />
                                    <InputError message={errors.role} />
                                </div>
                                <div>
                                    <Label htmlFor="department_id">Department</Label>
                                    <Select onValueChange={value => setData('department_id', value)} value={data.department_id || ''}>
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
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" type="password" value={data.password || ''} onChange={e => setData('password', e.target.value)} required />
                                    <InputError message={errors.password} />
                                </div>
                                <div>
                                    <Label htmlFor="password_confirmation">Confirm Password</Label>
                                    <Input id="password_confirmation" type="password" value={data.password_confirmation || ''} onChange={e => setData('password_confirmation', e.target.value)} required />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="mt-4 flex justify-end gap-4">
                        <Link href={route('admin.users.index')}><Button variant="outline">Cancel</Button></Link>
                        <Button type="submit" disabled={processing}>{processing ? 'Saving...' : 'Save'}</Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
} 