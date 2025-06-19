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

// Color palette for avatars
const avatarColors = ['#F87171', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA', '#F472B6', '#FCD34D', '#6EE7B7', '#818CF8', '#F9A8D4'];
function getColorForIndex(index: number, prevColorIndex: number = -1) {
    let colorIndex = index % avatarColors.length;
    if (colorIndex === prevColorIndex) {
        colorIndex = (colorIndex + 1) % avatarColors.length;
    }
    return colorIndex;
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

                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
                    {team.length > 0 ? (
                        team.map((member, idx) => {
                            const colorIndex = getColorForIndex(idx);
                            return (
                                <Card key={member.id} className="flex flex-col h-full gap-2 py-3">
                                    <CardHeader className="pb-0 pt-0 px-3">
                                        <div className="flex flex-col items-center text-center space-y-1">
                                            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                                                <AvatarImage src={member.avatar} alt={member.name} />
                                                <AvatarFallback className="rounded-lg text-white" style={{ backgroundColor: avatarColors[colorIndex] }}>
                                                    {member.name?.charAt(0).toUpperCase() || '?'}
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
                                    <CardContent className="flex-grow space-y-1 py-0 px-3">
                                        {/* Email with button */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground truncate flex-1 mr-1">
                                                {member.email}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEmailClick(member.email)}
                                                className="shrink-0 h-4 w-4 p-0"
                                            >
                                                <Mail className="h-2.5 w-2.5" />
                                            </Button>
                                        </div>

                                        {/* Phone with button */}
                                        <div className="flex items-center justify-between min-h-[1rem]">
                                            {member.phone ? (
                                                <>
                                                    <span className="text-xs text-muted-foreground truncate flex-1 mr-1">
                                                        {formatPhoneNumber(member.phone)}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handlePhoneClick(member.phone)}
                                                        className="shrink-0 h-4 w-4 p-0"
                                                        disabled={!isMobile}
                                                        title={isMobile ? 'Call' : 'Calling only available on mobile devices'}
                                                    >
                                                        <Phone className="h-2.5 w-2.5" />
                                                    </Button>
                                                </>
                                            ) : (
                                                <div className="w-full"></div>
                                            )}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="mt-auto pt-0 pb-0 px-3">
                                        {/* Invite to project button (only show if user has owned projects) */}
                                        {ownedProjects.length > 0 ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full h-5 text-xs"
                                                onClick={() => handleInviteToProjects(member)}
                                            >
                                                <UserPlus className="h-2.5 w-2.5 mr-1" />
                                                Invite
                                            </Button>
                                        ) : (
                                            <div className="w-full min-h-[1.25rem]"></div>
                                        )}
                                    </CardFooter>
                                </Card>
                            );
                        })
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
