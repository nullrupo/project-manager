import React, { createContext, useContext, useState, ReactNode } from 'react';
import UndoNotification from '@/components/ui/undo-notification';

interface UndoNotification {
    id: string;
    message: string;
    undoUrl: string;
    duration?: number;
}

interface UndoNotificationContextType {
    showUndoNotification: (message: string, undoUrl: string, duration?: number) => void;
    hideNotification: (id: string) => void;
}

const UndoNotificationContext = createContext<UndoNotificationContextType | undefined>(undefined);

export const useUndoNotification = () => {
    const context = useContext(UndoNotificationContext);
    if (!context) {
        throw new Error('useUndoNotification must be used within an UndoNotificationProvider');
    }
    return context;
};

interface UndoNotificationProviderProps {
    children: ReactNode;
}

export const UndoNotificationProvider: React.FC<UndoNotificationProviderProps> = ({ children }) => {
    const [notifications, setNotifications] = useState<UndoNotification[]>([]);

    const showUndoNotification = (message: string, undoUrl: string, duration = 3000) => {
        const id = Date.now().toString();
        const notification: UndoNotification = {
            id,
            message,
            undoUrl,
            duration
        };

        setNotifications(prev => [...prev, notification]);
    };

    const hideNotification = (id: string) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    };

    return (
        <UndoNotificationContext.Provider value={{ showUndoNotification, hideNotification }}>
            {children}
            
            {/* Render notifications */}
            <div className="fixed bottom-4 right-4 z-50 space-y-2">
                {notifications.map((notification, index) => (
                    <div 
                        key={notification.id}
                        style={{ 
                            transform: `translateY(-${index * 10}px)`,
                            zIndex: 50 - index 
                        }}
                    >
                        <UndoNotification
                            message={notification.message}
                            undoUrl={notification.undoUrl}
                            duration={notification.duration}
                            onClose={() => hideNotification(notification.id)}
                        />
                    </div>
                ))}
            </div>
        </UndoNotificationContext.Provider>
    );
};
