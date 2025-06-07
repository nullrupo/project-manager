import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Project } from '@/types/project-manager';
import { useCalendarLogic } from '../hooks/useCalendarLogic';
import { formatMonthYear } from '../utils/calendarUtils';

interface ProjectCalendarViewProps {
    project: Project;
    state: any;
}

export default function ProjectCalendarView({ project, state }: ProjectCalendarViewProps) {
    const calendarLogic = useCalendarLogic(project, state);

    if (!calendarLogic.isMounted) {
        return (
            <Card className="rounded-t-none border-t-0 mt-0">
                <CardContent className="flex items-center justify-center h-64">
                    <div className="text-muted-foreground">Loading calendar...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-t-none border-t-0 mt-0">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Calendar
                        </CardTitle>
                        <CardDescription>
                            Drag and drop tasks to reschedule them
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={calendarLogic.navigateToPrevMonth}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-lg font-semibold min-w-[200px] text-center">
                            {formatMonthYear(state.currentDate)}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={calendarLogic.navigateToNextMonth}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {calendarLogic.weeks.map((week, weekIndex) => (
                        week.map((day, dayIndex) => (
                            <div
                                key={`${weekIndex}-${dayIndex}`}
                                className={`min-h-[120px] p-2 border rounded-lg ${
                                    day.isCurrentMonth 
                                        ? 'bg-background border-border' 
                                        : 'bg-muted/30 border-muted text-muted-foreground'
                                } ${
                                    day.date.toDateString() === new Date().toDateString()
                                        ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20'
                                        : ''
                                }`}
                            >
                                <div className="text-sm font-medium mb-1">
                                    {day.date.getDate()}
                                </div>
                                
                                <div className="space-y-1">
                                    {day.tasks.slice(0, 3).map((task: any) => (
                                        <div
                                            key={task.id}
                                            className={`text-xs p-1 rounded truncate cursor-pointer hover:shadow-sm transition-shadow ${
                                                task.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' :
                                                task.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' :
                                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
                                                task.priority === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                                                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                                            }`}
                                            onClick={() => {
                                                state.setSelectedTask(task);
                                                state.setTaskViewModalOpen(true);
                                            }}
                                        >
                                            {task.title}
                                        </div>
                                    ))}
                                    {day.tasks.length > 3 && (
                                        <div className="text-xs text-muted-foreground">
                                            +{day.tasks.length - 3} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ))}
                </div>

                {calendarLogic.allTasks.length === 0 && (
                    <div className="text-center py-16 bg-gradient-to-br from-muted/20 to-muted/40 rounded-xl border-2 border-dashed border-muted-foreground/30 mt-8">
                        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar className="h-10 w-10 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                            No Tasks Scheduled
                        </h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            Tasks with due dates will appear on the calendar. Create tasks with due dates to see them here.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
