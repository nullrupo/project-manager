import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { User, Department } from '@/types/project-manager';
import AppLayout from '@/layouts/app-layout';

interface UsersIndexProps {
    users: User[];
    departments: Department[];
}

export default function UsersIndex({ users, departments }: UsersIndexProps) {
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const handleDelete = () => {
        if (userToDelete) {
            router.delete(route('admin.users.destroy', userToDelete.id), {
                onSuccess: () => setUserToDelete(null),
            });
        }
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
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Admin</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.department?.name}</TableCell>
                                        <TableCell>{user.role}</TableCell>
                                        <TableCell>
                                            {user.is_admin && <Badge>Admin</Badge>}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={route('admin.users.edit', user.id)} className="mr-2">
                                                <Button variant="ghost" size="sm">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
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
        </AppLayout>
    );
} 