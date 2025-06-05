import React from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Project, User } from '@/types/project-manager';

interface ProjectReviewerSettingsProps {
    project: Project;
    members: User[];
}

export default function ProjectReviewerSettings({ project, members }: ProjectReviewerSettingsProps) {
    const { data, setData, put, processing, errors } = useForm({
        default_reviewer_id: project.default_reviewer_id?.toString() || 'none',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('projects.update', project.id), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Only show reviewer settings for projects with review completion behavior
    if (project.completion_behavior !== 'review') {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Review Settings</CardTitle>
                <CardDescription>
                    Configure default reviewer for tasks in this project
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="default_reviewer_id">Default Reviewer</Label>
                        <Select
                            value={data.default_reviewer_id}
                            onValueChange={(value) => setData('default_reviewer_id', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a default reviewer" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No default reviewer</SelectItem>
                                {members.map((member) => (
                                    <SelectItem key={member.id} value={member.id.toString()}>
                                        {member.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.default_reviewer_id && (
                            <p className="text-sm text-red-600">{errors.default_reviewer_id}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                            Tasks will be assigned to this reviewer by default when submitted for review.
                            Individual tasks can override this setting.
                        </p>
                    </div>

                    <Button type="submit" disabled={processing}>
                        {processing ? 'Saving...' : 'Save Settings'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
