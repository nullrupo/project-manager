import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Edit, Trash2, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { User, Department } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface UsersIndexProps {
    users: User[];
    departments: Department[];
}

export default function UsersIndex({ users, departments }: UsersIndexProps) {
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [resetUser, setResetUser] = useState<User | null>(null);
    const [resetPassword, setResetPassword] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetLoading, setResetLoading] = useState(false);

    const handleDelete = () => {
        if (userToDelete) {
            router.delete(route('admin.users.destroy', userToDelete.id), {
                onSuccess: () => setUserToDelete(null),
            });
        }
    };

    const handleResetPassword = () => {
        if (!resetUser || !resetPassword) {
            setResetError('Password is required.');
            return;
        }
        setResetLoading(true);
        router.post(route('admin.users.reset_password', resetUser.id), { password: resetPassword }, {
            onSuccess: () => {
                setResetUser(null);
                setResetPassword('');
                setResetError('');
                setResetLoading(false);
            },
            onError: (err) => {
                setResetError('Failed to reset password.');
                setResetLoading(false);
            }
        });
    };

    return (
        <AppLayout>
            <Head title="User Management" />
            
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">User Management</h1>
                        <p className="text-muted-foreground">A list of all users in the system.</p>
                    </div>
                    <Link href={route('admin.users.create')}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="px-4 py-2 min-w-[140px]">Name</TableHead>
                                    <TableHead className="px-4 py-2 min-w-[220px]">Email</TableHead>
                                    <TableHead className="px-4 py-2 min-w-[120px]">Department</TableHead>
                                    <TableHead className="px-4 py-2 min-w-[140px]">Team Role</TableHead>
                                    <TableHead className="px-4 py-2 min-w-[80px]">Admin</TableHead>
                                    <TableHead className="px-4 py-2 min-w-[120px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="px-4 py-2 font-medium">{user.name}</TableCell>
                                        <TableCell className="px-4 py-2">{user.email}</TableCell>
                                        <TableCell className="px-4 py-2">{user.department && typeof user.department === 'object' && 'name' in user.department ? (user.department as { name: string }).name : ''}</TableCell>
                                        <TableCell className="px-4 py-2">{user.teamRole && typeof user.teamRole === 'object' && !Array.isArray(user.teamRole) && Object.prototype.hasOwnProperty.call(user.teamRole, 'name') ? (user.teamRole as { name: string }).name : ''}</TableCell>
                                        <TableCell className="px-4 py-2">{user.role === 'admin' && <Badge>Admin</Badge>}{user.role === 'mod' && <Badge>Mod</Badge>}{user.role === 'user' && <Badge>User</Badge>}</TableCell>
                                        <TableCell className="px-4 py-2 text-right">
                                            <Link href={route('admin.users.edit', user.id)} className="mr-2">
                                                <Button variant="ghost" size="sm">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button variant="ghost" size="sm" onClick={() => setResetUser(user)}>
                                                <Key className="h-4 w-4 text-blue-500" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => setUserToDelete(user)}>
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

            <ConfirmDialog
                open={!!userToDelete}
                onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}
                title="Are you sure?"
                description={`This will permanently delete the user: ${userToDelete?.name}. This action cannot be undone.`}
                onConfirm={handleDelete}
                confirmText="Delete"
                variant="destructive"
            />

            {resetUser && (
                <Dialog open={!!resetUser} onOpenChange={(isOpen) => !isOpen && setResetUser(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Reset Password for {resetUser.name}</DialogTitle>
                            <DialogDescription>Enter a new password for this user.</DialogDescription>
                        </DialogHeader>
                        <input
                            type="password"
                            className="w-full border rounded px-2 py-1 mt-2"
                            placeholder="New password"
                            value={resetPassword}
                            onChange={e => setResetPassword(e.target.value)}
                            disabled={resetLoading}
                        />
                        {resetError && <div className="text-red-500 text-xs mt-1">{resetError}</div>}
                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" onClick={() => setResetUser(null)} disabled={resetLoading}>Cancel</Button>
                            <Button onClick={handleResetPassword} disabled={resetLoading}>{resetLoading ? 'Resetting...' : 'Reset Password'}</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </AppLayout>
    );
} 