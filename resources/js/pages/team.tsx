import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { User } from '@/types';
import { Project } from '@/types/project-manager';
import { Head } from '@inertiajs/react';
import { Mail, Phone, UserPlus } from 'lucide-react';
import { useMobileDetection } from '@/hooks/use-mobile-detection';
import { useShortName } from '@/hooks/use-initials';
import InviteToProjectsModal from '@/components/invite-to-projects-modal';

interface TeamProps {
    team: User[];
    ownedProjects: Project[];
}

export default function Team({ team = [], ownedProjects = [] }: TeamProps) {
    const isMobile = useMobileDetection();
    const getShortName = useShortName();
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const handleInviteToProjects = (user: User) => {
        setSelectedUser(user);
        setInviteModalOpen(true);
    };

    const handleEmailClick = (email: string) => {
        window.location.href = `mailto:${email}`;
    };

    const handlePhoneClick = (phoneNumber: string) => {
        if (isMobile) {
            window.location.href = `tel:${phoneNumber}`;
        }
    };

    const formatPhoneNumber = (phoneNumber: string) => {
        // Remove +84 prefix if it exists and return the number as entered by user
        // Also handle various formats like +84 123, +84123, etc.
        return phoneNumber.replace(/^\+84\s*/, '').trim();
    };

    const formatRoleDepartment = (role?: string, department?: string) => {
        if (role && department) {
            return `${role} - ${department}`;
        }
        if (role) {
            return role;
        }
        if (department) {
            return department;
        }
        return null;
    };

    return (
        <AppLayout>
            <Head title="Team" />
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-semibold">Team</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {team.length > 0 ? (
                        team.map(member => (
                            <Card key={member.id} className="flex flex-col h-full">
                                <CardHeader className="pb-0 pt-2">
                                    <div className="flex flex-col items-center text-center space-y-1">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={member.avatar} alt={member.name} />
                                            <AvatarFallback className="text-xs font-semibold">
                                                {getShortName(member.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-xs leading-tight">
                                                {member.name} ({getShortName(member.name)})
                                            </CardTitle>
                                            <div className="text-xs text-muted-foreground mt-0.5 min-h-[0.75rem]">
                                                {formatRoleDepartment(member.role, member.department) || ''}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-1 py-1 px-3">
                                    {/* Email with button */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground truncate flex-1 mr-1">
                                            {member.email}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEmailClick(member.email)}
                                            className="shrink-0 h-5 w-5 p-0"
                                        >
                                            <Mail className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    {/* Phone with button */}
                                    <div className="flex items-center justify-between min-h-[1.25rem]">
                                        {member.phone ? (
                                            <>
                                                <span className="text-xs text-muted-foreground truncate flex-1 mr-1">
                                                    {formatPhoneNumber(member.phone)}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handlePhoneClick(member.phone)}
                                                    className="shrink-0 h-5 w-5 p-0"
                                                    disabled={!isMobile}
                                                    title={isMobile ? 'Call' : 'Calling only available on mobile devices'}
                                                >
                                                    <Phone className="h-3 w-3" />
                                                </Button>
                                            </>
                                        ) : (
                                            <div className="w-full"></div>
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter className="mt-auto pt-0 pb-2 px-3">
                                    {/* Invite to project button (only show if user has owned projects) */}
                                    {ownedProjects.length > 0 ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full h-6 text-xs"
                                            onClick={() => handleInviteToProjects(member)}
                                        >
                                            <UserPlus className="h-3 w-3 mr-1" />
                                            Invite
                                        </Button>
                                    ) : (
                                        <div className="w-full min-h-[1.5rem]"></div>
                                    )}
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
                                Team members will appear here once they join the platform.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Invite to Projects Modal */}
            {selectedUser && (
                <InviteToProjectsModal
                    user={selectedUser}
                    ownedProjects={ownedProjects}
                    open={inviteModalOpen}
                    onOpenChange={setInviteModalOpen}
                />
            )}
        </AppLayout>
    );
}
