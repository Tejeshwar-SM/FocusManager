import api from "./api";

const TaskService = {
  // Get all tasks with optional filters
  getTasks: (params?: { limit?: number; status?: string }) => {
    return api.get("/tasks", { params });
  },

  // Get a single task by ID
  getTask: (id: string) => {
    return api.get(`/tasks/${id}`);
  },

  // Create a new task
  createTask: (taskData: any) => {
    return api.post("/tasks", taskData);
  },

  // Update a task
  updateTask: (id: string, taskData: any) => {
    return api.put(`/tasks/${id}`, taskData);
  },

  // Delete a task
  deleteTask: (id: string) => {
    return api.delete(`/tasks/${id}`);
  },

  // Complete a task
  completeTask: (id: string) => {
    return api.put(`/tasks/${id}/complete`);
  },

  // Get task statistics
  getStats: () => {
    return api.get("/tasks/stats");
  },

  // Add new method to update task time
  updateTaskTime: (id: string, completedTime: number) => {
    return api.put(`/tasks/${id}/update-time`, { completedTime });
  },
};

export default TaskService;
