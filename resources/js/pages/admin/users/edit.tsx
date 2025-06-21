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
import { FormEventHandler } from 'react';

interface EditUserProps {
    user: User;
    departments: Department[];
}

export default function EditUser({ user, departments }: EditUserProps) {
    const { data, setData, patch, processing, errors } = useForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || '',
        department_id: user.department_id?.toString() || '',
        discord_id: user.discord_id || '',
        password: '',
        password_confirmation: '',
        is_admin: user.is_admin || false,
    });

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
                                    <Label htmlFor="role">Company Role</Label>
                                    <Input id="role" value={data.role} onChange={e => setData('role', e.target.value)} />
                                    <InputError message={errors.role} />
                                </div>
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
                                <Checkbox
                                    id="is_admin"
                                    checked={data.is_admin}
                                    onCheckedChange={(checked) => setData('is_admin', !!checked)}
                                />
                                <Label htmlFor="is_admin">Is Administrator?</Label>
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