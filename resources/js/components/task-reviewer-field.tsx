import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Project, User } from '@/types/project-manager';

interface TaskReviewerFieldProps {
    project: Project;
    members: User[];
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

export default function TaskReviewerField({ 
    project, 
    members, 
    value, 
    onChange, 
    error 
}: TaskReviewerFieldProps) {
    // Only show reviewer field for projects with review completion behavior
    if (project.completion_behavior !== 'review') {
        return null;
    }

    const defaultReviewerName = project.default_reviewer?.name || 'Project default';

    return (
        <div className="space-y-2">
            <Label htmlFor="reviewer_id">Reviewer</Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Select reviewer" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="default">
                        Use project default ({defaultReviewerName})
                    </SelectItem>
                    {members.map((member) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                            {member.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}
            <p className="text-sm text-muted-foreground">
                Override the project's default reviewer for this specific task.
            </p>
        </div>
    );
}
