import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings-layout';
import { HeadingSmall } from '@/components/heading-small';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTaskDisplayPreferences, TaskDisplayPreferences } from '@/hooks/use-task-display-preferences';
import { TaskDisplay } from '@/components/task/TaskDisplay';
import { Task } from '@/types/project-manager';

// Sample task for preview
const sampleTask: Task = {
    id: 1,
    title: 'Sample Task for Preview',
    description: 'This is a sample task description to show how the task display will look with your preferences.',
    list_id: 1,
    project_id: 1,
    created_by: 1,
    reviewer_id: null,
    section_id: null,
    position: 1,
    priority: 'high',
    status: 'in_progress',
    review_status: null,
    estimate: null,
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    start_date: null,
    duration_days: null,
    completed_at: null,
    is_archived: false,
    is_inbox: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    checklist_items: [
        { id: 1, title: 'First checklist item', is_completed: true, task_id: 1, position: 1, created_at: '', updated_at: '' },
        { id: 2, title: 'Second checklist item', is_completed: false, task_id: 1, position: 2, created_at: '', updated_at: '' },
        { id: 3, title: 'Third checklist item', is_completed: true, task_id: 1, position: 3, created_at: '', updated_at: '' },
    ],
    assignees: [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    ],
};

export default function TaskDisplaySettings() {
    const { preferences, updatePreferences, isLoading } = useTaskDisplayPreferences();

    const handleSwitchChange = (field: keyof TaskDisplayPreferences, value: boolean) => {
        updatePreferences({ [field]: value });
    };

    const preferenceOptions = [
        {
            key: 'show_urgency' as keyof TaskDisplayPreferences,
            label: 'Urgency Indicator',
            description: 'Show colored ! icon to indicate task priority (green for low, yellow for medium, red for high)',
        },
        {
            key: 'show_notes' as keyof TaskDisplayPreferences,
            label: 'Notes',
            description: 'Show task description or notes icon when available',
        },
        {
            key: 'show_deadline' as keyof TaskDisplayPreferences,
            label: 'Deadline',
            description: 'Show due date and overdue indicators',
        },
        {
            key: 'show_checklist_progress' as keyof TaskDisplayPreferences,
            label: 'Checklist Progress',
            description: 'Show ✓ icon with completion progress (e.g., ✓ 2/5)',
        },
        {
            key: 'show_assignee' as keyof TaskDisplayPreferences,
            label: 'Assignee',
            description: 'Show assigned users with avatars',
        },
        {
            key: 'show_status' as keyof TaskDisplayPreferences,
            label: 'Status',
            description: 'Show task status badges (To Do, In Progress, Done)',
        },
    ];

    if (isLoading) {
        return (
            <AppLayout>
                <Head title="Task Display Settings" />
                <SettingsLayout>
                    <div className="space-y-6">
                        <HeadingSmall
                            title="Task Display Settings"
                            description="Customize what information is shown on tasks throughout the application"
                        />
                        <div>Loading...</div>
                    </div>
                </SettingsLayout>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Task Display Settings" />
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Task Display Settings"
                        description="Customize what information is shown on tasks throughout the application"
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Display Options</CardTitle>
                                <CardDescription>
                                    Choose which task information to display across the application
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {preferenceOptions.map((option) => (
                                    <div key={option.key} className="flex items-start space-x-3">
                                        <Switch
                                            id={option.key}
                                            checked={preferences[option.key]}
                                            onCheckedChange={(value) => handleSwitchChange(option.key, value)}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label
                                                htmlFor={option.key}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                {option.label}
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                {option.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Preview */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Preview</CardTitle>
                                <CardDescription>
                                    See how tasks will appear with your current settings
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-lg p-4 bg-card">
                                    <TaskDisplay task={sampleTask} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
