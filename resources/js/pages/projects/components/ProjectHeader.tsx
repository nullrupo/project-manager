import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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

interface ProjectHeaderProps {
    project: Project;
    canEdit: boolean;
    onInviteMember: () => void;
    onOpenDetails: () => void;
}

export default function ProjectHeader({ 
    project, 
    canEdit, 
    onInviteMember, 
    onOpenDetails 
}: ProjectHeaderProps) {
    const getShortName = useShortName();

    const getProjectIcon = () => {
        return <Shield className="h-5 w-5 text-orange-500" />;
    };

    const getProjectBadge = () => {
        return (
            <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:bg-orange-950/30">
                <Shield className="h-3 w-3 mr-1" />
                Private
            </Badge>
        );
    };



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
                            <div className="flex items-center gap-2">
                                {getProjectBadge()}
                            </div>
                        </div>
                        
                        {project.description && (
                            <CardDescription className="text-base text-muted-foreground max-w-2xl">
                                {project.description}
                            </CardDescription>
                        )}
                        
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Crown className="h-4 w-4" />
                                <span>Owner: {getShortName(project.owner?.name || 'Unknown')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                        {/* Team Members Preview */}
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                                {project.members?.slice(0, 3).map((member) => (
                                    <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                                        <AvatarImage src={member.avatar} />
                                        <AvatarFallback className="text-xs">
                                            {getShortName(member.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                ))}
                                {project.members && project.members.length > 3 && (
                                    <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                                        <span className="text-xs font-medium text-muted-foreground">
                                            +{project.members.length - 3}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <span className="text-sm text-muted-foreground">
                                {project.members?.length || 0} member{(project.members?.length || 0) !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* Action Buttons */}
                        {canEdit && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onInviteMember}
                                className="shadow-sm hover:shadow-md"
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Invite
                            </Button>
                        )}
                        
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onOpenDetails}
                            className="shadow-sm hover:shadow-md"
                        >
                            <Settings className="h-4 w-4 mr-2" />
                            Details
                        </Button>
                    </div>
                </div>
            </CardHeader>
        </Card>
    );
}
