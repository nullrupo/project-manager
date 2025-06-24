import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Shield,
    Crown,
    Clock,
    Settings,
    Users,
    UserPlus
} from 'lucide-react';
import { Project } from '@/types/project-manager';
import { useShortName } from '@/hooks/use-initials';
import { useAppearance } from '@/hooks/use-appearance';
import { Link } from '@inertiajs/react';

interface ProjectHeaderProps {
    project: Project;
    canEdit: boolean;
    onInviteMember: () => void;
    onOpenDetails: () => void;
    onOpenMembers: () => void;
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

export default function ProjectHeader({ 
    project, 
    canEdit, 
    onInviteMember, 
    onOpenDetails, 
    onOpenMembers 
}: ProjectHeaderProps) {
    const getShortName = useShortName();
    const { projectDetailsDisplay } = useAppearance();

    const getProjectIcon = () => {
        return <Shield className="h-5 w-5 text-orange-500" />;
    };

    // Compute allMembers as owner + unique members (excluding duplicates)
    const allMembers = [project.owner, ...(project.members?.filter(m => m.id !== project.owner?.id) || [])].filter(Boolean);

    return (
        <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            {getProjectIcon()}
                            <CardTitle className="text-2xl font-bold text-foreground">
                                {project.name}
                            </CardTitle>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Crown className="h-4 w-4" />
                                <span>Owner: {getShortName(project.owner?.name || 'Unknown')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                            </div>
                            {/* Details link or button, based on appearance setting */}
                            {projectDetailsDisplay === 'button' ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onOpenDetails}
                                    className="shadow-sm hover:shadow-md ml-2"
                                >
                                    <Settings className="h-4 w-4 mr-2" />
                                    Details
                                </Button>
                            ) : (
                                <Link
                                    href={route('projects.show', project.id)}
                                    className="inline-flex items-center px-3 py-1.5 rounded-md border border-border text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-white dark:bg-neutral-800 shadow-sm hover:shadow-md transition-colors ml-2"
                                    title="Project Details"
                                >
                                    <Settings className="h-4 w-4 mr-2" />
                                    Details
                                </Link>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                        {/* Team Members Preview */}
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                                {allMembers.slice(0, 3).map((member, idx) => {
                                    if (!member) return null;
                                    const colorIndex = getColorForIndex(idx);
                                    return (
                                        <Avatar
                                            key={member.id}
                                            className={`h-8 w-8 border-2 border-white shadow-sm ring-1 ring-black/10 bg-background object-cover ${idx !== 0 ? 'ml-1 -ml-2' : ''}`}
                                            style={{ zIndex: 10 - idx }}
                                        >
                                            <AvatarImage src={member.avatar} className="object-cover w-full h-full rounded-full" />
                                            <AvatarFallback className="text-xs" style={{ backgroundColor: avatarColors[colorIndex], color: '#fff' }}>
                                                {member.name?.charAt(0).toUpperCase() || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                    );
                                })}
                                {allMembers.length > 3 && (
                                    <div className="h-8 w-8 rounded-full bg-muted border-2 border-white shadow-sm flex items-center justify-center ml-1 -ml-2" style={{ zIndex: 6 }}>
                                        <span className="text-xs font-medium text-muted-foreground">
                                            +{allMembers.length - 3}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="shadow-sm hover:shadow-md flex items-center gap-1"
                                onClick={onOpenMembers}
                                title="View and manage members"
                            >
                                <Users className="h-4 w-4 mr-1" />
                                {allMembers.length} member{allMembers.length !== 1 ? 's' : ''}
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>
        </Card>
    );
}
