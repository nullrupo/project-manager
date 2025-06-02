import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { User } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Mail, Plus, UserPlus } from 'lucide-react';

interface TeamProps {
    team: User[];
}

export default function Team({ team = [] }: TeamProps) {
    return (
        <AppLayout>
            <Head title="Team" />
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-semibold">Team</h1>
                    <div className="flex gap-2">
                        <Button>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Invite Member
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {team.length > 0 ? (
                        team.map(member => (
                            <Card key={member.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center space-x-4">
                                        <Avatar>
                                            <AvatarImage src={member.avatar} alt={member.name} />
                                            <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle>{member.name}</CardTitle>
                                            <CardDescription>{member.email}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-muted-foreground">
                                        <p>Member since {new Date(member.created_at).toLocaleDateString()}</p>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" size="sm" className="w-full">
                                        <Mail className="h-4 w-4 mr-2" />
                                        Contact
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center p-12 text-center">
                            <div className="rounded-full bg-muted p-3 mb-4">
                                <UserPlus className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium">No team members yet</h3>
                            <p className="text-muted-foreground mt-1">
                                Invite team members to collaborate on your projects.
                            </p>
                            <Button className="mt-4">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Invite Member
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
