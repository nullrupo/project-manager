import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Undo2 } from 'lucide-react';
import { router } from '@inertiajs/react';
import { fetchWithCsrf } from '@/utils/csrf';

interface UndoNotificationProps {
    message: string;
    undoUrl: string;
    onClose: () => void;
    duration?: number; // Duration in milliseconds
}

export default function UndoNotification({ 
    message, 
    undoUrl, 
    onClose, 
    duration = 3000 
}: UndoNotificationProps) {
    const [progress, setProgress] = useState(100);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                const newProgress = prev - (100 / (duration / 100));
                if (newProgress <= 0) {
                    clearInterval(interval);
                    handleClose();
                    return 0;
                }
                return newProgress;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [duration]);

    const handleUndo = () => {
        // Make the undo request
        fetchWithCsrf(undoUrl, {
            method: 'POST',
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Reload the page to show the restored task
                router.reload();
            } else {
                console.error('Failed to undo:', data);
            }
        })
        .catch(error => {
            console.error('Failed to undo:', error);
        });

        handleClose();
    };

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}>
            <div className="bg-background border border-border rounded-lg shadow-lg p-4 min-w-[320px] max-w-[400px]">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-foreground">{message}</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={handleClose}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUndo}
                        className="flex items-center gap-2"
                    >
                        <Undo2 className="h-3 w-3" />
                        Undo
                    </Button>
                    <span className="text-xs text-muted-foreground">
                        {Math.ceil(progress / 100 * (duration / 1000))}s
                    </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-1">
                    <div 
                        className="bg-primary h-1 rounded-full transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
