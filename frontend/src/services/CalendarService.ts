import api from "./api";

const CalendarService = {
  // Get calendar events within a date range
  getEvents: (start: Date, end: Date) => {
    return api.get("/calendar/events", {
      params: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    });
  },

  // Create calendar event (tasks)
  createTaskEvent: (taskData: any) => {
    return api.post("/tasks", taskData);
  },

  // Update calendar event (tasks)
  updateTaskEvent: (id: string, taskData: any) => {
    return api.put(`/tasks/${id}`, taskData);
  },
  
  // Delete calendar event (tasks)
  deleteTaskEvent: (id: string) => {
    return api.delete(`/tasks/${id}`);
  },

  // Create calendar event (sessions)
  createSessionEvent: (sessionData: any) => {
    return api.post("/pomodoro", sessionData);
  },
  
  // Delete calendar event (sessions)
  deleteSessionEvent: (id: string) => {
    return api.delete(`/pomodoro/${id}`);
  }
};

export default CalendarService;