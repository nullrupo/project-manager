import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger, 
    DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Crown, MoreHorizontal, Edit, Trash2, Users } from 'lucide-react';
import { Project } from '@/types/project-manager';
import { useShortName } from '@/hooks/use-initials';

interface MemberManagementProps {
    project: Project;
    canEdit: boolean;
    onEditMember: (member: any) => void;
    onDeleteMember: (member: any) => void;
}

// Color palette for avatars
const avatarColors = ['#F87171', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA', '#F472B6', '#FCD34D', '#6EE7B7', '#818CF8', '#F9A8D4'];
function getShuffledColors(length: number) {
    const base = [...avatarColors];
    const offset = Math.floor(Math.random() * base.length);
    return base.slice(offset).concat(base.slice(0, offset)).slice(0, length);
}

export default function MemberManagement({ 
    project, 
    canEdit, 
    onEditMember, 
    onDeleteMember 
}: MemberManagementProps) {
    const getShortName = useShortName();

    const allMembers = [project.owner, ...(project.members?.filter(m => m.id !== project.owner?.id) || [])].filter(Boolean);
    const colors = getShuffledColors(allMembers.length);

    return (
        <div className="space-y-6">
            {/* Project Owner */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-yellow-500" />
                        Project Owner
                    </CardTitle>
                    <CardDescription>
                        The owner has full control over this project
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-background shadow-md">
                            <AvatarImage src={project.owner?.avatar} />
                            <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-yellow-400/20 to-yellow-600/20">
                                {project.owner?.name?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h4 className="font-semibold text-lg">{getShortName(project.owner?.name || '')}</h4>
                            <p className="text-muted-foreground">{project.owner?.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="default" className="flex items-center gap-1">
                                    <Crown className="h-3 w-3" />
                                    Owner
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Team Members */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Team Members
                            </CardTitle>
                            <CardDescription>
                                Manage project team members and their permissions
                            </CardDescription>
                        </div>
                        <Badge variant="outline">
                            {allMembers.length} member{allMembers.length !== 1 ? 's' : ''}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {allMembers && allMembers.length > 0 ? (
                        <div className="space-y-3">
                            {allMembers.map((member, idx) => {
                                if (!member) return null;
                                const color = colors[idx];
                                const isOwner = member.id === project.owner?.id;
                                return (
                                    <div
                                        key={member.id}
                                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${!isOwner ? 'hover:bg-muted/70 cursor-pointer' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={member.avatar} />
                                                <AvatarFallback className="text-lg font-semibold" style={{ backgroundColor: color, color: '#fff' }}>
                                                    {member.name?.charAt(0).toUpperCase() || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h4 className="font-medium">{getShortName(member.name)}</h4>
                                                <p className="text-sm text-muted-foreground">{member.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs">
                                                {member.pivot?.role || (isOwner ? 'Owner' : 'Member')}
                                            </Badge>
                                            {canEdit && !isOwner && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => onEditMember(member)}>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit Permissions
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => onDeleteMember(member)}
                                                            className="text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Remove
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No team members yet</p>
                            <p className="text-sm">Invite members to collaborate on this project</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
