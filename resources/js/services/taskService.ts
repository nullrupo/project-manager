import axios from 'axios';

interface Task {
    id?: number;
    project_id: number;
    parent_task_id?: number | null;
    title: string;
    description?: string | null;
    assignee_id?: number | null;
    reviewer_id?: number | null;
    due_date?: string | null;
    status: 'todo' | 'doing' | 'review' | 'done' | 'archived';
    tags?: number[];
}

interface TaskReview {
    action: 'approve' | 'reject';
    comment?: string;
}

const taskService = {
    /**
     * Get all tasks for the current user
     */
    getTasks: async (search?: string, filter?: string) => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (filter) params.append('filter', filter);
        
        const response = await axios.get(`/api/tasks?${params.toString()}`);
        return response.data;
    },
    
    /**
     * Get a specific task by ID
     */
    getTask: async (id: number) => {
        const response = await axios.get(`/api/tasks/${id}`);
        return response.data.task;
    },
    
    /**
     * Create a new task
     */
    createTask: async (task: Task) => {
        const response = await axios.post('/api/tasks', task);
        return response.data;
    },
    
    /**
     * Update an existing task
     */
    updateTask: async (id: number, task: Partial<Task>) => {
        const response = await axios.put(`/api/tasks/${id}`, task);
        return response.data;
    },
    
    /**
     * Delete a task
     */
    deleteTask: async (id: number) => {
        const response = await axios.delete(`/api/tasks/${id}`);
        return response.data;
    },
    
    /**
     * Review a task (approve or reject)
     */
    reviewTask: async (id: number, review: TaskReview) => {
        const response = await axios.post(`/api/tasks/${id}/review`, review);
        return response.data;
    },
    
    /**
     * Get tasks for a specific project
     */
    getProjectTasks: async (projectId: number, view?: string, from?: string, to?: string) => {
        const params = new URLSearchParams();
        if (view) params.append('view', view);
        if (from) params.append('from', from);
        if (to) params.append('to', to);
        
        const response = await axios.get(`/api/projects/${projectId}/tasks?${params.toString()}`);
        return response.data.tasks;
    }
};

export default taskService;
