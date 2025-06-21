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

interface CreateUserProps {
    departments: Department[];
}

export default function CreateUser({ departments }: CreateUserProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        role: '',
        department_id: '',
        discord_id: '',
        password: '',
        password_confirmation: '',
        is_admin: false,
    });

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
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" type="password" value={data.password} onChange={e => setData('password', e.target.value)} required />
                                    <InputError message={errors.password} />
                                </div>
                                <div>
                                    <Label htmlFor="password_confirmation">Confirm Password</Label>
                                    <Input id="password_confirmation" type="password" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} required />
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_admin"
                                    checked={data.is_admin}
                                    onCheckedChange={(checked) => {
                                        if (typeof checked === 'boolean') {
                                            setData('is_admin', checked);
                                        }
                                    }}
                                />
                                <Label htmlFor="is_admin">Is Administrator?</Label>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="mt-4 flex justify-end gap-4">
                        <Link href={route('admin.users.index')}><Button variant="outline">Cancel</Button></Link>
                        <Button type="submit" disabled={processing}>Create User</Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
} 