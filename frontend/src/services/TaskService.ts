import api from "./api";
import { TaskStatus, CalendarEntryType, TaskPriority } from "../types/types";

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
    const cleanedData = { ...taskData };
    
    // Add required fields if missing
    if (!cleanedData.type) {
      cleanedData.type = CalendarEntryType.TASK;
    }
    
    if (!cleanedData.start) {
      cleanedData.start = new Date();
    }
    
    if (cleanedData.allDay === undefined) {
      cleanedData.allDay = true;
    }
    
    // Ensure tasks always have a priority
    if (cleanedData.type === CalendarEntryType.TASK && !cleanedData.priority) {
      cleanedData.priority = TaskPriority.MEDIUM;
    }
    
    console.log('Creating task with data:', cleanedData);
    
    return api.post("/tasks", cleanedData);
  },

  // Update a task
  updateTask: (id: string, taskData: any) => {
    // Ensure taskData is properly structured with all required fields
    const cleanedData = { ...taskData };
    
    // Make sure type is always included - required by backend validation
    if (!cleanedData.type) {
      cleanedData.type = CalendarEntryType.TASK;
    }
    
    // Make sure start is always included - required by backend validation
    if (!cleanedData.start) {
      cleanedData.start = new Date();
    }
    
    // Ensure tasks always have a priority
    if (cleanedData.type === CalendarEntryType.TASK && !cleanedData.priority) {
      cleanedData.priority = TaskPriority.MEDIUM;
    }
    
    // Ensure we're not sending any undefined fields which may cause validation issues
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key] === undefined) {
        delete cleanedData[key];
      }
    });
    
    // For debugging
    console.log('Updating task with data:', cleanedData);
    
    return api.put(`/tasks/${id}`, cleanedData);
  },

  // Delete a task
  deleteTask: (id: string) => {
    return api.delete(`/tasks/${id}`);
  },

  // Complete a task
  completeTask: (id: string) => {
    return api.put(`/tasks/${id}`, { 
      status: TaskStatus.COMPLETED,
      type: CalendarEntryType.TASK, // Always include type to avoid validation errors
      priority: TaskPriority.MEDIUM  // Include default priority if missing
    });
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