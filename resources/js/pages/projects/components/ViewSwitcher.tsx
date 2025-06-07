import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu, ListTodo, Calendar } from 'lucide-react';
import { Project } from '@/types/project-manager';
import { updateViewInUrl } from '../utils/projectUtils';

interface ViewSwitcherProps {
    activeView: string;
    setActiveView: (view: string) => void;
    project: Project;
}

export default function ViewSwitcher({ activeView, setActiveView, project }: ViewSwitcherProps) {
    const handleViewChange = (newView: string) => {
        setActiveView(newView);
        updateViewInUrl(newView);
    };

    const getTotalTaskCount = () => {
        return project.boards?.[0]?.lists?.reduce((acc, list) => acc + (list.tasks?.length || 0), 0) || 0;
    };

    return (
        <div className="w-full">
            <div className="flex items-center justify-center gap-1 p-1 bg-muted/50 rounded-lg border">
                <Button
                    variant={activeView === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    className={`flex items-center gap-2 h-10 ${
                        activeView === 'list'
                            ? 'bg-teal-500 text-white shadow-lg hover:bg-teal-600'
                            : 'hover:bg-teal-50 dark:hover:bg-teal-950/50'
                    }`}
                    onClick={() => handleViewChange('list')}
                >
                    <Menu className="h-4 w-4" />
                    <span className="font-medium">List</span>
                    {project.boards && project.boards[0]?.lists && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                            {getTotalTaskCount()}
                        </Badge>
                    )}
                </Button>
                
                <Button
                    variant={activeView === 'board' ? 'default' : 'ghost'}
                    size="sm"
                    className={`flex items-center gap-2 h-10 ${
                        activeView === 'board'
                            ? 'bg-blue-500 text-white shadow-lg hover:bg-blue-600'
                            : 'hover:bg-blue-50 dark:hover:bg-blue-950/50'
                    }`}
                    onClick={() => handleViewChange('board')}
                >
                    <ListTodo className="h-4 w-4" />
                    <span className="font-medium">Board</span>
                </Button>
                
                <Button
                    variant={activeView === 'calendar' ? 'default' : 'ghost'}
                    size="sm"
                    className={`flex items-center gap-2 h-10 ${
                        activeView === 'calendar'
                            ? 'bg-indigo-500 text-white shadow-lg hover:bg-indigo-600'
                            : 'hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
                    }`}
                    onClick={() => handleViewChange('calendar')}
                >
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Calendar</span>
                </Button>
            </div>
        </div>
    );
}
