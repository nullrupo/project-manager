import React from 'react';
import { router } from '@inertiajs/react';

interface SimpleButtonProps {
    text: string;
    action: 'project' | 'task';
    className?: string;
}

export default function SimpleButton({ text, action, className = '' }: SimpleButtonProps) {
    const handleClick = () => {
        const data = action === 'project' 
            ? {
                name: 'New Project from Button',
                description: 'This project was created from a simple button',
                auto_calc_complete: true
            }
            : {
                project_id: 1, // Use the first project
                title: 'New Task from Button',
                description: 'This task was created from a simple button',
                status: 'todo'
            };
        
        const url = action === 'project' 
            ? '/test/create-project'
            : '/test/create-task';
        
        router.post(url, data, {
            onSuccess: () => {
                alert(`${action === 'project' ? 'Project' : 'Task'} created successfully!`);
                window.location.reload();
            },
            onError: (errors) => {
                console.error('Error:', errors);
                alert(`Error creating ${action}: ${JSON.stringify(errors)}`);
            }
        });
    };
    
    return (
        <button
            type="button"
            className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${className}`}
            onClick={handleClick}
        >
            {text}
        </button>
    );
}
