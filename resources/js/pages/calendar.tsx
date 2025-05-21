import { Head } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const breadcrumbs = [
    { title: 'Calendar', href: '/calendar' }
];

// Calendar data
const currentDate = new Date();

// Generate days for the current month
const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
};

interface Event {
    id: number;
    title: string;
    date: Date;
    project: string;
    status: string;
}

interface CalendarProps {
    events: Event[];
    currentMonth: number;
    currentYear: number;
}

export default function CalendarPage({ events, currentMonth, currentYear }: CalendarProps) {
    const [displayMonth, setDisplayMonth] = useState(currentMonth);
    const [displayYear, setDisplayYear] = useState(currentYear);
    const [displayEvents, setDisplayEvents] = useState<Event[]>(events);
    const [isLoading, setIsLoading] = useState(false);

    const daysInMonth = getDaysInMonth(displayYear, displayMonth);
    const firstDayOfMonth = getFirstDayOfMonth(displayYear, displayMonth);

    // Fetch events when month changes
    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`/calendar?month=${displayMonth + 1}&year=${displayYear}`);
                if (response.data && response.data.events) {
                    // Convert date strings to Date objects
                    const formattedEvents = response.data.events.map((event: any) => ({
                        ...event,
                        date: new Date(event.date)
                    }));
                    setDisplayEvents(formattedEvents);
                }
            } catch (error) {
                console.error('Error fetching events:', error);
            } finally {
                setIsLoading(false);
            }
        };

        // Only fetch if the month/year is different from the initial data
        if (displayMonth !== currentMonth || displayYear !== currentYear) {
            fetchEvents();
        }
    }, [displayMonth, displayYear]);

    // Navigate to previous month
    const goToPreviousMonth = () => {
        if (displayMonth === 0) {
            setDisplayMonth(11);
            setDisplayYear(displayYear - 1);
        } else {
            setDisplayMonth(displayMonth - 1);
        }
    };

    // Navigate to next month
    const goToNextMonth = () => {
        if (displayMonth === 11) {
            setDisplayMonth(0);
            setDisplayYear(displayYear + 1);
        } else {
            setDisplayMonth(displayMonth + 1);
        }
    };

    // Get month name
    const getMonthName = (month: number) => {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return monthNames[month];
    };

    // Get events for a specific day
    const getEventsForDay = (day: number) => {
        return displayEvents.filter(event =>
            event.date.getDate() === day &&
            event.date.getMonth() === displayMonth &&
            event.date.getFullYear() === displayYear
        );
    };

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'todo':
                return 'bg-gray-100 dark:bg-gray-800';
            case 'doing':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'review':
                return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
            case 'done':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            default:
                return 'bg-gray-100 dark:bg-gray-800';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Calendar" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Calendar header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Calendar</h1>
                        <p className="text-muted-foreground">View and manage your schedule</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-lg font-medium">
                                {getMonthName(displayMonth)} {displayYear}
                            </div>
                            <Button variant="outline" size="icon" onClick={goToNextMonth}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button onClick={() => window.location.href = '/my-tasks'}>
                            <Plus className="mr-1 h-4 w-4" />
                            Add Event
                        </Button>
                    </div>
                </div>

                {/* Calendar grid */}
                <Card>
                    <CardContent className="p-4">
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                                <div className="text-center">
                                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                                    <p className="mt-2 text-sm text-muted-foreground">Loading events...</p>
                                </div>
                            </div>
                        )}
                        {/* Day names */}
                        <div className="grid grid-cols-7 gap-1 text-center font-medium">
                            <div className="p-2">Sun</div>
                            <div className="p-2">Mon</div>
                            <div className="p-2">Tue</div>
                            <div className="p-2">Wed</div>
                            <div className="p-2">Thu</div>
                            <div className="p-2">Fri</div>
                            <div className="p-2">Sat</div>
                        </div>

                        {/* Calendar days */}
                        <div className="grid grid-cols-7 gap-1">
                            {/* Empty cells for days before the first day of the month */}
                            {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                                <div key={`empty-${index}`} className="min-h-24 border border-dashed p-1"></div>
                            ))}

                            {/* Days of the month */}
                            {Array.from({ length: daysInMonth }).map((_, index) => {
                                const day = index + 1;
                                const isToday = day === currentDate.getDate() &&
                                                displayMonth === currentDate.getMonth() &&
                                                displayYear === currentDate.getFullYear();
                                const dayEvents = getEventsForDay(day);

                                return (
                                    <div
                                        key={`day-${day}`}
                                        className={`min-h-24 border p-1 ${isToday ? 'bg-muted/50 font-bold' : ''}`}
                                    >
                                        <div className="flex justify-end p-1">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full text-sm">
                                                {day}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            {dayEvents.map(event => (
                                                <div
                                                    key={event.id}
                                                    className={`rounded px-2 py-1 text-xs ${getStatusColor(event.status)}`}
                                                >
                                                    {event.title}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
