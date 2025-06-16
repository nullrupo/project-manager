/**
 * Calendar utility functions for project management
 */

/**
 * Check if a date is today
 */
export const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
};

/**
 * Get the number of days in a month
 */
export const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

/**
 * Get the first day of the month (0 = Sunday, 1 = Monday, etc.)
 */
export const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};

/**
 * Check if a task spans multiple days
 */
export const isMultiDayTask = (task: any): boolean => {
    if (!task.start_date || !task.due_date) return false;
    
    const startDate = new Date(task.start_date);
    const dueDate = new Date(task.due_date);
    
    // Reset time to compare only dates
    startDate.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    return startDate.getTime() !== dueDate.getTime();
};

/**
 * Get the position of a date within a multi-day task
 */
export const getTaskDatePosition = (task: any, date: Date): 'start' | 'middle' | 'end' | 'single' => {
    if (!isMultiDayTask(task)) return 'single';

    const dateStr = date.toISOString().split('T')[0];
    const startDateStr = task.start_date?.split('T')[0];
    const dueDateStr = task.due_date?.split('T')[0];

    if (dateStr === startDateStr && dateStr === dueDateStr) return 'single';
    if (dateStr === startDateStr) return 'start';
    if (dateStr === dueDateStr) return 'end';
    return 'middle';
};

/**
 * Generate calendar days for a given month
 */
export const generateCalendarDays = (currentDate: Date, allTasks: any[] = []) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    const days = [];

    // Previous month's trailing days
    if (firstDay > 0) {
        const prevMonthYear = month === 0 ? year - 1 : year;
        const prevMonthIndex = month === 0 ? 11 : month - 1;
        const daysInPrevMonth = new Date(prevMonthYear, prevMonthIndex + 1, 0).getDate();

        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({
                date: new Date(prevMonthYear, prevMonthIndex, daysInPrevMonth - i),
                isCurrentMonth: false,
                tasks: []
            });
        }
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        
        // Filter tasks for this specific day
        const dayTasks = allTasks.filter(task => {
            if (!task.due_date) return false;
            
            // For single-day tasks, check if due date matches
            if (!isMultiDayTask(task)) {
                return task.due_date.split('T')[0] === dateStr;
            }
            
            // For multi-day tasks, check if date falls within range
            const startDate = task.start_date ? new Date(task.start_date) : new Date(task.due_date);
            const endDate = new Date(task.due_date);
            
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);
            date.setHours(0, 0, 0, 0);
            
            return date >= startDate && date <= endDate;
        });

        days.push({
            date,
            isCurrentMonth: true,
            tasks: dayTasks
        });
    }

    // Next month's leading days to fill the grid
    const totalCells = Math.ceil(days.length / 7) * 7;
    const remainingCells = totalCells - days.length;
    
    if (remainingCells > 0) {
        const nextMonthYear = month === 11 ? year + 1 : year;
        const nextMonthIndex = month === 11 ? 0 : month + 1;
        
        for (let day = 1; day <= remainingCells; day++) {
            days.push({
                date: new Date(nextMonthYear, nextMonthIndex, day),
                isCurrentMonth: false,
                tasks: []
            });
        }
    }

    return days;
};

/**
 * Group calendar days into weeks
 */
export const groupDaysIntoWeeks = (days: any[]): any[][] => {
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }
    return weeks;
};

/**
 * Navigate to previous month
 */
export const navigateToPreviousMonth = (currentDate: Date): Date => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
};

/**
 * Navigate to next month
 */
export const navigateToNextMonth = (currentDate: Date): Date => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
};

/**
 * Format month and year for display
 */
export const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
    });
};
